# Local AI + Check Point MCP Servers

A production-ready, multi-service Docker Compose stack that brings up:

- **n8n** (workflow automation)
- **PostgreSQL** (n8n backend)
- **Auto-provisioner** (creates the n8n owner **and** installs `n8n-nodes-mcp`)
- **Ollama** (local LLMs; CPU **or** NVIDIA GPU; auto model pull)
- **Open WebUI** (chat UI)
- **Langflow** (flow builder)
- **Flowise** (LLM orchestration UI)
- **Qdrant** (vector DB)
- **Check Point MCP servers** (run as sidecars over HTTP on the Docker network)

After `docker compose up -d` you should have:

1) **n8n** running  
2) an instance **owner** created  
3) login via the credentials in `.env`  
4) `n8n-nodes-mcp` installed (idempotent)  
5) (if enabled) MCP sidecars listening over **HTTP** inside the Docker network

---

## 1) Repository layout

```
.
├─ docker-compose.yml           # multi-service stack (CPU/GPU profiles)
├─ .env                         # passwords / ports / admin values
├─ docker/
│  └─ n8n/
│     └─ Dockerfile             # custom n8n image (bakes in MCP CLIs + wrappers)
├─ scripts/
│  └─ n8n-provision.sh          # sidecar: owner + login + install community package
├─ n8n/
│  ├─ backup/                   # workflows/credentials to auto-import (optional)
│  └─ custom-nodes/             # extra n8n nodes (persisted)
├─ langflow/
│  └─ flows/                    # example Langflow flows
└─ qdrant/                      # local backup for qdrant
```

---

## 2) Prerequisites

- Docker Engine + Docker Compose v2
- Free ports from `.env` (5678, 5432, 3000, 3001, 7860, 6333, 11434 …)
- Internet access from containers (provisioner installs community package)
- Run commands from the directory that has `docker-compose.yml` **and** `.env`

**GPU (optional)**  
If you plan to use the GPU profile, install **NVIDIA Container Toolkit** and ensure `nvidia-smi` works on the host.

---

## 3) Environment (`.env`)

Create `.env` next to `docker-compose.yml`:

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

Notes:

- `N8N_ADMIN_*` is used by the provisioner to call `/rest/owner/setup`.
- `N8N_BASIC_AUTH_*` must match what the provisioner uses.
- Only fill MCP variables for services you plan to run; otherwise comment those services in the compose.

---

## 4) Build (custom image with MCP wrappers)

The sidecars (e.g., `mcp-documentation`) are launched from the same custom image as `n8n`.  
**Build once** before bringing the stack up:

```bash
docker compose build n8n
```

This builds `custom-mcp-n8n:custom` from `docker/n8n/Dockerfile` and bakes in all Check Point MCP CLIs **plus** `/usr/local/bin/*` wrappers for:

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

---

## 5) Run (profiles)

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

Tip: set a default profile for the session:

```bash
export COMPOSE_PROFILES=cpu
```

---

## 6) Provisioner (`n8n-provision`)

Runs **once** and:

1. waits for `http://n8n:5678/healthz`
2. creates owner via `/rest/owner/setup` (from `.env`)
3. logs in
4. installs `n8n-nodes-mcp` (idempotent; a 400 “already installed” is OK)
5. exits

Safe to re-run; if the owner exists, it skips.

---

## 7) Auto-import (optional)

If you place exported assets in:

- `./n8n/backup/credentials`
- `./n8n/backup/workflows`

the `n8n-import` container will wait for Postgres + n8n + provision, then run:

```bash
n8n import:credentials --separate --input=/backup/credentials
n8n import:workflow    --separate --input=/backup/workflows
```

Leave these folders empty to skip.

---

## 8) URLs

- **n8n** → http://localhost:5678  
- **Open WebUI** → http://localhost:3000  
- **Flowise** → http://localhost:3001  
- **Langflow** → http://localhost:7860  
- **Qdrant** → http://localhost:6333  
- **Ollama** (API) → http://localhost:11434

---

## 9) MCP servers (HTTP sidecars)

The custom image runs each MCP as a **separate container** over **HTTP**.

### Inside Docker (recommended)

If the caller (usually n8n) is **also** in the `demo` network, don’t publish ports — use Docker DNS.  
These are the actual in-cluster URLs from your `docker-compose.yml`:

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

This is the preferred setup for n8n.

### From the host

If you publish ports in compose (like you did):

