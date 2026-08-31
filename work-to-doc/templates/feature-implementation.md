# [Feature / Module Name] Technical Implementation Guide

## 1. Overview & Architecture

* **Module / Feature**: `{{FEATURE_NAME}}`
* **Target Repository**: `{{REPO_NAME}}`
* **Key Components**:
  - `{{COMPONENT_1}}`: `{{COMPONENT_1_DESC}}`
  - `{{COMPONENT_2}}`: `{{COMPONENT_2_DESC}}`

---

## 2. Key Files & Modifications

| File Path | Action | Description |
| :--- | :--- | :--- |
| `{{FILE_1}}` | Added / Modified | `{{FILE_1_PURPOSE}}` |
| `{{FILE_2}}` | Added / Modified | `{{FILE_2_PURPOSE}}` |

---

## 3. Data Schema & Environment Variables

### Environment Variables (`.env`)
```bash
{{ENV_VARIABLES}}
```

### Data Models / Schema Changes
```sql
{{SCHEMA_OR_TYPE_DEFINITIONS}}
```

---

## 4. API Endpoints & Interfaces

| Method | Endpoint | Auth | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/...` | Bearer Token | `{ "key": "value" }` | `200 OK` |

---

## 5. Testing & Verification Runbook

### Run Automated Tests
```bash
{{TEST_COMMAND}}
```

### Manual Verification Flow
1. Step 1: `{{VERIFY_STEP_1}}`
2. Step 2: `{{VERIFY_STEP_2}}`
3. Expected result: `{{EXPECTED_OUTCOME}}`
