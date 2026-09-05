#!/usr/bin/env bash
# ==============================================================================
# detect_services.sh - System & Service Discovery for Homelab Gateway Skill
# ==============================================================================
set -eo pipefail

echo "=== Homelab Discovery Report ==="
echo "Date: $(date -Iseconds)"
echo "Hostname: $(hostname)"

# 1. Network Interface & IP
DEFAULT_IFACE=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1)}')
CURRENT_IP=$(ip -4 addr show "${DEFAULT_IFACE}" 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)
DEFAULT_GATEWAY=$(ip route show default 2>/dev/null | awk '/default/ {print $3}' | head -n1)

echo "--- Network ---"
echo "Primary Interface: ${DEFAULT_IFACE:-unknown}"
echo "Current LAN IP:    ${CURRENT_IP:-unknown}"
echo "Default Gateway:   ${DEFAULT_GATEWAY:-unknown}"

# NetworkManager Connection
if command -v nmcli >/dev/null 2>&1; then
    ACTIVE_CON=$(nmcli -t -f DEVICE,NAME connection show --active 2>/dev/null | grep "^${DEFAULT_IFACE}:" | cut -d: -f2 || true)
    echo "NetworkManager Profile: ${ACTIVE_CON:-None}"
fi

# 2. Tailscale Status
echo "--- Tailscale ---"
if command -v tailscale >/dev/null 2>&1; then
    TS_STATUS=$(tailscale status 2>/dev/null || echo "not running")
    TS_IP=$(tailscale ip -4 2>/dev/null || echo "None")
    TS_DOMAIN=$(tailscale status --json 2>/dev/null | grep -E 'MagicDNSSuffix' | head -n1 | awk -F'"' '{print $4}' || echo "None")
    TS_NAME=$(tailscale status --json 2>/dev/null | grep -E '"Self"' -A 5 | grep '"DNSName"' | head -n1 | awk -F'"' '{print $4}' | sed 's/\.$//' || echo "None")
    echo "Tailscale Installed: Yes"
    echo "Tailscale IP:        ${TS_IP}"
    echo "Tailscale Hostname:  ${TS_NAME}"
    echo "Tailnet Suffix:      ${TS_DOMAIN}"
else
    echo "Tailscale Installed: No"
fi

# 3. Running Docker Containers
echo "--- Docker Containers ---"
if command -v docker >/dev/null 2>&1; then
    echo "Docker Installed: Yes"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
else
    echo "Docker Installed: No"
fi

# 4. Listening Web & Homelab Ports
echo "--- Known Homelab Listening Ports ---"
ss -tulpn 2>/dev/null | grep -E ':(80|443|8000|8080|8096|8123|8443|9000|9090|9443)\b' || echo "No standard homelab ports detected."

echo "=== End of Report ==="
