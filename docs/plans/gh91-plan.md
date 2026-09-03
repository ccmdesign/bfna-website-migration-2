# gh#91 — 13b Data composables: unfiltered members return copies

**Issue:** [#91](https://github.com/ccmdesign/bfna-website-migration-2/issues/91) (promoted residual of
[#22](https://github.com/ccmdesign/bfna-website-migration-2/issues/22), found in review of
[PR #90](https://github.com/ccmdesign/bfna-website-migration-2/pull/90))
**Folded in:** [#94](https://github.com/ccmdesign/bfna-website-migration-2/issues/94) — stale
`Number.MAX_SAFE_INTEGER` doc comment in `useBfProjects.ts` (same file, comment-only)
**Epic:** <https://app.plane.so/ccm-design/browse/BF-217/>
**Spec:** this issue has no `docs/ds-epic/issues/` spec file — the issue body plus the orchestrator
comment on #91 are the spec. Decisions are recorded at the bottom of this plan.

---

## 1. The rule

> Every **unfiltered** list member of the six `bf-*` data composables returns a **fresh** array
> (`[...arr]`). Filtered members already do — `.filter()` allocates before `.sort()` — and are left
> alone.

Why it matters: the unfiltered members hand back either the live `useAsyncData` payload array
(`data.value`) or a module-level singleton. A caller doing `people().sort()` or `menus().reverse()`
mutates the value every other consumer in the same render sees, and `useAsyncData` caches per key,
so the corruption survives across composable calls within a request.

## 2. Members changed (5 files)

| File | Member | Today | After |
|---|---|---|---|
| `useBfInsights.ts` | `items` | value: `all.filter(…)`, captured by `bySlug` / `archivedCountByProgram` | getter → `[...items]` |
| `useBfInsights.ts` | `active` | value, captured by `activeByProgram` / `insightsForProject` | getter → `[...active]` |
| `useBfInsights.ts` | `archived` | value | getter → `[...archived]` |
| `useBfProjects.ts` | `projects()` | returns `top` (shared, backs every list member) | `[...top]` |
| `useBfPrograms.ts` | `programs()` | returns `all` — **the payload array** | `[...all]` |
| `useBfPeople.ts` | `people()` | returns `all` — **the payload array** | `[...all]` |
| `useBfSite.ts` | `menus()` | returns `bfMenus` — **the module singleton** | `[...bfMenus]` |

`useBfPages.ts` has **no list member** (`pageBySlug`, `aboutPage`, `stiftungPage`, `homePage` all
return one document or `undefined`) — no change, named here so the "all six" sweep is provably
complete.

Left alone, already fresh: `activeByProgram`, `highlights`, `insightsForProject`,
`projectsByProgram`, `gridProjectsByProgram`, `productsByProgram`, `allProducts`,
`projectsPendingRetag`, `projectChildren`, `boardMembers`, `teamMembers`, and `navProjects` /
`featuredProjects` (via `orderBySlugs`, which already spreads).

### Why getters for `useBfInsights`

`items` / `active` / `archived` are exposed as **values**, not functions — that is the ported
`useWfContent` shape and page code destructures them without parens. A getter keeps that shape
byte-for-byte at every call site while handing out a fresh array **per access**, and the private
consts stay closed over by `bySlug`, `activeByProgram`, `archivedCountByProgram` and
`insightsForProject`, so those keep reading the un-mutated lists. A plain `items: [...items]` would
allocate once per composable call and still let one consumer's `.sort()` reach another's.

## 3. Also in scope — gh#94 (comment only)

`useBfProjects.ts:116-131`, the `gridProjectsByProgram` doc block, still says `grid_order` carries
`Number.MAX_SAFE_INTEGER` for unplaced slugs and that a **stable sort** is what keeps them behind
the ranked ones. gh#89 (PR #93) removed that sentinel: `normalise-wireframe-data.ts:313-336` now
emits `GRID_ORDER_FALLBACK (1_000_000) + <index in the snapshot's items array>` — a real ordinal
that carries snapshot order instead of depending on a tie. Behaviour is unchanged (the member still
sorts ascending on the field); only the prose is rewritten.

## 4. Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so acceptance is the probe
pages, rendered by `npx nuxt generate` against the real content database — the gh#20/gh#21/gh#22
precedent.

One copy-safety assertion is added to each of the three probes that own the changed composables
(11, 12, 13), through the same tiny local helper:

```ts
/** gh#91: a list member hands back a copy — mutating it cannot reach the next call. */
const isCopySafe = <T>(get: () => T[]) => {
  const a = get()
  if (a.length < 2) return false
  a.reverse()
  const b = get()
  return b !== a && b[0] === a[a.length - 1]
}
```

`b !== a` proves a new array; `b[0] === a[a.length - 1]` proves the second call still starts at the
element the first call started at, i.e. the reverse did not land on shared state. Each probe asserts
it over the members it owns — 11: `items` / `active` / `archived`; 12: `projects()` / `programs()`;
13: `people()` / `menus()` — and the existing rows keep proving nothing else moved.

Gates, run in `bfna-website-nuxt/`:

1. `npx nuxt typecheck` — count of `error TS` ≤ **178** (recorded baseline), and 0 in the scoped set.
2. `npx nuxt generate` exits 0.
3. `npx tsx scripts/verify-bf-people-pages-site-parity.ts` still passes (gh#22's acceptance).
4. Probes 11 / 12 / 13 render **PASS** in the generated output.
5. Wireframe byte-identity diff prints nothing, against both `dev` and the pre-epic base
   `f757a649361993275a43282456f4746d247be37b`.

## 5. Risks

- **Getter surprise.** `insights.items !== insights.items` after this change. Nothing in the repo
  compares those arrays by identity (only the three probes consume the composables today, and
  probe 13's `people().filter(p => !team.includes(p))` compares **elements**, which stay the same
  object references). Low.
- **Allocation.** One extra array copy per access of a ≤371-element array of references, on
  build-time-static content. Negligible.
- **Scope creep.** No behaviour change beyond the copies and the gh#94 comment; no new colours; no
  `wf-*` file touched; no component touched.

---

## Decisions

- **D-91.1 — Getters, not `[...arr]` at the return site, for `useBfInsights`.** The orchestrator's
  rule says "returns a fresh copy (`[...arr]`)". For the three value-shaped members that is spelled
  as a getter so the copy is made per **access** rather than once per composable call; the spread is
  identical, the call-site shape is unchanged, and the private arrays stay protected inside the
  closures that read them.
- **D-91.2 — `useBfPages` is exempt, not overlooked.** It exposes no list member; the sweep covers
  five of the six composables.
- **D-91.3 — vitest substitution (residual #86).** Acceptance is the probe pages plus
  `scripts/verify-bf-people-pages-site-parity.ts`, not a vitest test.
- **D-91.4 — gh#94 folded in here.** Comment-only, same file as the `projects()` change; the PR
  closes both issues explicitly.
