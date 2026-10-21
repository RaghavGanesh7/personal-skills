---
name: server-health-check
description: >-
  Verify that a Linux home server came back healthy after a reboot, power cut or update, and fix the
  usual post-boot problems. Runs a read-only check script covering systemd units (system and user),
  Docker containers and restart policies, disk and memory, LAN IP, DNS and internet, Tailscale,
  HTTPS endpoints, log assertions since boot and custom commands, driven by a per-host config file.
  Use when the user says the server restarted, rebooted, lost power, or asks to check that everything
  is up and running.
metadata:
  version: 1.0.0
  author: Raghav Ganesh
  license: MIT
  tags:
    - homelab
    - health-check
    - systemd
    - docker
    - tailscale
    - reboot
    - monitoring
---

# Server Health Check Skill

Answers one question after a restart: **is everything that should be running actually running?**
The script only reads state; fixes are a separate, deliberate step.

Pairs with the `homelab-gateway` (Caddy, Tailscale, Portainer, Cockpit) and `hermes-agent` skills,
but works on any systemd + Docker host.

---

## 1. When to Activate

- "My server was restarted / rebooted / lost power, check everything is up."
- "Is the home server healthy?", "did all services come back?"
- After a kernel/OS update, Docker upgrade, or edits to unit files.
- Setting up health checks for a new server (write its `checks.conf`).

---

## 2. Files

| Path | Purpose |
| :--- | :--- |
| `scripts/health_check.sh` | Read-only checker. Prints `[OK]` / `[WARN]` / `[FAIL]` and a summary. Exit 0 = OK, 1 = warnings, 2 = failures |
| `templates/checks.conf` | Commented config template listing every setting |
| `~/.config/server-health/checks.conf` | The host's own config (not in this repo). Override with `--config FILE` |

What it checks:

| Section | Checks | Auto-detected without config |
| :--- | :--- | :--- |
| Host | Uptime (warns if still settling), disk usage per mount, available RAM | Yes |
| systemd | `is-system-running`, failed system and user units, `REQUIRED_UNITS`, `REQUIRED_USER_UNITS`, linger, laptop suspend masked | Enabled units among docker, containerd, tailscaled, ssh, cockpit, cron, NetworkManager |
| Docker | Containers with `always` / `unless-stopped` / `on-failure` must be running; unhealthy; restart counts | Yes |
| Network | Default route, `EXPECTED_IP`, DNS, internet | All but `EXPECTED_IP` |
| Tailscale | Backend `Running`, MagicDNS name, peers online | Yes, if installed |
| Endpoints | `URLS` return 2xx/3xx | MagicDNS root |
| Logs | `LOG_CHECKS`: a good pattern must appear in the unit's current run, bad pattern alone = FAIL | No |
| Custom | `CMD_CHECKS`: any shell command that exits 0 when healthy | No |

---

## 3. Workflow

### Step 1: Gather context
Read the host's runbook if one exists (for this user: `~/home-server/home-server.md`, section
"Power-Loss / Reboot Recovery"). It lists known post-boot quirks that a generic check cannot know.

### Step 2: Make sure a config exists
```bash
ls ~/.config/server-health/checks.conf
```
If missing, the script still runs with auto-detection. For a real server, write one: copy
`templates/checks.conf` and fill it from what is actually deployed:

```bash
systemctl list-unit-files --state=enabled --no-legend | awk '{print $1}'
systemctl --user list-unit-files --state=enabled --no-legend | awk '{print $1}'
docker ps -a --format '{{.Names}}\t{{.Ports}}'
ip -4 -o addr show | awk '{print $2, $4}'
tailscale status --self --peers=false
```
Add a `LOG_CHECKS` entry for any service that can be "active" but not working (a bot that failed to
connect, a sync job that cannot reach its remote), and `CMD_CHECKS` for logins, cron jobs and APIs.
Never put secrets in the config; it is plain bash.

### Step 3: Run the check
```bash
bash <skill-dir>/scripts/health_check.sh            # full report
bash <skill-dir>/scripts/health_check.sh --problems-only
```
If the host booted less than `SETTLE_SECONDS` ago (default 180) and something is still starting,
wait a minute with a polling loop rather than a fixed sleep, then re-run before diagnosing.

### Step 4: Diagnose each WARN / FAIL
Look before acting:
```bash
systemctl status <unit> --no-pager;            journalctl -u <unit> -b --no-pager | tail -50
systemctl --user status <unit> --no-pager;     journalctl --user -u <unit> -b --no-pager | tail -50
docker logs --tail 50 <container>;             docker inspect -f '{{.State}}' <container>
```

### Step 5: Fix (known post-boot issues)

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| User unit active but its log shows "No adapter", "connection refused", DNS errors | Started before the network was up | `systemctl --user restart <unit>`, then re-check its log. Lasting fix: `After=network-online.target` + `Wants=network-online.target` in the unit |
| User units not running at all | Linger off | `sudo loginctl enable-linger $USER` |
| Container `exited` with restart policy `no` | Started by hand, never given a policy | `docker update --restart unless-stopped <name>`, then `docker start <name>` |
| Container restart loop | Bad config / missing mount / port clash | `docker logs`; fix the cause, do not just restart |
| Endpoint `000` / 502 | Reverse proxy up, backend down (or vice versa) | Check the backend container/unit first, then the proxy logs |
| Tailscale `NeedsLogin` / `Stopped` | Key expired or `tailscale down` | `sudo tailscale up`; user may need to re-auth in the browser |
| LAN IP changed | DHCP lease, static IP not set | Re-apply the static IP in NetworkManager (see homelab-gateway skill) |
| System state `degraded` | One failed unit | `systemctl --failed`, then `journalctl -u <unit> -b` |

Rules:
- Restarting a single failed service or container is fine. Ask before anything broader: `docker
  compose down`, reboots, package updates, deleting volumes, `tailscale logout`, changing configs.
- Fix the cause, not only the symptom. If a fix is a known recurring quirk, add a `LOG_CHECKS` or
  `CMD_CHECKS` entry so the next run catches it.

### Step 6: Verify and report
Re-run the script until it exits 0 (or only expected WARNs remain). Report to the user in a short
table: component, state, anything that was fixed and how. Mention anything left for them to do.

### Step 7: Keep the runbook in sync
If a new quirk or fix was found, add it to the host's runbook and to this skill's Step 5 table.

---

## 4. Optional: run it automatically after boot

A user-level oneshot timer that runs 5 minutes after boot and logs the result:
```ini
# ~/.config/systemd/user/server-health.service
[Unit]
Description=Post-boot server health check
[Service]
Type=oneshot
ExecStart=%h/.agents/skills/server-health-check/scripts/health_check.sh --problems-only

# ~/.config/systemd/user/server-health.timer
[Unit]
Description=Run server health check after boot
[Timer]
OnBootSec=5min
[Install]
WantedBy=timers.target
```
```bash
systemctl --user daemon-reload && systemctl --user enable --now server-health.timer
journalctl --user -u server-health -b      # read the result
```
Needs linger so it runs without a login. Pipe the output to a notifier (Telegram bot, ntfy) if alerts
are wanted.