- `mcp-documentation` → `http://localhost:7300`
- `mcp-https-inspection` → `http://localhost:7301`
- `mcp-quantum-management` → `http://localhost:7302`
- `mcp-management-logs` → `http://localhost:7303`
- `threat-emulation-mcp` → `http://localhost:7304`
- `threat-prevention-mcp` → `http://localhost:7305`
- `spark-management-mcp` → `http://localhost:7306`
- `reputation-service-mcp` → `http://localhost:7307`
- `harmony-sase-mcp` → `http://localhost:7308`
- `quantum-gw-cli-mcp` → `http://localhost:7309`
- `quantum-gw-connection-analysis-mcp` → `http://localhost:7310`
- `quantum-gaia-mcp` → `http://localhost:7311`
- `cpinfo-analysis-mcp` → `http://localhost:7312`

Call from another machine with `http://<docker-host-ip>:73xx`.

### n8n tool config (important)

In n8n’s MCP tool nodes:

- **Mode/Transport**: **HTTP**
- **URL**: e.g., `http://mcp-documentation:3000`
- **Do NOT** set “Package”/“Command” to `@chkp/...`  
  (otherwise n8n will try to run `npx @chkp/...` in-container and you’ll see
  `npm warn exec …` / `Cannot find package '@chkp/mcp-utils'`).

---

## 10) Ollama models

The model-pull sidecar waits for Ollama and pulls:

- `llama3.1:latest`
- `nomic-embed-text:latest`

Change models by editing the `ollama-pull-*` service `command:` in `docker-compose.yml`.  
Large models consume disk space; prune unused models with `ollama rm <model>` inside the container.

---

## 11) Data & persistence

Named volumes (safe to back up/restore):

| Volume            | What it stores                         |
|-------------------|----------------------------------------|
| `n8n_storage`     | n8n config, installed nodes, DB cache  |
| `postgres_storage`| Postgres data                           |
| `ollama_storage`  | Ollama models                           |
| `qdrant_storage`  | Qdrant collections                      |
| `open-webui`      | Open WebUI data                         |
| `flowise`         | Flowise data                            |
| `langflow`        | Langflow data                           |

Back up a volume (example for n8n):

```bash
docker run --rm -v n8n_storage:/data -v "$(pwd)":/backup busybox \
  tar czf /backup/n8n_storage.tgz -C /data .
```

---

## 12) Common commands

```bash
# status
docker compose ps

# watch n8n logs
docker compose logs -f n8n

# watch ALL logs (noisy but useful when MCP sidecar fails)
docker compose logs -f

# watch a specific MCP service
docker compose logs -f mcp-documentation

# rebuild custom image
docker compose build n8n

# up with CPU profile
docker compose --profile cpu up -d

# down with the same profile(s)
docker compose --profile cpu down -v

# cleanup stopped containers / networks
docker system prune -f
```

**Note on `down` errors**  
If you see:
```
service "open-webui" depends on undefined service "ollama-pull-llama-cpu"
```
run `docker compose --profile cpu down -v` (include the same profile(s) you used for `up`),  
or set `export COMPOSE_PROFILES=cpu` and run `docker compose down -v`.

---

## 13) Troubleshooting

**A) `n8n-import`: “Mismatching encryption keys”**  
Ensure **both** `n8n` and `n8n-import` use the **same** `N8N_ENCRYPTION_KEY` from `.env`.

**B) Provisioner: 400 “Package already installed”**  
Expected on reruns; the script is idempotent. Ignore if `n8n-nodes-mcp` is present in **Settings → Community Nodes**.

**C) n8n node tries to install `@chkp/...`**  
Switch the MCP node to **HTTP** mode and point it at `http://mcp-<service>:<port>`. Clear any “package” fields.

**D) Can’t curl MCP from inside Docker**  
Use the **service name** on the `demo` network, not `localhost`. Example:
`curl http://mcp-documentation:3000/` from the `n8n` container.

**E) Postgres connection issues**  
Confirm the DB env vars match across `n8n`, `n8n-import`, and `postgres`.  
`docker compose logs postgres | tail -n 50`

**F) GPU not detected**  
Use the `gpu-nvidia` profile and verify NVIDIA toolkit. `docker run --rm --gpus all nvidia/cuda:12.3.2-base nvidia-smi`.

---

## 14) Updating the MCP Servers

- **n8n-nodes-mcp**: upgrade via n8n UI (**Settings → Community Nodes**) or update the provisioner to call the update endpoint.
- **MCP CLIs**: `docker compose build n8n` to rebuild the custom image with latest `@chkp/*` packages.
- **Base images**: pull latest and rebuild: `docker compose pull && docker compose build n8n`.
