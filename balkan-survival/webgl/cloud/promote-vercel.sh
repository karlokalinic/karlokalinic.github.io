#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PROJECT_DIR}/../.." && pwd)"

: "${VERCEL_TOKEN:?VERCEL_TOKEN is required.}"
: "${VERCEL_ORG_ID:?VERCEL_ORG_ID is required.}"
: "${SLEGNUCE_RELEASE_APPROVED:?Set SLEGNUCE_RELEASE_APPROVED=YES only after the release gate is approved.}"
: "${SLEGNUCE_EXPECTED_VERSION:?Set the exact version being promoted, for example 0.2.0-rc.17.}"
: "${SLEGNUCE_EXPECTED_DIGEST:?Set the artifact digest produced by the preview package step.}"

if [[ "${SLEGNUCE_RELEASE_APPROVED}" != "YES" ]]; then
  echo "Refusing production promotion: SLEGNUCE_RELEASE_APPROVED must equal YES." >&2
  exit 40
fi

PREVIEW_URL="${1:-${SLEGNUCE_PREVIEW_URL:-}}"
if [[ -z "${PREVIEW_URL}" ]]; then
  echo "Usage: promote-vercel.sh <preview-deployment-url> (or set SLEGNUCE_PREVIEW_URL)." >&2
  exit 41
fi

node "${REPO_ROOT}/balkan-survival/scripts/verify-vercel-preview.mjs" \
  --url "${PREVIEW_URL}" \
  --version "${SLEGNUCE_EXPECTED_VERSION}" \
  --digest "${SLEGNUCE_EXPECTED_DIGEST}"

echo "Static gate passed. Promoting existing deployment without rebuilding:"
echo "${PREVIEW_URL}"

npx --yes vercel@latest promote "${PREVIEW_URL}" \
  --yes \
  --token "${VERCEL_TOKEN}" \
  --scope "${VERCEL_ORG_ID}"

echo "SLEGNUCE PRODUCTION PROMOTION PASS — the tested Vercel deployment is now production."
