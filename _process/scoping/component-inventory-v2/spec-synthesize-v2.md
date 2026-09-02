# Spec — synthesize component inventory iteration 2 (ANALYSIS)

## Objective
Reconcile the v1 planned inventory against what the wireframes actually built,
and draft iteration 2. Output is ONE file. Return a compact verdict.

## Inputs (read all three; they are the only sources you need)
Dir: /Users/claudiomendonca/Documents/GitHub/ccmdesign/ccm-clients/bfna/bfna-website-migration-2/_process/scoping/component-inventory-v2/
1. recovered-v1-inventory.md        — v1 plan, verbatim (5 levels, ~48 components)
2. recovered-v1-plane-epics.md      — Plane E0–E5 tree, BF-150…215
3. as-built-wireframe-inventory.md  — what exists today (sections A–F)

## Decisions made AFTER v1 that you must apply (authoritative; do not re-litigate)
- D1  Prefix: final components are `bf-*`. v1 prose may say `ccm*`; the Plane
      epics already say `bf-*`. Iteration 2 uses `bf-*` everywhere. Note the
      rename once, then just use it.
- D2  The newsletter/subscribe band and the nav Subscribe button were REMOVED
      sitewide on client instruction (BFNA runs no newsletter). v1's
      subscribe CTA variant is dead scope. A generic CTA section may survive
      only if the as-built audit shows another use of wfCtaSection.
- D3  The "Other programs" cross-links row was removed from all hubs
      (Claudio, Sep 2). v1's "cross-links row (new)" is dead scope.
- D4  NEW since v1: a product/magazine card (as-built `wfCardProduct`) that
      takes a full-width slot in a card grid via `.wf-card[data-span="full"]`
      (grid-column: 1 / -1). Treat as a 6th typed card + a grid-slot modifier.
- D5  The Insights band on a program hub is now CONDITIONAL per hub (Future
      Leadership has none). The hub template must express that.
- D6  Composition layer stays (Every Layout), bugs get fixed — v1 E0 already
      says so. The audit's finding that `data-min-width` is never used and 7
      grids are hand-pinned is E0 scope: propose the fix there, not per-card.
- D7  Data layer is SSG + @nuxt/content, no Pinia. bf-* components are
      presentational-only (props in, events out). Any v1 entry that assumes
      data access inside a component is wrong; correct it.
- D8  Nothing in Plane E0–E5 has started. You may propose merging, splitting,
      renaming or killing sub-items freely; reference them by BF-id.

## Deliverable
Write `component-inventory-v2.md` in the same dir, with exactly these sections:

1. **Reconciliation** — one table, one row per v1 component (all levels):
   v1 name · v1 verdict · as-built counterpart (wf-* or CSS primitive or "—")
   · status ∈ {confirmed, changed, removed, unbuilt-still-valid, unbuilt-dead}
   · one-line evidence (as-built entry, page, or decision D1–D8).
   Then a second short table: as-built things with NO v1 counterpart.
2. **Iteration-2 inventory** — same 5-level structure as v1. Per component:
   `bf-*` name · purpose · built from (wf-* source or "new") · props contract
   sketch (name:type) · slots · variants · data type consumed (WfInsight etc.)
   · verdict {keep, evolve, rebuild, new} · Plane BF-id(s) it maps to.
   Keep the base+typed-wrapper card pattern explicit.
3. **Delta vs v1** — four lists: removed · added · renamed · scope-changed.
   Counts per level at the end.
4. **Plane implications** — per epic E0–E5: sub-items to kill (BF-id + why),
   to add (proposed title), to re-scope (BF-id + what changes). Do NOT touch
   Plane; this is a proposal.
5. **Open decisions** — things that need Claudio or GGS, each one line with
   the options. Include the modal gap v1 already flagged if still open.

Tables over prose. Cite as-built section letters / file:line where useful.
Do NOT edit any other file.

## Verification (report pass/fail)
- Every v1 component appears exactly once in section 1.
- Every as-built wf-* component appears in section 1 (either as a counterpart
  or in the "no v1 counterpart" table).
- Every section-2 component has a verdict and at least one BF-id or "NEW".

## Return shape — compact verdict, ≤ 14 lines
- counts: v1 components → iteration-2 components (per level, one line)
- delta: removed / added / renamed / re-scoped (numbers)
- the 3 decisions that most change the Plane epics
- open decisions count, and the single most consequential one
- verification: 3 checks pass/fail
- artifact path
No pasted tables.
