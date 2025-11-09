#!/usr/bin/env sh
# This script is used to provision the owner admin in n8n
# It also installs the n8n-node-mcp community node
# Author: Khalid Alshawwaf

set -e

N8N_URL="${N8N_URL:-http://n8n:5678}"

BASIC_USER="${N8N_BASIC_AUTH_USER:-admin}"
BASIC_PASS="${N8N_BASIC_AUTH_PASSWORD:-admin}"

OWNER_EMAIL="${N8N_ADMIN_EMAIL:-owner@example.com}"
OWNER_FIRST="${N8N_ADMIN_FIRST_NAME:-Owner}"
OWNER_LAST="${N8N_ADMIN_LAST_NAME:-User}"
OWNER_PASS="${N8N_ADMIN_PASSWORD:-changeme}"

PKG="${N8N_COMMUNITY_PACKAGE:-n8n-nodes-mcp}"

echo "== n8n-provision start =="
echo "container will call: ${N8N_URL}"
echo "(host should use http://localhost:5678)"

###############################################################################
# 0) wait for n8n /healthz
###############################################################################
i=0
max=120
echo "0) wait for n8n /healthz ..."
while [ "$i" -lt "$max" ]; do
  if curl -s -f "${N8N_URL}/healthz" >/dev/null 2>&1; then
    echo "healthz OK"
    break
  fi
  i=$((i+1))
  echo "n8n not ready yet (${i}/${max}) ..."
  sleep 2
done
if [ "$i" -ge "$max" ]; then
  echo "n8n never became healthy"
  exit 1
fi

###############################################################################
# 1) owner setup
###############################################################################
echo "1) /rest/owner/setup ..."
owner_tries=0
while :; do
  owner_tries=$((owner_tries+1))

  curl -s -w "\n%{http_code}" \
    -u "${BASIC_USER}:${BASIC_PASS}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${OWNER_EMAIL}\",\"firstName\":\"${OWNER_FIRST}\",\"lastName\":\"${OWNER_LAST}\",\"password\":\"${OWNER_PASS}\"}" \
    "${N8N_URL}/rest/owner/setup" > /tmp/owner.raw

  OWNER_STATUS=$(tail -n 1 /tmp/owner.raw)
  OWNER_BODY=$(sed '$ d' /tmp/owner.raw 2>/dev/null || true)

  echo "→ OWNER HTTP: ${OWNER_STATUS}"
  echo "→ OWNER BODY: ${OWNER_BODY}"

  echo "${OWNER_BODY}" | grep -q "n8n is starting up" && {
    [ "$owner_tries" -ge 60 ] && { echo "giving up on owner"; exit 1; }
    echo "owner: n8n still starting, wait 3s..."; sleep 3; continue; }

  [ "$OWNER_STATUS" = "200" ] && { echo "owner created!!!!!"; break; }
  echo "${OWNER_BODY}" | grep -qi "already setup" && { echo "owner already setup !!!"; break; }

  [ "$owner_tries" -ge 60 ] && { echo "owner could not be created!!!"; exit 1; }
  echo "owner: got ${OWNER_STATUS}, retry in 3s..."; sleep 3
done

###############################################################################
# 2) login
###############################################################################
echo "2) /rest/login ..."
login_tries=0
while :; do
  login_tries=$((login_tries+1))

  curl -s -w "\n%{http_code}" \
    -c /tmp/cookies.txt \
    -u "${BASIC_USER}:${BASIC_PASS}" \
    -H "Content-Type: application/json" \
    -d "{\"emailOrLdapLoginId\":\"${OWNER_EMAIL}\",\"password\":\"${OWNER_PASS}\"}" \
    "${N8N_URL}/rest/login" > /tmp/login.raw

  LOGIN_STATUS=$(tail -n 1 /tmp/login.raw)
  LOGIN_BODY=$(sed '$ d' /tmp/login.raw 2>/dev/null || true)

  echo "→ LOGIN HTTP: ${LOGIN_STATUS}"
  echo "→ LOGIN BODY: ${LOGIN_BODY}"

  echo "${LOGIN_BODY}" | grep -q "n8n is starting up" && {
    [ "$login_tries" -ge 60 ] && { echo "giving up on login"; exit 1; }
    echo "login: n8n still starting, wait 3s..."; sleep 3; continue; }

  [ "$LOGIN_STATUS" = "200" ] && { echo "login OK!!!!"; break; }

  [ "$login_tries" -ge 60 ] && { echo "login failed repeatedly"; exit 1; }
  echo "login got ${LOGIN_STATUS}, wait 3s..."; sleep 3
done

###############################################################################
# 3) install community package
###############################################################################
echo "3) /rest/community-packages install ${PKG} ..."
pkg_tries=0
while :; do
  pkg_tries=$((pkg_tries+1))

  curl -s -w "\n%{http_code}" \
    -b /tmp/cookies.txt \
    -u "${BASIC_USER}:${BASIC_PASS}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${PKG}\"}" \
    "${N8N_URL}/rest/community-packages" > /tmp/pkg.raw

  PKG_STATUS=$(tail -n 1 /tmp/pkg.raw)
  PKG_BODY=$(sed '$ d' /tmp/pkg.raw 2>/dev/null || true)

  echo "→ PKG HTTP: ${PKG_STATUS}"
  echo "→ PKG BODY: ${PKG_BODY}"

  # n8n sometimes still says "starting up"
  echo "${PKG_BODY}" | grep -q "n8n is starting up" && {
    [ "$pkg_tries" -ge 40 ] && { echo "giving up on package (still starting)"; exit 1; }
    echo "package: n8n still starting, wait 3s..."; sleep 3; continue; }

  # normal success
  if [ "$PKG_STATUS" = "200" ]; then
    echo "package installed"
    exit 0
  fi

  # tricky case: n8n says "already installed"
  if [ "$PKG_STATUS" = "400" ] && echo "$PKG_BODY" | grep -qi "already installed"; then
    echo "n8n says it's already installed → verifying..."
    PKG_LIST=$(curl -s -b /tmp/cookies.txt -u "${BASIC_USER}:${BASIC_PASS}" "${N8N_URL}/rest/community-packages" || true)
    echo "$PKG_LIST" | grep -q "\"name\":\"${PKG}\"" && {
      echo "verified: ${PKG} is actually installed"
      exit 0
    }
    echo "n8n claimed '${PKG}' is installed but it’s not in list → will retry"
    # fall through to retry below
  fi

  # auth issue stays as fatal
  if [ "$PKG_STATUS" = "401" ]; then
    echo "   401 from /rest/community-packages (cookie+basic rejected)"
    echo "   → probably existing n8n_storage has a different owner"
    echo "   → run: docker compose down -v && docker compose up -d"
    exit 1
  fi

  [ "$pkg_tries" -ge 20 ] && { echo "package not installed after 20 tries"; exit 1; }
  echo "package install failed with ${PKG_STATUS}, retry 3s..."; sleep 3
done
