#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PROJECT_DIR}/../.." && pwd)"

: "${OUTPUT_DIRECTORY:?Unity Build Automation must provide OUTPUT_DIRECTORY.}"
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN as a secret environment variable in the UBA build configuration.}"
: "${VERCEL_ORG_ID:?Set VERCEL_ORG_ID to the dedicated Vercel team/account id.}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID to a dedicated Slegnuće Vercel project.}"
: "${SLEGNUCE_VERCEL_PROJECT_PURPOSE:?Set SLEGNUCE_VERCEL_PROJECT_PURPOSE=slegnuce-dedicated.}"

if [[ "${SLEGNUCE_VERCEL_PROJECT_PURPOSE}" != "slegnuce-dedicated" ]]; then
  echo "Refusing deployment: SLEGNUCE_VERCEL_PROJECT_PURPOSE must equal slegnuce-dedicated." >&2
  exit 32
fi

BUILD_ID="${BUILD_NUMBER:-0}"
VERSION="${SLEGNUCE_RELEASE_VERSION:-0.2.0-rc.${BUILD_ID}}"
GIT_SHA="${GIT_COMMIT:-unknown}"
UNITY="${UNITY_VERSION:-unknown}"
WORK_ROOT="${WORKSPACE:-${REPO_ROOT}}"
BUNDLE_DIR="${WORK_ROOT}/.slegnuce-vercel-${BUILD_ID}"

rm -rf "${BUNDLE_DIR}"

PACKAGER_JSON="$(
  node "${REPO_ROOT}/balkan-survival/scripts/package-vercel-release.mjs" \
    --input "${OUTPUT_DIRECTORY}" \
    --output "${BUNDLE_DIR}" \
    --version "${VERSION}" \
    --channel preview \
    --commit "${GIT_SHA}" \
    --build-number "${BUILD_ID}" \
    --unity-version "${UNITY}"
)"

ARTIFACT_DIGEST="$(node -e 'const v=JSON.parse(process.argv[1]); process.stdout.write(v.artifactDigest)' "${PACKAGER_JSON}")"

mkdir -p "${BUNDLE_DIR}/.vercel"
node -e '
const fs = require("fs");
const [file, orgId, projectId] = process.argv.slice(1);
fs.writeFileSync(file, JSON.stringify({ orgId, projectId }, null, 2) + "\n");
' "${BUNDLE_DIR}/.vercel/project.json" "${VERCEL_ORG_ID}" "${VERCEL_PROJECT_ID}"

echo "Deploying immutable Unity artifact ${VERSION} (${ARTIFACT_DIGEST}) to Vercel Preview."
PREVIEW_URL="$(
  npx --yes vercel@latest deploy "${BUNDLE_DIR}" \
    --prebuilt \
    --archive=tgz \
    --yes \
    --token "${VERCEL_TOKEN}" \
    --scope "${VERCEL_ORG_ID}"
)"
PREVIEW_URL="$(printf '%s' "${PREVIEW_URL}" | tail -n 1 | tr -d '\r')"

node "${REPO_ROOT}/balkan-survival/scripts/verify-vercel-preview.mjs" \
  --url "${PREVIEW_URL}" \
  --version "${VERSION}" \
  --digest "${ARTIFACT_DIGEST}"

printf '%s\n' "${PREVIEW_URL}" > "${OUTPUT_DIRECTORY}/slegnuce-preview-url.txt"
cp "${BUNDLE_DIR}/.vercel/output/static/release-manifest.json" "${OUTPUT_DIRECTORY}/slegnuce-release-manifest.json"

if [[ -n "${DEVOPS_ENV:-}" ]]; then
  {
    echo "SLEGNUCE_PREVIEW_URL=${PREVIEW_URL}"
    echo "SLEGNUCE_RELEASE_VERSION=${VERSION}"
    echo "SLEGNUCE_ARTIFACT_DIGEST=${ARTIFACT_DIGEST}"
  } >> "${DEVOPS_ENV}"
fi

echo "SLEGNUCE UBA POST-BUILD PASS"
echo "Preview: ${PREVIEW_URL}"
echo "Version: ${VERSION}"
echo "Artifact digest: ${ARTIFACT_DIGEST}"
echo "Production was NOT changed. Promote this exact deployment only after the browser round-trip gate passes."
