# [Server Name / Service Name] Setup Reference

## 1. Server & Access Details

| Property | Value | Description |
| :--- | :--- | :--- |
| **Hostname / IP** | `{{SERVER_IP}}` | Local network or public IP |
| **OS** | `{{OS_VERSION}}` | Linux distribution and release |
| **SSH User** | `{{SSH_USER}}` | Default administrative account |
| **SSH Command** | `ssh {{SSH_USER}}@{{SERVER_IP}}` | Standard connection string |
| **SSH Key** | `{{SSH_KEY_PATH}}` | Key used for authentication |
| **Sudo Privileges** | `{{SUDO_CONFIG}}` | Passwordless sudo / user permissions |

---

## 2. Disk & Storage Architecture

| Drive Type | Mount Point | Capacity | Purpose / Allocation |
| :--- | :--- | :--- | :--- |
| **Fast SSD** | `{{SSD_MOUNT}}` | `{{SSD_SIZE}}` | High-IOPS data: Docker root, databases, configs, container overlays |
| **Bulk HDD** | `{{HDD_MOUNT}}` | `{{HDD_SIZE}}` | Cold/bulk storage: Media, downloads, archives, long-term backups |

---

## 3. Core Engine & Service Configuration

* **Engine**: `{{ENGINE_VERSION}}`
* **Configuration File**: `{{CONFIG_PATH}}`
* **Data Root**: `{{DATA_ROOT}}`
* **Log Policy**: `{{LOG_POLICY}}`

### Configuration Content:
```json
{{CONFIG_CONTENT}}
```

---

## 4. Deployed Applications & Endpoints

| Service | Port(s) | Protocol | URL / Endpoint | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `{{SERVICE_NAME}}` | `{{PORTS}}` | HTTP/HTTPS | `{{URL}}` | `{{SERVICE_DESC}}` |

### Initial Credentials & Tokens:
* **Setup Token / Key**: `{{SETUP_TOKEN}}`
* **Persistent Volume**: `{{VOLUME_PATH}}`
* **Restart Policy**: `always`

---

## 5. Operations & Maintenance Runbook

### Service Status & Logs
```bash
# Check running containers / services
docker ps

# Inspect logs
docker logs -f --tail 50 {{CONTAINER_NAME}}
```

### Health & Resource Usage
```bash
docker stats
```

### Restart / Update Procedures
```bash
# Restart service
docker restart {{CONTAINER_NAME}}

# Update container image
docker stop {{CONTAINER_NAME}} && docker rm {{CONTAINER_NAME}}
docker pull {{IMAGE_NAME}}:latest
# Re-run deployment command
```

### Storage Cleanup
```bash
docker system prune -a
```
