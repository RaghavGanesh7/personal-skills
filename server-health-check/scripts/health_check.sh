#!/usr/bin/env bash
# Read-only health report for a Linux home server, meant for after a reboot or power cut.
# Changes nothing. Prints OK / WARN / FAIL per item and a summary line.
#
# Usage: health_check.sh [--config FILE] [--problems-only]
# Exit:  0 all OK, 1 warnings only, 2 at least one failure.
#
# Config (optional, sourced as bash): ${XDG_CONFIG_HOME:-$HOME/.config}/server-health/checks.conf
# See templates/checks.conf for every setting. Without a config the script auto-detects
# what it can (enabled common units, Docker restart policies, Tailscale, MagicDNS URL).

CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/server-health/checks.conf"
PROBLEMS_ONLY=0
while [ $# -gt 0 ]; do
    case "$1" in
        --config) CONFIG="$2"; shift 2 ;;
        --problems-only) PROBLEMS_ONLY=1; shift ;;
        -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
        *) echo "unknown option: $1" >&2; exit 64 ;;
    esac
done

# ---- defaults (overridden by the config file) ----
REQUIRED_UNITS=()          # system units that must be active; empty = auto-detect
REQUIRED_USER_UNITS=()     # systemd --user units that must be active
EXPECTED_IP=""             # e.g. "wlo1=192.168.1.3"
URLS=()                    # URLs that must answer 2xx/3xx; empty = MagicDNS root if Tailscale is up
LOG_CHECKS=()              # "scope:unit|good-regex|bad-regex" (scope = system|user), searched since boot
CMD_CHECKS=()              # "label|shell command that must exit 0"
DISK_WARN=80; DISK_FAIL=90
SETTLE_SECONDS=180         # warn that results may be premature when uptime is lower
CURL_TIMEOUT=8

# shellcheck source=/dev/null
[ -f "$CONFIG" ] && . "$CONFIG"

ok_n=0; warn_n=0; fail_n=0
ok()   { ok_n=$((ok_n+1));   [ "$PROBLEMS_ONLY" = 1 ] || printf '  [OK]   %s\n' "$1"; }
warn() { warn_n=$((warn_n+1)); printf '  [WARN] %s\n' "$1"; }
fail() { fail_n=$((fail_n+1)); printf '  [FAIL] %s\n' "$1"; }
section() { [ "$PROBLEMS_ONLY" = 1 ] || printf '\n== %s ==\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------- host
section "Host"
up_s=$(cut -d. -f1 /proc/uptime)
ok "Up $((up_s/3600))h $((up_s%3600/60))m since $(uptime -s), load $(cut -d' ' -f1-3 /proc/loadavg)"
[ "$up_s" -lt "$SETTLE_SECONDS" ] && warn "Booted under ${SETTLE_SECONDS}s ago; services may still be starting, re-run shortly"
[ -f "$CONFIG" ] && ok "Config: $CONFIG" || ok "No config at $CONFIG; using auto-detection"

while read -r pct mnt; do
    p=${pct%\%}
    if   [ "$p" -ge "$DISK_FAIL" ]; then fail "Disk $mnt at $pct"
    elif [ "$p" -ge "$DISK_WARN" ]; then warn "Disk $mnt at $pct"
    else ok "Disk $mnt at $pct"; fi
done < <(df -P -x tmpfs -x devtmpfs -x squashfs -x overlay -x efivarfs 2>/dev/null | awk 'NR>1 {print $5, $6}')

mem_avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
[ "$mem_avail" -lt 256 ] && warn "Only ${mem_avail} MiB RAM available" || ok "RAM available: ${mem_avail} MiB"

# ---------------------------------------------------------------- systemd
section "systemd"
state=$(systemctl is-system-running 2>/dev/null)
case "$state" in
    running) ok "System state: running" ;;
    starting) warn "System state: starting (boot not finished)" ;;
    *) fail "System state: $state" ;;
esac
failed=$(systemctl --failed --no-legend --plain 2>/dev/null | awk '{print $1}' | xargs)
[ -n "$failed" ] && fail "Failed system units: $failed" || ok "No failed system units"
ufailed=$(systemctl --user --failed --no-legend --plain 2>/dev/null | awk '{print $1}' | xargs)
[ -n "$ufailed" ] && fail "Failed user units: $ufailed" || ok "No failed user units"

