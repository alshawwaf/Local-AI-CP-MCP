# Check Point MCP Servers Starting Kit



<p align="left">
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" />
  <img src="https://img.shields.io/badge/n8n-Automation-orange?logo=n8n" />
  <img src="https://img.shields.io/badge/langflow-Workflow-green?logo=langflow" />
  <img src="https://img.shields.io/badge/Ollama-LLM-grey" />
  <img src="https://img.shields.io/badge/Check%20Point-MCP-magenta?" />
</p>

> **Check Point MCP Servers Lab in One Command**
>
> Bring up n8n + Ollama + Flow UIs + Qdrant + a full fleet of Check Point MCP servers with:
>
> ```bash
> docker compose --profile cpu up -d
> ```
---

## Quick Overview

A **production-ready, multi-service Docker Compose stack** that brings up a full local AI + Check Point MCP (Model Context Protocol) environment:

- **n8n** – workflow automation + MCP tools orchestrator
- **PostgreSQL** – n8n backend database
- **Auto-provisioner** – creates the n8n instance owner **and** installs `n8n-nodes-mcp`
- **Ollama** – local LLMs; CPU **or** NVIDIA GPU; auto model pull
- **Open WebUI** – chat UI for Ollama / LLMs
- **Langflow** – visual AI flow builder
- **Flowise** – LLM orchestration UI
- **Qdrant** – vector database for embeddings
- **Check Point MCP servers** – dedicated HTTP sidecars on the Docker network

The goal is a **single lab stack** for building, testing, and demoing AI + Check Point workflows:

- Instance owner is **auto-configured**
- `n8n-nodes-mcp` is **pre-installed**
- MCP servers are reachable as **HTTP tools** from inside n8n

---

## Navigation

