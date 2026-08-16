# CLOUD RELEASE — Unity Build Automation → Vercel → Chromium gate

Status: **prepared in source, not yet connected to the user's Unity Cloud configuration and dedicated Slegnuće Vercel project**.

This document defines the release contract for the first Unity Web artifact. Compilation, publication, behavior verification and production authority are separate operations. Unity Build Automation (UBA) opens the pinned Unity project and produces Web output. The repository-owned packager converts that output into an immutable Vercel Build Output API bundle. Vercel creates a Preview. GitHub Actions opens that exact Preview in Chromium and executes the twelve Unity ↔ browser conditions. Production is not rebuilt: after explicit approval, the already tested Vercel deployment is promoted.

The central invariant is:

```text
source commit
    ↓
Unity cloud build
    ↓
artifact digest
    ↓
Vercel Preview
    ↓
static deployment gate
    ↓
Playwright / Chromium 12-of-12 gate
    ↓
explicit production approval
    ↓
PROMOTE THE SAME DEPLOYMENT
```

A release is invalid if production is produced by running Unity again after the candidate was approved.

## 1. One-time Unity Build Automation configuration

Create a WebGL build configuration in Unity Dashboard → DevOps → Build Automation → Configurations.

Use these values as the contract:

```text
Branch:                 main
Project subfolder path: balkan-survival/webgl
Unity version:          auto-detect from ProjectSettings/ProjectVersion.txt
Target platform:        WebGL
Pre-export method:      Slegnuce.Editor.SlegnuceBuild.PreExportCloud
Post-build script:      balkan-survival/webgl/cloud/uba-post-build.sh
```

The project currently pins `6000.3.16f1`. If a future builder cannot provide the exact pinned patch, do not silently upgrade only the cloud configuration. Change the project pin in source control as a reviewed project change so local, cloud and historical documentation agree on the toolchain.

The pre-export method regenerates the prototype scene, runs the five buildability self-tests, applies the custom `PROJECT:Slegnuce` Web template and assigns the cloud release version. UBA remains responsible for the actual WebGL compile.

For the first cloud-release contract `PlayerSettings.WebGL.compressionFormat` is explicitly `Disabled`. This removes `Content-Encoding` as a hidden hosting dependency while we prove provenance and browser integration. Brotli can be restored later as a separate measured optimization.

## 2. Dedicated Vercel project and cloud secrets

Do not point this pipeline at a shared website or an existing multi-purpose Vercel project.

The UBA post-build hook refuses deployment unless:

```text
SLEGNUCE_VERCEL_PROJECT_PURPOSE=slegnuce-dedicated
```

Create one Vercel project whose only responsibility is Slegnuće release artifacts, then configure these UBA environment variables:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SLEGNUCE_VERCEL_PROJECT_PURPOSE=slegnuce-dedicated
```

`VERCEL_TOKEN` is a secret. Never commit it, put it in a release manifest or print it in browser code.

To automatically hand a verified Preview to GitHub's browser gate, also configure:

```text
GITHUB_RELEASE_TOKEN
```

The token must be able to issue a repository dispatch to `karlokalinic/karlokalinic.github.io`. It exists only in the UBA environment. If it is omitted, the post-build hook does **not** fail the successful Preview; it prints that dispatch was skipped, and the same candidate can be tested through manual `workflow_dispatch`.

Optional overrides:

```text
SLEGNUCE_GITHUB_REPOSITORY=karlokalinic/karlokalinic.github.io
SLEGNUCE_RELEASE_VERSION=0.2.0-rc.17
```

If `SLEGNUCE_RELEASE_VERSION` is omitted, the release version derives from UBA `BUILD_NUMBER`:

```text
0.2.0-rc.${BUILD_NUMBER}
```

UBA also provides `GIT_COMMIT`, `UNITY_VERSION`, `OUTPUT_DIRECTORY` and other build metadata used by the release manifest.

## 3. UBA post-build: Preview first, never production

`webgl/cloud/uba-post-build.sh` receives UBA's `OUTPUT_DIRECTORY`, packages the Unity player, creates a release manifest, generates Vercel Build Output API output, deploys it as Preview and verifies the public deployment.

The packaging shape is:

```text
.vercel/
├── project.json
└── output/
    ├── config.json
    └── static/
        ├── index.html
        ├── release-manifest.json
        └── releases/
            └── 0.2.0-rc.N/
                ├── index.html
                ├── Build/
                │   ├── *.loader.js
                │   ├── *.framework.js
                │   ├── *.data
                │   └── *.wasm
                └── release-manifest.json