if [ ${#REQUIRED_UNITS[@]} -eq 0 ]; then
    for u in docker.service containerd.service tailscaled.service ssh.service ssh.socket sshd.service \
             cockpit.socket cron.service NetworkManager.service; do
        [ "$(systemctl is-enabled "$u" 2>/dev/null)" = enabled ] && REQUIRED_UNITS+=("$u")
    done
fi
for u in "${REQUIRED_UNITS[@]}"; do
    s=$(systemctl is-active "$u" 2>/dev/null)
    [ "$s" = active ] && ok "$u active" || fail "$u is $s"
done
for u in "${REQUIRED_USER_UNITS[@]}"; do
    s=$(systemctl --user is-active "$u" 2>/dev/null)
    [ "$s" = active ] && ok "user $u active" || fail "user $u is $s"
done

if [ ${#REQUIRED_USER_UNITS[@]} -gt 0 ]; then
    [ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" = yes ] \
        && ok "Linger on (user units start at boot)" \
        || warn "Linger off: user units only start after a login (sudo loginctl enable-linger $USER)"
fi
if ls /sys/class/power_supply/BAT* >/dev/null 2>&1; then
    [ "$(systemctl is-enabled suspend.target 2>/dev/null)" = masked ] \
        && ok "Laptop: suspend masked" || warn "Laptop: suspend.target not masked, server may sleep"
fi

# ---------------------------------------------------------------- docker
if have docker; then
    section "Docker"
    if ! docker info >/dev/null 2>&1; then
        fail "Docker daemon unreachable (or $USER not in docker group)"
    else
        n=0
        while read -r name policy status health restarts; do
            n=$((n+1)); name=${name#/}; [ "$health" = - ] && health=""
            case "$policy" in always|unless-stopped|on-failure) must_run=1 ;; *) must_run=0 ;; esac
            if [ "$must_run" = 1 ] && [ "$status" != running ]; then
                fail "$name is $status (restart policy $policy)"
            elif [ "$health" = unhealthy ]; then
                fail "$name is unhealthy"
            elif [ "$health" = starting ]; then
                warn "$name health check still starting"
            elif [ "$restarts" -gt 0 ] 2>/dev/null; then
                warn "$name running but restarted $restarts time(s)"
            elif [ "$status" = running ]; then
                ok "$name running${health:+ ($health)}"
            fi
        done < <(docker ps -aq | xargs -r docker inspect -f \
            '{{.Name}} {{.HostConfig.RestartPolicy.Name}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}-{{end}} {{.RestartCount}}')
        [ "$n" = 0 ] && ok "No containers defined"
    fi
fi

# ---------------------------------------------------------------- network
section "Network"
if ip route show default 2>/dev/null | grep -q .; then
    ok "Default route via $(ip route show default | awk '{print $3; exit}')"
else
    fail "No default route"
fi
if [ -n "$EXPECTED_IP" ]; then
    iface=${EXPECTED_IP%%=*}; want=${EXPECTED_IP#*=}
    ip -4 -o addr show "$iface" 2>/dev/null | grep -q " $want/" \
        && ok "$iface has $want" || fail "$iface does not have $want (has: $(ip -4 -o addr show "$iface" 2>/dev/null | awk '{print $4}' | xargs))"
fi
getent hosts github.com >/dev/null && ok "DNS resolves" || fail "DNS lookup failed"
curl -fsS -m "$CURL_TIMEOUT" -o /dev/null https://1.1.1.1 2>/dev/null && ok "Internet reachable" || fail "Internet unreachable"

magic=""
if have tailscale; then
    section "Tailscale"
    ts_json=$(tailscale status --json 2>/dev/null)
    backend=$(printf '%s' "$ts_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("BackendState",""))' 2>/dev/null)
    if [ "$backend" = Running ]; then
        magic=$(printf '%s' "$ts_json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))' 2>/dev/null)
        peers=$(printf '%s' "$ts_json" | python3 -c 'import json,sys; print(sum(1 for p in (json.load(sys.stdin).get("Peer") or {}).values() if p.get("Online")))' 2>/dev/null)
        ok "Tailscale running as $magic, $peers peer(s) online"
    else
        fail "Tailscale backend state: ${backend:-unknown}"
    fi
fi

# ---------------------------------------------------------------- endpoints
[ ${#URLS[@]} -eq 0 ] && [ -n "$magic" ] && URLS=("https://$magic/")
if [ ${#URLS[@]} -gt 0 ]; then
    section "Endpoints"
    for url in "${URLS[@]}"; do
        code=$(curl -s -o /dev/null -m "$CURL_TIMEOUT" -w '%{http_code}' "$url")
        case "$code" in
            2??|3??) ok "$code $url" ;;
            000) fail "no response from $url" ;;
            *) fail "$code $url" ;;
        esac
    done
fi

# ---------------------------------------------------------------- logs since boot
if [ ${#LOG_CHECKS[@]} -gt 0 ]; then
    section "Logs since boot"
    for entry in "${LOG_CHECKS[@]}"; do
        IFS='|' read -r target good bad <<<"$entry"
        scope=${target%%:*}; unit=${target#*:}
        flag=(); [ "$scope" = user ] && flag=(--user)
        # Only the current run of the unit counts: earlier failures it recovered from are history.
        since=$(systemctl "${flag[@]}" show "$unit" -p ActiveEnterTimestamp --value 2>/dev/null)
        [ -z "$since" ] || [ "$since" = n/a ] && since=$(uptime -s)
        log=$(journalctl "${flag[@]}" -u "$unit" --since "$since" --no-pager -o cat 2>/dev/null)
        if [ -n "$bad" ] && grep -qiE "$bad" <<<"$log" && ! grep -qiE "$good" <<<"$log"; then
            fail "$unit: log shows /$bad/ and never /$good/"
        elif grep -qiE "$good" <<<"$log"; then
            ok "$unit: /$good/ seen"
        else
            warn "$unit: /$good/ not seen yet"
        fi
    done
fi

# ---------------------------------------------------------------- custom commands
if [ ${#CMD_CHECKS[@]} -gt 0 ]; then
    section "Custom checks"
    for entry in "${CMD_CHECKS[@]}"; do
        label=${entry%%|*}; cmd=${entry#*|}
        if timeout 30 bash -c "$cmd" >/dev/null 2>&1; then ok "$label"; else fail "$label  ($cmd)"; fi
    done
fi

# ---------------------------------------------------------------- summary
printf '\nSummary: %d OK, %d WARN, %d FAIL\n' "$ok_n" "$warn_n" "$fail_n"
[ "$fail_n" -gt 0 ] && exit 2
[ "$warn_n" -gt 0 ] && exit 1
exit 0