- [ Quick Start](#-quick-start)
- [ Tech Stack & Layout](#-tech-stack--layout)
- [ Environment--env](#%EF%B8%8F-environment-env)
- [ Build & Profiles](#%EF%B8%8F-build--profiles)
- [ n8n Provision & Auto-Import](#-n8n-provision--auto-import)
- [ URLs & MCP Endpoints](#-urls--mcp-endpoints)
- [ Ollama Models](#-ollama-models)
- [ Data & Persistence](#-data--persistence)
- [ Troubleshooting](#-troubleshooting)
- [ Updating & Resetting](#%EF%B8%8F-updating--resetting)

---

## Quick Start

<details>
<summary><strong>1. Requirements</strong></summary>

- **Docker Engine** + **Docker Compose v2**
- Free ports from `.env` (e.g. `5678`, `5432`, `3000`, `3001`, `7860`, `6333`, `11434`, `73xx`, …)
- Outbound Internet access from containers (for:
  - Pulling images
  - Installing community nodes
  - Pulling Ollama models)
- All commands executed from the folder containing `docker-compose.yml` and `.env`

**Optional – GPU Profile**

- NVIDIA GPU on the host
- **NVIDIA Container Toolkit** installed
- `nvidia-smi` works on the host

</details>

<details>
<summary><strong>2. Minimal Happy Path</strong></summary>

1. Create a `.env` file (see [Environment](#%EF%B8%8F-environment-env)).  
2. Build the custom n8n image:

   ```bash
   docker compose build n8n
   ```

3. Start the CPU stack:

   ```bash
   docker compose --profile cpu up -d
   ```

4. Wait 30–60 seconds for:
   - Postgres
   - n8n
   - Provisioner (owner + `n8n-nodes-mcp`)
   - Optional `n8n-import` (workflows/credentials)

5. Browse to **n8n**:

   - <http://localhost:5678>  
   - Log in with the owner credentials from `.env`

</details>

<details>
<summary><strong>3. GPU Profile</strong></summary>

If you want Ollama to use GPU instead of CPU:

```bash
# Start GPU profile
docker compose --profile gpu-nvidia up -d

# Or CPU + GPU together
docker compose --profile cpu --profile gpu-nvidia up -d
```

To avoid repeating profiles each time:

```bash
export COMPOSE_PROFILES=cpu
docker compose up -d
```

</details>

---

## Tech Stack & Layout

### Stack Summary

| Component      | Purpose                                      |
|----------------|----------------------------------------------|
| n8n            | Automation engine + MCP orchestrator         |
| PostgreSQL     | n8n backend DB                               |
| n8n-provision  | Owner creation + `n8n-nodes-mcp` installation|
| n8n-import     | Optional workflow & credential auto-import   |
| Ollama         | Local LLM server (CPU / GPU)                 |
| Open WebUI     | Chat UI for Ollama                           |
| Flowise        | LLM orchestration / low-code builder         |
| Langflow       | Visual AI flow builder                       |
| Qdrant         | Vector database                              |
| MCP sidecars   | Check Point MCP tools as HTTP servers        |

### Repository Layout

```bash
.
├─ docker-compose.yml           # Multi-service stack (CPU / GPU profiles)
├─ .env                         # Passwords / ports / admin values
├─ docker/
│  └─ n8n/
│     └─ Dockerfile             # Custom n8n image (MCP CLIs + wrappers baked in)
├─ scripts/
│  └─ n8n-provision.sh          # Sidecar: owner setup + login + community node install
├─ n8n/
│  ├─ backup/                   # Workflows/credentials to auto-import (optional)
│  └─ custom-nodes/             # Extra n8n nodes (persisted)
├─ langflow/
│  └─ flows/                    # Example Langflow flows
└─ qdrant/                      # Local backup / collections for Qdrant
```

---

## Environment (`.env`)

Create a `.env` next to `docker-compose.yml`:

```env
# ───────── n8n DB ─────────
POSTGRES_USER=admin
POSTGRES_PASSWORD=change_me
POSTGRES_DB=n8n
POSTGRES_PORT=5432

# ───────── n8n Web ─────────
N8N_PORT=5678
N8N_ENCRYPTION_KEY=long_random_encryption_key
N8N_USER_MANAGEMENT_JWT_SECRET=supersecretjwtkey

# ───────── n8n Owner / Admin ─────────
N8N_ADMIN_EMAIL=admin@cpdemo.com
N8N_ADMIN_FIRST_NAME=Admin
N8N_ADMIN_LAST_NAME=User
N8N_ADMIN_PASSWORD=change_me

# ───────── n8n Basic Auth ─────────
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=change_me

# ───────── Ollama ─────────
OLLAMA_HOST=ollama-cpu:11434
OLLAMA_PORT=11434

# ───────── Other UIs ─────────
OPEN_WEBUI_PORT=3000
FLOWISE_PORT=3001
LANGFLOW_PORT=7860
QDRANT_PORT=6333

# ───────── MCP (fill what you use) ─────────
DOC_CLIENT_ID=
SECRET_KEY=
DOC_REGION=

MANAGEMENT_HOST=
SMS_API_KEY=

TE_API_KEY=
REPUTATION_API_KEY=

SPARK_MGMT_CLIENT_ID=
SPARK_MGMT_SECRET_KEY=
SPARK_MGMT_REGION=
SPARK_MGMT_INFINITY_PORTAL_URL=

HARMONY_SASE_CLIENT_ID=
HARMONY_SASE_SECRET_KEY=
HARMONY_SASE_REGION=

CPINFO_LOG_LEVEL=info
```

> 💡 **Tip**  
> - `N8N_ADMIN_*` is used by the provisioner to call `/rest/owner/setup`.  
> - `N8N_BASIC_AUTH_*` must match what the provisioner uses to authenticate.  
> - Only populate the MCP variables for the services you actually use (or comment out those services in `docker-compose.yml`).

---

## Build & Profiles

### Build the Custom n8n Image

The Check Point MCP sidecars reuse a **custom n8n base image** with MCP CLIs and wrappers baked in.

```bash
docker compose build n8n
```

This produces an image (e.g. `custom-mcp-n8n:custom`) which includes:

- All relevant `@chkp/*` MCP CLI packages
- Wrapper scripts in `/usr/local/bin` for each MCP service:
  - `mcp-documentation`
  - `mcp-https-inspection`
  - `mcp-quantum-management`
  - `mcp-management-logs`
  - `threat-emulation-mcp`
  - `threat-prevention-mcp`
  - `spark-management-mcp`
  - `reputation-service-mcp`
  - `harmony-sase-mcp`
  - `quantum-gw-cli-mcp`
  - `quantum-gw-connection-analysis-mcp`
  - `quantum-gaia-mcp`
  - `cpinfo-analysis-mcp`

### Start the Stack

**CPU stack:**

```bash
docker compose --profile cpu up -d
```

**GPU (NVIDIA) Ollama stack:**

```bash
docker compose --profile gpu-nvidia up -d
```

**Both profiles:**

```bash
docker compose --profile cpu --profile gpu-nvidia up -d
```

Set a default profile:

```bash
export COMPOSE_PROFILES=cpu
docker compose up -d
```

---

## n8n Provision & Auto-Import

### Provisioner (`n8n-provision`)

The `n8n-provision` sidecar runs **once** and performs:

1. Wait for `http://n8n:5678/healthz`
2. Create the owner via `/rest/owner/setup` (using `N8N_ADMIN_*`)
3. Login using `N8N_BASIC_AUTH_*` and owner credentials
4. Install `n8n-nodes-mcp` (idempotent – HTTP 400 “already installed” is fine)
5. Exit

Safe to re-run; it will **skip** already-completed steps.

### Auto-Import (`n8n-import`)

If you place exported assets in:

- `./n8n/backup/credentials`
- `./n8n/backup/workflows`

the `n8n-import` container will, after everything is healthy:

```bash
n8n import:credentials --separate --input=/backup/credentials
n8n import:workflow    --separate --input=/backup/workflows
```

Leave these folders empty to skip auto-import.

---

## URLs & MCP Endpoints

### Main Web UIs

| Service      | URL                         |
|--------------|-----------------------------|
| n8n          | <http://localhost:5678>     |
| Open WebUI   | <http://localhost:3000>     |
| Flowise      | <http://localhost:3001>     |
| Langflow     | <http://localhost:7860>     |
| Qdrant       | <http://localhost:6333>     |
| Ollama (API) | <http://localhost:11434>    |

### MCP Servers – Internal Docker URLs

Use these from **n8n MCP HTTP nodes** (same `demo` network):

- Documentation MCP → `http://mcp-documentation:3000`
- HTTPS Inspection MCP → `http://mcp-https-inspection:3001`
- Quantum Management MCP → `http://mcp-quantum-management:3002`
- Management Logs MCP → `http://mcp-management-logs:3003`
- Threat Emulation MCP → `http://threat-emulation-mcp:3004`
- Threat Prevention MCP → `http://threat-prevention-mcp:3005`
- Spark Management MCP → `http://spark-management-mcp:3006`
- Reputation Service MCP → `http://reputation-service-mcp:3007`
- Harmony SASE MCP → `http://harmony-sase-mcp:3008`
- Quantum GW CLI MCP → `http://quantum-gw-cli-mcp:3009`
- Quantum GW Connection Analysis MCP → `http://quantum-gw-connection-analysis-mcp:3010`
- Quantum Gaia MCP → `http://quantum-gaia-mcp:3011`
- CPInfo Analysis MCP → `http://cpinfo-analysis-mcp:3012`

### MCP Servers – From the Host

If ports are published:

- Documentation MCP → <http://localhost:7300>
- HTTPS Inspection MCP → <http://localhost:7301>
- Quantum Management MCP → <http://localhost:7302>
- Management Logs MCP → <http://localhost:7303>
- Threat Emulation MCP → <http://localhost:7304>
- Threat Prevention MCP → <http://localhost:7305>
- Spark Management MCP → <http://localhost:7306>
- Reputation Service MCP → <http://localhost:7307>
- Harmony SASE MCP → <http://localhost:7308>
- Quantum GW CLI MCP → <http://localhost:7309>
- Quantum GW Connection Analysis MCP → <http://localhost:7310>
- Quantum Gaia MCP → <http://localhost:7311>
- CPInfo Analysis MCP → <http://localhost:7312>

From another machine, use `http://<docker-host-ip>:73xx`.

### n8n MCP Node Configuration

In n8n’s MCP client nodes (e.g., `mcpClientTool`):

- **Connection Type / Mode**: `http`
- **Base URL**: `http://<mcp-service-name>:<port>` (e.g., `http://threat-emulation-mcp:3004`)
- **Do NOT** set “Package” or “Command” to `@chkp/...`.

If package fields are set, n8n will try `npx @chkp/...` in the container and you’ll see:
- `npm warn exec The following package was not found and will be installed`
- `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@chkp/mcp-utils'`

HTTP mode + sidecars = clean, predictable behavior.

---

## Ollama Models

The `ollama-pull-*` sidecar waits for the Ollama API and then pulls the configured models, for example:

- `llama3.1:latest`
- `nomic-embed-text:latest`

To change which models are pulled, edit the `command:` in the `ollama-pull-*` services inside `docker-compose.yml`.

To inspect or prune models inside the Ollama container:

```bash
ollama list
ollama rm <model-name>
```

---

## Data & Persistence

The stack uses named Docker volumes so you can destroy containers and keep data.

| Volume            | Description                                   |
|-------------------|-----------------------------------------------|
| `n8n_storage`     | n8n config, user data, some cached metadata   |
| `postgres_storage`| PostgreSQL database for n8n                   |
| `ollama_storage`  | Ollama models and data                        |
| `qdrant_storage`  | Qdrant collections                            |
| `open-webui`      | Open WebUI data                               |
| `flowise`         | Flowise data                                  |
| `langflow`        | Langflow data                                 |

Example: backup `n8n_storage` to a local tarball:

```bash
docker run --rm -v n8n_storage:/data -v "$(pwd)":/backup busybox \
  tar czf /backup/n8n_storage.tgz -C /data .
```

---

## Troubleshooting

### A) `n8n-import`: “Mismatching encryption keys”

Make sure **all n8n-related containers** (`n8n`, `n8n-import`, `n8n-provision`) use the **same** `N8N_ENCRYPTION_KEY` value from `.env`.

### B) Provisioner: HTTP 400 “Package already installed”

Normal on re-runs. As long as you see `n8n-nodes-mcp` in **Settings → Community Nodes**, you’re good.

### C) MCP node shows `@chkp/...` install errors

If logs show:

- `npm warn exec The following package was not found and will be installed`
- `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@chkp/mcp-utils'`

…then the node is in **package mode**. Switch it to **HTTP** and point at the correct MCP URL, e.g.:

```text
http://management-logs-mcp:3003
```

### D) Cannot reach MCP from inside Docker

From the `n8n` container, use the **service name**, not `localhost`:

```bash
docker compose exec n8n sh
# Inside
curl http://mcp-documentation:3000/
```

If that works, the MCP sidecar is healthy and reachable.

### E) Postgres connection issues

Check the DB logs:

```bash
docker compose logs postgres | tail -n 50
```

Ensure:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` match between `postgres`, `n8n`, and `n8n-import`.

### F) GPU not detected

- Ensure you use the `gpu-nvidia` profile.
- Verify NVIDIA toolkit:

  ```bash
  docker run --rm --gpus all nvidia/cuda:12.3.2-base nvidia-smi
  ```

If this fails, fix GPU drivers / toolkit before using the GPU profile.

---

## Updating & Resetting

### Updating

- **n8n-nodes-mcp** – update via n8n UI (Settings → Community Nodes) or adjust the version in your provisioner / Dockerfile and rebuild.
- **Check Point MCP CLIs** – adjust versions in `docker/n8n/Dockerfile` and rebuild:

  ```bash
  docker compose build n8n
  ```

- **Base Images** – pull and rebuild:

  ```bash
  docker compose pull
  docker compose build n8n
  docker compose --profile cpu up -d
  ```

(adjust profiles as needed).

### Full Reset (Lab-Style)

If you want a **clean slate** (fresh DB, no workflows, no credentials, no chat history):

```bash
# WARNING: deletes all volumes for selected profiles
docker compose --profile cpu down -v
docker compose --profile cpu up -d
```

This re-creates the entire environment from zero, re-runs the provisioner, and re-imports any assets in `./n8n/backup`.
