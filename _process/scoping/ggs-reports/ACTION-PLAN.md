# GGS Reports — Consolidated Action Plan

*Synthesized 2026-08-06 from the three GGS docs (full extractions + digests in this
directory). Verdict first: **all three documents validate the wireframe approach —
zero contradictions with decisions already made** (3 Programs > Projects taxonomy,
semantic search, archive-stays-indexed, participation CTAs). The live site's
accessibility failures stem from custom-markup bloat; GGS's own prescription
("native HTML first, minimal ARIA") is exactly the pattern the wireframes use.*

**The docs:**
| Doc | Date | Nature | Digest |
|---|---|---|---|
| Accessibility Audit | Jan 13 2026 | WCAG 2.1 AA audit of 6 live-site templates | `accessibility-audit-digest.md` |
| Audience-Centric Web Strategy | Feb 20 2026 | Decision-framework checklist (no personas) | `audience-strategy-digest.md` |
| Site Flow + UX Recommendations | May 21 2026 | The IA framework the wireframes were built on | `site-flow-ux-compliance.md` |

**Compliance vs the Site Flow doc: 24 done / 4 partial / 1 missing / 5 deliberately
diverged, of 34 recs** — including the exact recommended homepage headline.

---

## 1 · Do now (Front 2 — wireframes)

- [ ] **About page: add "connection to programs" element** — GGS asks twice; the only
  concrete wireframe gap. Small: a band on /wireframes/about linking the mission to
  the 3 program hubs.
- [ ] *(decision, not build)* **Unequal prominence** — audience doc wants priority
  topics elevated rather than the 3 programs treated equally. Needs BFNA to name
  its priorities → goes on the Irene list below; wireframe change only after.

## 2 · Irene sign-off bundle (send with the wireframe link)

1. **Darker brand orange** — `#fa8900` fails contrast (2.43:1) everywhere; GGS proposes
   `#d47a0b`/`#a65c00`. Green `#4f8d71` large-text-only. Visible accent change inside
   the "no rebrand" front — explicit approval needed.
2. **Podcasts + Documentaries nav buttons** — beyond GGS's six-item nav; also need the
   real podcast-platform URL (placeholder today).
3. **Transponder as homepage product band** (moved out of Insights menu) — Q6; also
   still needs its external URL + copy.
4. **Projects-dropdown flagship list** (which 5 projects) — Q1 follow-through.
5. **Homepage hero copy** — still the CCM placeholder pending her confirmation.
6. **Priority topics** — which programs/projects get elevated prominence (audience doc).
7. One-liner: confirm "evolve UI now, align with Stiftung rebrand later."

## 3 · Front 3 backlog (UI build)

- Keyboard access as acceptance criteria: visible focus indicators, operable menu,
  no modal traps, ≤ a few tab stops to content (live site: 40+), skip links.
- Contrast-safe accent palette (pending #1 above).
- Forms decision: in-house vs Mailchimp embed — audit found generic errors,
  color-only cues, reCAPTCHA barrier. Ironically Mailchimp's own form scored 9/10
  vs homepage 2.6/10, so embed-with-care is viable; in-house gives full control.

## 4 · Front 4 / backend backlog (data, SEO, CMS)

- **JSON-LD structured data** in production templates (the one truly *missing* rec —
  rightly absent from noindexed wireframes, but must not be lost).
- **Archive must NOT be noindexed** in production (AI-SEO requirement).
- **Directus schema enforcement**: required alt text, required author/summary,
  tagged/accessible PDFs (the alt-text debt is a schema + migration problem, not
  a template problem).
- Microsites deferred by GGS to a later audit — out of scope for now.

---

*Sources of truth: the six extraction/digest files beside this plan. The wireframe
deploy for review: https://wireframes--bfna-site-v2.netlify.app/wireframes/*
