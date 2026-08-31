---
name: work-to-doc
description: Turn any completed technical implementation, server setup, infrastructure deployment, architectural change, or feature into clean, reusable, easy-to-follow documentation and operational runbooks. Prompts for destination and outputs structured markdown docs.
metadata:
  version: 1.0.0
  author: Raghav Ganesh
  license: MIT
  tags:
    - documentation
    - runbook
    - devops
    - infrastructure
    - server-setup
    - knowledge-base
---

# Work To Doc (Automated Implementation & Runbook Generator)

The **work-to-doc** skill transforms hands-on engineering work (server setup, Docker deployments, cloud infrastructure, backend/frontend features, database migrations) into clear, standardized, and reusable markdown documentation and operational runbooks.

---

## When to Use This Skill

Activate this skill when:
- The user asks to "document this setup", "create a runbook for what we just built", "write up the implementation details", or "document the server/stack".
- A complex configuration, installation, or infrastructure deployment has completed and needs persistent documentation for future reference, handover, or disaster recovery.
- Creating standardized documentation across local notes (`~/Documents/...`), repository wikis, or project docs (`docs/`).

---

## Step-by-Step Workflow

### Step 1: Gather Implementation Context
Review all actions, decisions, and configurations from the conversation history and live environment:
- **System / Host Information**: IP addresses, hostnames, OS version, hardware specs, SSH users, authentication keys.
- **Architectural & Storage Layout**: Disk mount points, partition splits (SSD vs HDD), data roots, container volume bindings.
- **Configuration & Environment**: Exact config files (`daemon.json`, `.env`, `docker-compose.yml`, `nginx.conf`), ports, systemd unit files.
- **Access Endpoints & Tokens**: Web UIs, API endpoints, setup tokens, initial passwords (or secure placeholders).
- **Operational Procedures**: Verified commands for checking status, viewing logs, restarting, updating, and troubleshooting.

### Step 2: Determine / Ask for Target Location
1. Check if the user already specified a path (e.g., `~/Documents/Local Server/` or `docs/server-setup.md`).
2. If unspecified, ask the user or recommend a sensible default path based on context:
   - **Personal Notes**: `~/Documents/<Project-or-Server-Name>/<topic>.md`
   - **Repository Docs**: `<repo-root>/docs/<topic>.md` or `<repo-root>/README.md`
3. Ensure parent directories are created before writing.

### Step 3: Select Appropriate Template & Structure
Choose the best matching template from `templates/`:
- **Server & Infrastructure Setup** (`templates/server-infrastructure.md`): For remote/local servers, Docker engines, networking, and container stacks.
- **Feature & Code Implementation** (`templates/feature-implementation.md`): For application code, APIs, schemas, and architecture.
- **Operational Runbook & Cheatsheet** (`templates/runbook-cheatsheet.md`): For maintenance procedures, disaster recovery, and common CLI commands.

### Step 4: Core Documentation Standards
Every generated document must follow these readability rules:
1. **Quick-Reference Tables**: Put vital connection, credentials, and port information in prominent markdown tables near the top.
2. **Copy-Paste Ready Blocks**: All CLI commands, configs, and snippets must be directly copy-pasteable with syntax highlighting.
3. **Rationale & Decisions**: Explicitly document *why* key architectural decisions were made (e.g. SSD `/data` for Docker root vs HDD for media storage).
4. **Maintenance Runbook**: Include practical daily operations (status, logs, restart, updates, prune/cleanup).
5. **No Fluff**: Keep explanations concise, dense with actionable information, and free of filler.

### Step 5: Write & Verify Document
1. Write the markdown file to the target location.
2. Verify that all URLs, paths, and code blocks are properly formatted.
3. Provide the user with a direct, clickable file link: `[filename.md](file:///absolute/path/to/file.md)`.

---

## Document Structure Guidelines

```markdown
# [Component / Server Name] Implementation & Operations Guide

## 1. System & Access Overview
- Host / IP, SSH command, user, auth keys, sudo configuration.

## 2. Architecture & Storage Layout
- Mount points, drive splits, volume mappings, persistent directory trees.

## 3. Configuration Reference
- Config files with exact contents, environment variables, port mappings.

## 4. Web Endpoints & Credentials
- URLs, HTTPS/HTTP ports, edge ports, setup tokens, initial admin access.

## 5. Operations & Maintenance Runbook
- Status checks (`docker ps`, `systemctl status`)
- Resource inspection (`docker stats`, `htop`)
- Log viewing (`docker logs -f ...`)
- Restart / Reload commands
- Upgrades & Version migration
- Backup & Cleanup procedures
```
