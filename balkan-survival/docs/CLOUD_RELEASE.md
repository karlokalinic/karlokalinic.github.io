# CLOUD RELEASE — Unity Build Automation → Vercel

Status: **prepared in source, not yet connected to the user's Unity Cloud configuration**.

This document defines the release contract for the first Unity Web artifact. It deliberately separates compilation from publication. Unity Build Automation (UBA) is responsible for opening the pinned Unity project and producing a Web build. The repository-owned packager turns that build into an immutable Vercel Build Output API bundle. Vercel creates a Preview deployment. Production is not rebuilt: the already tested deployment is promoted.

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
browser gate
    ↓
PROMOTE THE SAME DEPLOYMENT
```

A release is invalid if production is produced by running Unity again after the preview was approved.

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

The project currently pins `6000.3.16f1`. UBA supports the Unity 6000.3 LTS line. If the exact patch is ever unavailable on the selected builder, do not silently edit the project or auto-upgrade it in cloud configuration. Change the pin in source control as its own reviewed project change.

The pre-export method regenerates the prototype scene, runs the five buildability self-tests, applies the custom `PROJECT:Slegnuce` Web template and assigns the cloud release version. UBA remains responsible for the actual WebGL compile.

For this first cloud-release contract `PlayerSettings.WebGL.compressionFormat` is explicitly set to `Disabled`. This is not intended as the final bandwidth optimization. It removes `Content-Encoding` as a hidden hosting dependency while we prove artifact identity, preview deployment and browser restore. Vercel can still apply transport compression. Brotli can be introduced later as an explicit build-and-hosting change.

## 2. Vercel must be a dedicated project

Do not point this pipeline at a shared website or an existing multi-purpose Vercel project.

The post-build script refuses to deploy unless:

```text
SLEGNUCE_VERCEL_PROJECT_PURPOSE=slegnuce-dedicated
```

This is an intentional guardrail. A Vercel deployment replaces the deployment for the targeted Vercel project. The release pipeline must therefore receive the ID of a project whose only responsibility is serving Slegnuće Web artifacts.

Create that dedicated Vercel project once, then configure these UBA environment variables:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SLEGNUCE_VERCEL_PROJECT_PURPOSE=slegnuce-dedicated
```

`VERCEL_TOKEN` is a secret and must exist only in the cloud environment. Never commit it, print it in the devlog or place it in a browser bundle. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are routing identifiers, but they also do not need to be committed because the same source should be deployable to a replacement hosting project.

Optional:

```text
SLEGNUCE_RELEASE_VERSION=0.2.0-rc.17
```

If omitted, the post-build contract derives:

```text
0.2.0-rc.${BUILD_NUMBER}
```

UBA supplies `BUILD_NUMBER`, `GIT_COMMIT`, `UNITY_VERSION`, `OUTPUT_DIRECTORY` and other build metadata to scripts.

## 3. What the post-build script does

`webgl/cloud/uba-post-build.sh` never changes production.

It receives UBA's `OUTPUT_DIRECTORY`, packages the Unity player, creates a release manifest, generates a Vercel Build Output API directory, deploys that directory as Preview, verifies the public deployment and writes the resulting URL back into the UBA output directory.

The packaging step creates this shape:

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

The versioned path is immutable. The root page only redirects to it. The packager refuses path-like or malformed version strings rather than allowing a version label to become a filesystem operation.

## 4. Artifact identity

`package-vercel-release.mjs` hashes every file emitted by Unity using SHA-256. It then computes one release-level `artifactDigest` from the ordered list of:

```text
relative file path
file SHA-256
file size
```

The digest intentionally excludes packaging time and Vercel metadata. Two packager runs over the exact same Unity output therefore produce the same `artifactDigest` even if they happen an hour apart.

The release manifest uses:

```json
{
  "schema": "slegnuce.release/1",
  "version": "0.2.0-rc.17",
  "gitCommit": "...",
  "unityBuildNumber": "17",
  "unityVersion": "6000.3.16f1",
  "artifactDigest": "...",
  "route": "/releases/0.2.0-rc.17/",
  "files": []
}
```

