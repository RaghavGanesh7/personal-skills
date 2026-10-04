#!/usr/bin/env bash
# Read-only readiness report for running Hermes Agent on a home server.
# Changes nothing; prints OK / TODO per item.

ok()   { printf '  [OK]   %s\n' "$1"; }
todo() { printf '  [TODO] %s\n' "$1"; }

echo "== Host =="
. /etc/os-release 2>/dev/null && ok "OS: ${PRETTY_NAME:-unknown}"
ok "RAM: $(free -h | awk '/^Mem:/ {print $2}')  CPUs: $(nproc)"

echo "== Always-on =="
if ls /sys/class/power_supply/BAT* /proc/acpi/button/lid/* >/dev/null 2>&1; then
    lid=$(grep -hsE '^\s*HandleLidSwitch=' /etc/systemd/logind.conf /etc/systemd/logind.conf.d/*.conf | tail -1)
    [[ "$lid" == *ignore* ]] && ok "Lid close ignored" || todo "Lid close still suspends (Phase 1)"
else
    ok "No battery or lid detected: lid settings irrelevant"
fi
[ "$(systemctl is-enabled suspend.target 2>/dev/null)" = masked ] && ok "Suspend masked" || todo "Suspend not masked (Phase 1)"
[ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" = yes ] && ok "Linger enabled" || todo "Linger off (Phase 5)"

echo "== Network =="
if command -v tailscale >/dev/null; then
    ts=$(tailscale status --self --peers=false 2>/dev/null | head -1)
    [ -n "$ts" ] && ok "Tailscale: $ts" || todo "Tailscale installed but not logged in"
else
    todo "Tailscale missing (homelab-gateway skill)"
fi

echo "== Claude Code =="
if command -v claude >/dev/null; then
    ok "claude $(claude --version 2>/dev/null | head -1) at $(command -v claude)"
    claude auth status >/dev/null 2>&1 && ok "claude logged in" || todo "Run: claude auth login"
else
    todo "claude CLI missing (needed for subscription provider)"
fi

echo "== Hermes =="
if command -v hermes >/dev/null; then
    ok "hermes $(hermes --version 2>/dev/null | head -1)"
    [ -f "$HOME/.hermes/.env" ] && {
        perms=$(stat -c %a "$HOME/.hermes/.env")
        [ "$perms" = 600 ] && ok ".env mode 600" || todo ".env mode is $perms; run chmod 600 ~/.hermes/.env"
        grep -q '^TELEGRAM_ALLOWED_USERS=.' "$HOME/.hermes/.env" && ok "Telegram allowlist set" \
            || { grep -q '^TELEGRAM_BOT_TOKEN=' "$HOME/.hermes/.env" \
                 && todo "No Telegram allowlist: approve yourself with 'hermes pairing approve telegram <CODE>' (check 'hermes pairing list')"; }
    }
    state=$(systemctl --user is-active hermes-gateway 2>/dev/null)
    [ "$state" = active ] && ok "hermes-gateway active" || todo "hermes-gateway: ${state:-not installed} (Phase 5)"
else
    todo "hermes not installed (Phase 2)"
fi
