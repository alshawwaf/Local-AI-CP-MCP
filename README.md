# Local AI + Check Point MCP Servers

Multi-service Docker Compose stack that brings up:

- **n8n** (workflow automation)
- **PostgreSQL** (n8n backend)
- **Auto-provisioner** (creates the n8n owner **and** installs `n8n-nodes-mcp`)
- **Ollama** (local LLM, CPU/GPU, with auto model pull)
- **Open WebUI** (chat UI)
- **Langflow** (flow builder)
- **Flowise** (LLM orchestration UI)
- **Qdrant** (vector DB)
- **Check Point MCP servers** (run in separate containers, reachable over HTTP on the Docker network)

After `docker compose up -d` you should have:

1. n8n running
2. an **instance owner** created
3. login via the credentials in `.env`
4. `n8n-nodes-mcp` installed
5. (if enabled) MCP sidecars listening over HTTP inside the Docker network

---

## 1. Repository Layout

```text
.
├── docker-compose.yml          # main multi-service stack
├── .env                        # passwords / ports / admin values
├── docker/
│   └── n8n/
│       └── Dockerfile          # custom n8n image (bakes in MCP CLIs)
├── scripts/
│   └── n8n-provision.sh        # sidecar: owner + login + install community package
├── n8n/
│   ├── backup/                 # workflows/credentials to auto-import (optional)
│   └── custom-nodes/           # extra n8n nodes
├── langflow/
│   └── flows/
└── qdrant/                     # local backup for qdrant
```

---

## 2. Prerequisites

- Docker Engine + Docker Compose
- Ports in `.env` must be free (5678, 5432, 3000, 3001, 7860, 6333, 11434…)
- Containers must have internet (provisioner installs the community package)
- Run from the directory that has `docker-compose.yml` **and** `.env`

---

## 3. Environment File (`.env`)

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
```

**Notes**

- `N8N_ADMIN_*` is used by the provisioner to call `/rest/owner/setup`
- `N8N_BASIC_AUTH_*` must match what the provisioner uses

---

## 4. Provisioner (`n8n-provision`)

This container runs **once** and:

1. waits for `http://n8n:5678/healthz`
2. creates the owner via `/rest/owner/setup` (using `.env`)
3. logs in
4. installs `n8n-nodes-mcp`
5. exits

It’s safe to re-run: if owner exists, it skips.

---

## 5. Running (profiles)

- Start by cloning this library:

```bash
ubuntu# git clone https://github.com/alshawwaf/Local-AI-CP-MCP.git

```

CPU stack:

```bash
docker compose --profile cpu up -d
```

GPU Ollama stack:

```bash
docker compose --profile gpu-nvidia up -d
```

Both:

```bash
docker compose --profile cpu --profile gpu-nvidia up -d
```

---

## 6. Auto-import (optional)

If you put exported n8n stuff in:

- `./n8n/backup/credentials`
- `./n8n/backup/workflows`

then the `n8n-import` container will wait for Postgres + n8n + provision, then run:

```bash
n8n import:credentials ...
n8n import:workflow ...
```

Leave the folders empty if you don’t want this.

---

## 7. URLs

- **n8n** → http://localhost:5678
- **Open WebUI** → http://localhost:3000
- **Flowise** → http://localhost:3001
- **Langflow** → http://localhost:7860
- **Qdrant** → http://localhost:6333
- **Ollama** (API) → http://localhost:11434

---

## 8. MCP servers (the important part)

The custom n8n image builds in these Check Point MCP CLIs:

- `mcp-documentation`
- `mcp-https-inspection`
- `mcp-quantum-management`
- `mcp-management-logs`

and we run each of them as a **separate container** over **HTTP**.

### 8.1 Inside Docker (recommended)

If the caller (usually n8n) is **also** in the `demo` network, don’t publish ports — just use Docker DNS:

- Documentation MCP → `http://mcp-documentation:3000`
- HTTPS Inspection MCP → `http://mcp-https-inspection:3001`
- Quantum Management MCP → `http://mcp-quantum-management:3002`
- Management Logs MCP → `http://mcp-management-logs:3003`

This is the preferred setup for n8n.

### 8.2 From the host / outside Docker

If you need to call them from the host, publish ports:

```yaml
mcp-documentation:
  ports:
    - "7300:3000"
```

Then call:

- from the host → `http://localhost:7300`
- from another machine → `http://<docker-host-ip>:7300`

### 8.3 Very important (n8n MCP config)

In n8n’s MCP tool settings:

- **Transport/mode**: **HTTP**
- **URL**: one of the URLs above (e.g. `http://mcp-documentation:3000`)
- **Do NOT set** “Package” or “Command” to `@chkp/...`  
  (if you do, n8n will try to `npx @chkp/documentation-mcp` inside the container and you’ll see
  `npm warn exec ...` and `Cannot find package '@chkp/mcp-utils'` in the logs)

That last bit is what stops the “n8n keeps trying to install the MCP” log spam.

---

## 9. Troubleshooting

**n8n logs show `npm warn exec ... @chkp/documentation-mcp`**
- At least one MCP tool in n8n is still set to “Package” mode
- Open that tool in n8n → change to HTTP → set `http://mcp-documentation:3000` → clear package field → save

**curl to localhost:7300 resets**
- The container is running but not started with `--transport http ...`
- Check the service has both:
  - `entrypoint: ["/usr/local/bin/mcp-documentation"]`
  - `command: ["--transport","http","--transport-port","3000", ...]`
- Recreate:
  ```bash
  docker compose up -d --force-recreate --no-deps mcp-documentation
  ```

**n8n says “fetch failed”**
- n8n used `http://localhost:7300` (inside Docker that’s wrong)
- use `http://mcp-documentation:3000` instead

---

## 10. Security

- use strong passwords in `.env`
- don’t expose MCP ports publicly unless needed
- if publishing ports, firewall them with WAF. Talk to CCastillo!
- don’t commit real credentials
