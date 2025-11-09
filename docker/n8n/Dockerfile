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

# ---------- make target dir as root, then hand it to node ----------
RUN mkdir -p /opt/mcp-doc && chown -R node:node /opt/mcp-doc

# ---------- Install all MCP CLIs as node ----------
USER node
RUN set -eux; \
  cd /opt/mcp-doc; \
  npm init -y >/dev/null 2>&1; \
  MCP_TGZ="$(ls -1 /opt/artifacts/chkp-mcp-utils-*.tgz | head -n1)"; \
  npm i --omit=dev \
    @chkp/documentation-mcp@latest \
    @chkp/https-inspection-mcp@latest \
    @chkp/quantum-management-mcp@latest \
    @chkp/management-logs-mcp@latest \
    @chkp/threat-emulation-mcp@latest \
    @chkp/threat-prevention-mcp@latest \
    @chkp/spark-management-mcp@latest \
    @chkp/reputation-service-mcp@latest \
    @chkp/harmony-sase-mcp@latest \
    @chkp/quantum-gw-cli-mcp@latest \
    @chkp/quantum-gw-connection-analysis-mcp@latest \
    @chkp/quantum-gaia-mcp@latest \
    @chkp/cpinfo-analysis-mcp@latest \
    "file:${MCP_TGZ}"; \
  # quick sanity check
  /opt/mcp-doc/node_modules/.bin/documentation-mcp --help >/dev/null

# ---------- Create /usr/local/bin wrappers for ALL of them ----------
USER root
RUN set -eux; \
  wrap() { \
    name="$1"; bin="$2"; \
    printf '%s\n' \
      '#!/bin/sh' \
      'set -eu' \
      'case "${1-}" in stdio|http|stdio:*|http:*) shift;; esac' \
      "exec /opt/mcp-doc/node_modules/.bin/${bin} \"\$@\"" \
      >"/usr/local/bin/${name}"; \
    chmod +x "/usr/local/bin/${name}"; \
  }; \
  wrap mcp-documentation documentation-mcp; \
  wrap mcp-https-inspection https-inspection-mcp; \
  wrap mcp-quantum-management quantum-management-mcp; \
  wrap mcp-management-logs management-logs-mcp; \
  wrap threat-emulation-mcp threat-emulation-mcp; \
  wrap threat-prevention-mcp threat-prevention-mcp; \
  wrap spark-management-mcp spark-management-mcp; \
  wrap reputation-service-mcp reputation-service-mcp; \
  wrap harmony-sase-mcp harmony-sase-mcp; \
  wrap quantum-gw-cli-mcp quantum-gw-cli-mcp; \
  wrap quantum-gw-connection-analysis-mcp quantum-gw-connection-analysis-mcp; \
  wrap quantum-gaia-mcp quantum-gaia-mcp; \
  wrap cpinfo-analysis-mcp cpinfo-analysis-mcp

# ---------- back to node like the base image ----------
USER node
