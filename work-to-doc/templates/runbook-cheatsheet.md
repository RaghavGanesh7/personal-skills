# [System / Service] Operations Runbook & Cheatsheet

## Quick Reference Summary

| Target System | Access Command | Primary URL | Alert / Log Target |
| :--- | :--- | :--- | :--- |
| `{{SYSTEM_NAME}}` | `{{ACCESS_CMD}}` | `{{PRIMARY_URL}}` | `{{LOG_PATH}}` |

---

## 1. Daily Health Checks
```bash
# Check service status
{{STATUS_COMMAND}}

# Monitor resource metrics
{{METRICS_COMMAND}}
```

---

## 2. Common Operational Tasks

### Restarting Services
```bash
{{RESTART_COMMAND}}
```

### Viewing & Streaming Logs
```bash
{{LOG_STREAM_COMMAND}}
```

### Applying Updates / Deployments
```bash
{{DEPLOY_COMMAND}}
```

---

## 3. Disaster Recovery & Troubleshooting

| Issue / Symptom | Probable Cause | Resolution Steps |
| :--- | :--- | :--- |
| **Service Unresponsive** | OOM or crashed container | Check `{{LOG_STREAM_COMMAND}}`, restart with `{{RESTART_COMMAND}}` |
| **Port Conflict** | Another process holding port | Find PID with `lsof -i :<PORT>` and kill process |
| **Disk Full** | Unpruned logs or docker layers | Run `docker system prune -a` and check `df -h` |

---

## 4. Backup & Restore Procedures
```bash
# Backup command
{{BACKUP_COMMAND}}

# Restore command
{{RESTORE_COMMAND}}
```
