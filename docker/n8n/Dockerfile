FROM n8nio/n8n:latest

# ---------- Base tools ----------
USER root
RUN set -eux; \
  if command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*; \
  else \
    apk add --no-cache git ca-certificates bash; \
  fi

# ---------- Build @chkp/mcp-utils tarball (includes dist/) ----------
ARG MCP_SERVERS_REF=main
RUN set -eux; \
  git clone --depth 1 --branch "${MCP_SERVERS_REF}" https://github.com/CheckPointSW/mcp-servers.git /opt/mcp-servers; \
  cd /opt/mcp-servers/packages/mcp-utils; \
  export NODE_ENV=development npm_config_production=false; \
  npm install; \
  npx --yes -p typescript@latest tsc -p tsconfig.json; \
  MCP_TGZ="$(npm pack | tail -n1)"; \
  mkdir -p /opt/artifacts; \
  mv "${MCP_TGZ}" /opt/artifacts/; \
  chown -R node:node /opt/artifacts

# ---------- Install MCP CLIs under /opt (not masked by volumes) ----------
RUN mkdir -p /opt/mcp-doc && chown -R node:node /opt/mcp-doc
USER node
RUN set -eux; \
  cd /opt/mcp-doc; \
  npm init -y >/dev/null 2>&1; \
  MCP_TGZ="$(ls -1 /opt/artifacts/chkp-mcp-utils-*.tgz | head -n1)"; \
  npm i --omit=dev \
    @chkp/documentation-mcp@0.1.4 \
    @chkp/https-inspection-mcp@0.7.4 \
    @chkp/quantum-management-mcp@0.8.0 \
    @chkp/management-logs-mcp@0.6.4 \
    @chkp/quantum-infra@latest \
    "file:${MCP_TGZ}"; \
  /opt/mcp-doc/node_modules/.bin/documentation-mcp --help >/dev/null

# ---------- Wrappers (drop stray positional like "stdio" and exec) ----------
USER root
RUN wrap() { \
  name="$1"; bin="$2"; \
  printf '%s\n' \
    '#!/bin/sh' \
    'set -eu' \
    'case "${1-}" in stdio|http|stdio:*|http:*) shift;; esac' \
    "exec /opt/mcp-doc/node_modules/.bin/${bin} \"\$@\"" \
    >"/usr/local/bin/${name}" && chmod +x "/usr/local/bin/${name}"; \
}; \
  wrap mcp-documentation documentation-mcp; \
  wrap mcp-https-inspection https-inspection-mcp; \
  wrap mcp-quantum-management quantum-management-mcp; \
  wrap mcp-management-logs management-logs-mcp

# Runtime as node
USER node