This digest is not a substitute for gameplay tests. It answers a narrower question: are these the same bytes that were approved?

That narrowness is useful. A release gate should not claim philosophical identity when it can only prove binary identity.

## 5. Static Preview gate

After Vercel returns a Preview URL, `verify-vercel-preview.mjs` checks the deployed site rather than trusting upload success.

It requires:

1. `release-manifest.json` is reachable.
2. manifest schema and version match the intended release.
3. the public manifest's `artifactDigest` matches the locally packaged artifact.
4. the versioned Unity `index.html` is reachable and still contains the Slegnuće Unity Web template markers.
5. the loader is reachable and non-empty.
6. the `.wasm` file is reachable, non-empty and served with `Content-Type: application/wasm`.

This is a **static deployment gate**, not the twelve-case gameplay round-trip gate. It proves that the correct artifact arrived at the public host.

The UBA output receives:

```text
slegnuce-preview-url.txt
slegnuce-release-manifest.json
```

so the build result itself carries the address and identity of the Preview it produced.

## 6. Browser round-trip gate

The existing `docs/ROUNDTRIP_TEST.md` remains the authoritative gameplay integration gate.

A Preview is not eligible for production until a real browser has demonstrated the required Unity ↔ browser behavior, including state export, restore, fingerprint consistency, rejection of unsupported schemas and clean new-run state.

The static verifier in this release slice does not execute WebAssembly or pretend that fetching the `.wasm` file is equivalent to running it.

A later source milestone should automate `ROUNDTRIP_TEST.md` through a headless browser against the Vercel Preview. Until then this remains the explicit unresolved boundary between successful deployment and successful game execution.

## 7. Production is promotion, not deployment

Once the Preview has passed the browser gate, production must use:

```bash
SLEGNUCE_RELEASE_APPROVED=YES \
SLEGNUCE_EXPECTED_VERSION=0.2.0-rc.17 \
SLEGNUCE_EXPECTED_DIGEST=<digest> \
./balkan-survival/webgl/cloud/promote-vercel.sh <preview-url>
```

The script re-runs the public static verifier immediately before promotion and then calls Vercel's promotion command on the existing deployment.

It does **not** call Unity.
It does **not** run the release packager again.
It does **not** create another Vercel deployment.

The artifact that passed the gate is the artifact that receives production status.

## 8. Parallel work without a race condition

Compilation and ordinary website work can happen in parallel. For example, documentation and the web shell can have independent Preview deployments while UBA is compiling the Unity player.

The production decision is intentionally serialized.

```text
                    ┌─ web shell work ─ preview ─┐
main commit ────────┤                            ├─ release gate ─ promote
                    └─ UBA Unity compile ────────┘
```

The gate is the join point. Publishing before the branches join would allow a shell to reference a binary that did not pass, or a binary to be promoted with a shell it was never tested under.

Parallelism saves time only when it does not destroy provenance.

## 9. CI contract in GitHub

GitHub Actions still does not claim to compile Unity.

It does, however, validate the cloud-release machinery without credentials:

```text
node scripts/validate-webgl-project.mjs
node scripts/test-release-packager.mjs
bash -n webgl/cloud/uba-post-build.sh
bash -n webgl/cloud/promote-vercel.sh
```

`test-release-packager.mjs` creates a fake minimal Unity output, packages it twice and proves that timestamp changes do not alter the Unity artifact digest. It also verifies the immutable release path and Vercel Build Output API configuration.

That is the right boundary for ordinary GitHub CI: it can test our packaging logic and release policy without pretending that a Unity Editor process ran.

## 10. Promotion to project MAIN remains separate

Vercel production and the project's historical `MAIN` label are related but not identical.

A successful Vercel production promotion proves that a Unity Web release was deployed. The public project hub should only switch `data/production.json` to that Unity build after the deployment, browser round-trip and presentation quality gates are accepted.

This preserves the existing rule:

```text
newest commit != newest cloud artifact != MAIN
```

Those three states can coincide, but the project must never assume that they do.
