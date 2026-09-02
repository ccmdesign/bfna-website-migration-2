# Spec — recover the v1 component inventory (RETRIEVAL)

## Objective
Recover, in full and verbatim, the initial ("v1") BFNA component inventory and the
architecture/epic plan that accompanied it, so a second iteration can be diffed
against it. This is a retrieval task: the VALUE IS THE CONTENT. Do not summarise
the inventory in place of quoting it.

## Where to look (in this order)
Repo (main checkout): /Users/claudiomendonca/Documents/GitHub/ccmdesign/ccm-clients/bfna/bfna-website-migration-2
1. `_process/scoping/atomic-component-inventory.md`   ← primary artifact
2. `_process/scoping/architecture-and-epics.md`       ← companion (epics E0–E5)
3. Anything else in `_process/scoping/` whose name suggests components, atoms,
   design system, tokens, or epics — list them, read the relevant ones.
4. `git log --all --oneline -- _process/scoping/` and
   `git log --oneline origin/feature/front3-wf-components -20` (that branch may
   hold started DS work — report what it contains, do NOT check it out).
5. Plane, workspace `ccm-design`, project "CCM - BFNA" (UUID
   af63ebaf-04bc-44b0-9f2a-bc609f420b02). Load creds with
   `set -a; . ~/Documents/GitHub/ccmdesign/ccm-ops/secrets/triage.env; set +a`
   then use $PLANE_API_KEY / $PLANE_BASE_URL / $PLANE_WORKSPACE_SLUG.
   Pull BF-150 through BF-215 (epics E0–E5 and every sub-item): sequence id,
   name, state name, assignee, parent, description (plain text, tags stripped).
   Read-only — create/modify NOTHING in Plane.

## Deliverables (write files, return paths)
- `_process/scoping/component-inventory-v2/recovered-v1-inventory.md`
  The v1 inventory document(s) VERBATIM, cleaned (strip nothing but envelope).
  Head it with: source path · git first-commit date · last-commit date · author.
- `_process/scoping/component-inventory-v2/recovered-v1-plane-epics.md`
  A table: BF-id · title · state · parent epic · assignee, one row per item,
  ordered by epic then id. Under it, each epic's description verbatim. Sub-item
  descriptions verbatim too, but if that exceeds ~300 lines total, keep full
  descriptions for epics only and first line for sub-items, and say so.
- Do NOT edit any existing file.

## Return shape — the retrieval contract, nothing else
finding:   2–4 lines. What v1 is, how many components it lists, how it's
           organised (atoms/molecules/organisms/templates?), whether Plane
           mirrors it 1:1 or diverged, and whether front3-wf-components holds
           any implementation.
source:    paths + dates + Plane project link
verbatim:  the component LIST from the inventory (names + one-line purpose),
           cleaned — this is the decisive excerpt. Full doc is in the file.
context:   one line each for the other docs found in _process/scoping/
artifact:  the two file paths above
Stop conditions: if `_process/scoping/atomic-component-inventory.md` does not
exist, say so first and report what you found instead. Never invent content.
