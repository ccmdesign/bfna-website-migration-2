# gh#236 — `verify.yml` on PR→`dev` + track the lockfile

Gate for the accessibility pass-1 run (site-epic #82, Plane BF-219). Every issue in
that run auto-merges to `dev` and there is no CI on `dev` today — `.github/` does not
even exist there. This lands the gate first.

## Approach

Four verification steps, in the order the issue names them, all run from
`bfna-website-nuxt/`:

1. `npm ci` — needs a tracked lockfile (see below).
2. **typecheck against a committed baseline**, not `exit 0`. `npm run typecheck` is
   `nuxt typecheck && npm run typecheck:scripts`; the `&&` means the second half
   never runs today because the first half exits 2. The gate therefore runs both
   halves itself, merges their diagnostics, and compares them to a checked-in
   baseline.
3. `npx nuxt generate` — **never** `npm run generate`, which prefixes
   `node ./contentImporter.js` and needs Directus credentials CI does not have.
   `nuxt generate` alone builds from the committed `src/content/bf/**` snapshots.
4. `npx tsx scripts/check-routes.ts` — its own static server over `.output/public`
   plus headless Chrome over CDP.
5. `npx tsx scripts/check-links.ts` — linkinator, and it needs an HTTP server on
   `:3000`, which nothing in the repo starts. The workflow serves
   `.output/public` on 3000 before the step.

## Files to touch

| file | why |
| --- | --- |
| `.gitignore` | drops the `.github/` line — it would ignore the workflow being added |
| `bfna-website-nuxt/.gitignore` | drops the `package-lock.json` line |
| `bfna-website-nuxt/package-lock.json` | **new, tracked** — `npm ci` has nothing to install from otherwise |
| `.github/workflows/verify.yml` | **new** — the gate |
| `.github/typecheck-gate.mjs` | **new** — baseline comparison + the "which errors are new" message |
| `.github/typecheck-baseline.txt` | **new** — the committed baseline |
| `docs/decisions/gh236-ci-verify-workflow.md` | the four decisions below |

`.github/typecheck-gate.mjs` deliberately does **not** live under a directory named
`scripts/`: the root `.gitignore` carries a bare `scripts/*` line that matches such a
directory at any depth, and the existing `bfna-website-nuxt/scripts/*.ts` are only in
the tree because they were force-added.

## The typecheck baseline

The issue quotes 73. Measured here (worktree, node 24.15.0, `npm ci` off the lockfile
being committed): **89** from `nuxt typecheck` plus **1** from `typecheck:scripts`
(`TS2688: Cannot find type definition file for 'node'` — `@types/node` is not a
dependency), so **90** total. The number in the issue predates a dependency bump or
was taken from `nuxt typecheck` on a differently-resolved tree; either way the gate
must not encode a number that was not measured.

A single integer is also the wrong shape: it goes green when one error is fixed and
a different one is introduced. The baseline is instead a set of
`file → TS-code → count` rows. A run fails when a `(file, code)` pair appears that is
not in the baseline, or appears more times than the baseline allows — and the failure
message prints the offending diagnostics verbatim. Fewer errors than baseline is
reported and passes, with a note to refresh the file.

None of the 90 are touched. Site-epic #83 pays that debt and flips the gate to
`exit 0` when it does.

## Chrome for `check-routes.ts`

`scripts/check-routes.ts` resolves its binary from `$CHROME_PATH`, then the
`ms-playwright` cache, then `/usr/bin/google-chrome`. `ubuntu-latest` ships Google
Chrome stable at that path, so the workflow points `CHROME_PATH` at it, and falls
back to `npx playwright install chromium` (which the script's `ms-playwright` probe
then finds) if the runner image ever stops shipping it. So `check-routes` runs in CI —
no residual issue needed unless the run proves otherwise.

## Proving it works

- **green on a no-op** — this PR is itself the no-op: it adds CI and a lockfile and
  changes zero lines of application code. All four steps were run locally first and
  all four pass (generate exits 0 in 36s; check-routes 13 groups / 55 rows / 0
  failures; check-links 1381 links, zero broken). The run on this PR is the evidence.
- **red on a planted typecheck error** — a scratch branch off this one adds one
  deliberate type error to a file with no baseline entry, opens a PR to `dev`, and the
  run URL goes in the PR body. The branch is deleted; nothing planted reaches `dev`.

## Risks

- **The baseline was measured on macOS/arm64; CI is linux/x64.** vue-tsc can differ.
  Mitigated by the gate printing the full observed signature list on every run, so one
  CI iteration is enough to correct the file if it differs. Counts *below* baseline do
  not fail, which absorbs the common direction of drift.
- **`check-links` follows external URLs** (`bfna.simplyas.com` asset links resolve
  200 today). A third-party outage turns the gate red for reasons unrelated to the PR.
  Accepted for now — the skip list already covers the social domains — and recorded in
  the decision note as the first thing to loosen if it proves flaky.
- **`npm ci` pins nothing about the runner's node.** The workflow pins node 24 to
  match the tree the lockfile was resolved against (`better-sqlite3` is native).
