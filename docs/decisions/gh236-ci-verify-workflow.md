# gh#236 — decisions behind `.github/workflows/verify.yml`

Context: the accessibility pass-1 run (site-epic #82, Plane
[BF-219](https://app.plane.so/ccm-design/browse/BF-219/)) auto-merges its issues into
`dev`, and `dev` had no CI at all — `.github/` did not exist on it. This is the gate,
landed first so the rest of the run merges behind a real check.

## 1. The typecheck baseline is 90, not 73 — and it is a set, not a number

The issue quotes a 73-error baseline. Measured in the worktree, on node 24.15.0, off
the lockfile this PR commits:

| source | diagnostics |
| --- | --- |
| `npx nuxt typecheck` | 89 |
| `npm run typecheck:scripts` | 1 |
| **total** | **90** |

The scripts half is a single `TS2688: Cannot find type definition file for 'node'` —
`tsconfig.scripts.json` sets `"types": ["node"]` and `@types/node` is not a dependency.
It has never been seen before because `npm run typecheck` is
`nuxt typecheck && npm run typecheck:scripts`: the `&&` means the second half has not
run since the first half started failing. The gate runs both halves itself.

73 was presumably measured against a differently-resolved `node_modules` (there was no
tracked lockfile until this PR, which is precisely the problem it fixes). The gate
encodes what was measured, not what was quoted.

**Why a set and not an integer.** A count goes green on a commit that fixes one error
and introduces another — the exact regression the gate exists to catch. The baseline is
`<file>\t<TS-code>\t<count>` rows in `.github/typecheck-baseline.txt`; a run fails when
a `(file, code)` pair is absent from the baseline or exceeds its count, and prints the
offending diagnostics verbatim so the failure names the new errors. Line and column are
dropped on purpose: keeping them would churn the baseline on every edit above an
existing error and train people to regenerate it without reading it.

Fewer errors than baseline **passes**, with a note to refresh. A gate that fails on
somebody having fixed something is a gate people learn to skip.

None of the 90 are fixed here. Site-epic #83 owns that debt and flips the gate to a
hard `exit 0` when it is paid.

## 2. `npx nuxt generate`, never `npm run generate`

`npm run generate` is `node ./contentImporter.js && nuxt generate`. The importer pulls
from Directus and needs credentials CI does not have and should not be given for a PR
check. `nuxt generate` alone builds from the `src/content/bf/**` snapshots that are
committed for exactly this reason. It exits 0 in ~36s locally.

It prints `[request error] … no such column: "path"` from a `__nuxt_content/docs/query`
route during prerender and still exits 0. That is pre-existing and out of scope here;
it is noise in the log, not a gate failure.

## 3. `check-routes.ts` runs in CI — no residual needed

The issue anticipated that the CDP harness might not survive the runner. It does.
`scripts/check-routes.ts` brings its own static server over `.output/public` and
resolves a browser from `$CHROME_PATH` → the `ms-playwright` cache →
`/usr/bin/google-chrome`. `ubuntu-latest` ships Chrome stable at that path, so the
workflow just points `CHROME_PATH` at it. If a future runner image drops it, the step
falls back to `npx playwright@1 install --with-deps chromium`, which populates the
`ms-playwright` cache the script already probes — so the fallback needs no change to
the script.

Locally: 13 check groups, 55 rows, 0 failures, ~20s.

## 4. `check-links.ts` needs a server nothing in the repo starts

It shells out to `linkinator` against `http://localhost:3000` and assumes something is
already listening. The workflow serves `.output/public` with `npx --yes serve@14`
before the step and kills it after, propagating the check's exit code rather than the
`kill`'s.

`npx nuxt preview` does the same job — it literally execs `npx serve public` — but via
an unpinned `npx` inside Nuxt's own CLI. Pinning the major here keeps the failure mode
legible.

**Known soft spot:** `check-links` follows external URLs. `bfna.simplyas.com` asset
links resolve 200 today and are not in the script's skip list, so a Directus outage
turns this gate red for reasons that have nothing to do with the PR under test.
Accepted for now (1381 links, zero broken, 3.2s). If it proves flaky, the first thing
to loosen is the skip list in `scripts/check-links.ts` — not the gate.

## 5. Two `.gitignore` lines had to go

- Root `.gitignore` carried a bare `.github/`. The workflow could never have been
  committed with it in place.
- `bfna-website-nuxt/.gitignore` carried `package-lock.json`, which is why the epic
  says `npm install` and not `npm ci`. The lockfile is now tracked at
  `bfna-website-nuxt/package-lock.json` — not the repo root, which already has an
  unrelated tracked `package-lock.json` with no `package.json` beside it.

Root `.gitignore` also has a bare `scripts/*`, which matches a directory named
`scripts` at **any** depth — the existing `bfna-website-nuxt/scripts/*.ts` are only in
the tree because they were force-added. That is why the gate script is
`.github/typecheck-gate.mjs` and not `.github/scripts/typecheck-gate.mjs`. Left alone
rather than fixed: narrowing that line is a change with blast radius beyond this issue.