```

The versioned path is immutable. Root only redirects to the versioned candidate.

After the public static gate passes, UBA output receives:

```text
slegnuce-preview-url.txt
slegnuce-release-manifest.json
```

The hook then calls `dispatch-roundtrip.mjs`. With `GITHUB_RELEASE_TOKEN` configured, it sends repository dispatch event `slegnuce-preview-ready` containing only the candidate's Preview URL, version, artifact digest and Git commit. It never sends Vercel or Unity secrets to GitHub as payload data.

The post-build hook has no `--prod` path. A build on `main` is still only a candidate.

## 4. Artifact identity

`package-vercel-release.mjs` hashes every file emitted by Unity with SHA-256 and computes one release-level `artifactDigest` from the ordered tuple of relative file path, file SHA-256 and file size.

Packaging time and Vercel metadata are excluded. Repackaging identical Unity output therefore yields the same artifact digest.

The release manifest uses schema `slegnuce.release/1` and records version, Git commit, Unity build number, Unity version, aggregate digest, immutable route and per-file hashes.

This digest proves byte identity only. It does not prove that the game executed correctly.

## 5. Public static Preview gate

`verify-vercel-preview.mjs` treats Vercel's successful deployment response as a claim that still needs external verification. It fetches the public Preview and requires:

1. reachable `release-manifest.json`;
2. matching schema, version and artifact digest;
3. reachable Slegnuće Unity template index;
4. non-empty loader;
5. non-empty `.wasm`;
6. `.wasm` served with `Content-Type: application/wasm`.

That gate proves transport and hosting identity. It intentionally does not say the WebAssembly executed.

## 6. Automated Chromium round-trip gate

The behavior boundary is now automated in `.github/workflows/slegnuce-roundtrip.yml` and `scripts/headless-roundtrip.mjs`.

The normal path is:

```text
UBA Preview passes static verification
       ↓
dispatch-roundtrip.mjs
       ↓
repository_dispatch: slegnuce-preview-ready
       ↓
GitHub Actions Ubuntu runner
       ↓
Playwright 1.62.0 + Chromium
       ↓
public immutable Vercel Preview
       ↓
12 / 12 ROUNDTRIP_TEST conditions
       ↓
slegnuce-roundtrip-report.json
```

The Playwright script uses only `window.SLEGNUCE_SHELL`, the same public bridge available to a real hosting page. It does not call private `RunEngine` methods.

To prevent event races, the Web template now records a bounded `eventHistory` with monotonically increasing sequence numbers. Each test records the current sequence before sending its command and only accepts an expected event produced later.

The twelve detailed conditions remain documented in `ROUNDTRIP_TEST.md`. They cover startup, scenario identity, carrier gating, exact legal mutation, event payload, completion, browser persistence, restore, state equality, fingerprint equality, restore rejection and fresh-run reset.

GitHub uploads a JSON evidence report even if the gate fails. Browser console output is bounded and included for diagnosis.

The workflow can also be launched manually by supplying Preview URL, version and digest. That is the fallback when UBA dispatch credentials have not yet been configured.

## 7. Production is a separate authority operation

A successful automatic browser gate does not promote production.

Production is available only from manual `workflow_dispatch` with:

```text
promote_after_pass = true
```

The promotion job depends on the successful Chromium job and enters GitHub environment:

```text
slegnuce-production
```

Configure `VERCEL_TOKEN` and `VERCEL_ORG_ID` as secrets for that GitHub environment. GitHub environment protection can add a reviewer requirement before the job receives those secrets.

The job calls `promote-vercel.sh` with the exact Preview URL, expected version and expected digest. The script re-runs public static verification and then calls Vercel promotion on the existing deployment.

It does not call Unity. It does not run the packager. It does not create a second Vercel deployment.

## 8. Parallel work and synchronization

Ordinary website work and the Unity cloud compile can happen in parallel. Production cannot precede the point where both the intended artifact and its public browser behavior are known.

```text
                    ┌─ shell/docs work ───────┐
main commit ────────┤                         ├─ explicit release authority
                    └─ UBA → Preview → 12/12 ─┘
```

The release gate is the synchronization point. Parallelism before that point saves time. Publishing before that point loses provenance.

## 9. GitHub CI versus release workflow

The ordinary `Balkan Survival integrity` workflow still does not claim to compile Unity or execute WebAssembly. It performs credential-free source tests:

```text
node scripts/validate-webgl-project.mjs
node scripts/test-release-packager.mjs
node --check scripts/*.mjs
bash -n webgl/cloud/*.sh
```

A separate `Slegnuce Preview Round Trip` workflow is allowed to make the stronger browser claim because it receives a real public Preview and launches a real Chromium process.

Keeping those two workflows separate prevents a green static source check from being mislabeled as a successful game execution.

## 10. Project MAIN remains a final separate decision

Vercel production and project `MAIN` are still not synonyms.

A successful Vercel production promotion proves that the tested Unity Web deployment was granted the production alias. `data/production.json` should only move from browser build `0.1.1` to a Unity build after deployment, 12/12 behavior, visual quality, performance and editorial acceptance are all sufficient.

The release model therefore remains:

```text
newest commit != newest cloud artifact != Vercel production != project MAIN
```

The four states may eventually coincide. The project must never assume that they do.
