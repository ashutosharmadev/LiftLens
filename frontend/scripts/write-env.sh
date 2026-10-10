#!/usr/bin/env bash
# Writes frontend/.env.local from the deployed Terraform stacks.
# Usage (from the repo root): AWS_PROFILE=liftlens-deploy frontend/scripts/write-env.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/frontend/.env.local"

pool_id="$(terraform -chdir="$root/infra/data" output -raw user_pool_id)"
client_id="$(terraform -chdir="$root/infra/data" output -raw web_client_id)"
api_url="$(terraform -chdir="$root/infra/app" output -raw api_url)"

cat > "$out" <<ENV
VITE_USER_POOL_ID=$pool_id
VITE_USER_POOL_CLIENT_ID=$client_id
LIFTLENS_API_URL=${api_url%/}
ENV

echo "Wrote $out"
