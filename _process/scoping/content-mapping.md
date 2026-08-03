# Content Mapping — old 4 workstreams → new 3 areas

**Generated 2026-07-31, rev 2.** Proposal for Irene's confirmation (call week of Aug 3). No CMS writes; the mapping gets applied to `inventory/data/*.json` and later to Directus only after sign-off.

**Sources & precedence**: Claudio's archive rule (Jul 31) > Irene's Jul 31 inline answers > Irene's Jul 29 email to GGS > Irene's Jul 29 docx > GGS Site Flow (May 21). GGS confirmed they will **not** deliver a content map (Irene, Jul 31); Irene answers mapping questions directly.

## Ground rules

1. **Archived content is out of the mapping (Claudio, Jul 31).** Everything past the 3-year cutoff (publish_date < 2023-07-31) goes into a single **Archives** bucket — no program assigned, searchable, but not linked anywhere else on the site. No questions to Irene about archived items. That removes **256 of 354 insights** plus the legacy projects (CEPI 2010/2011, 100 Questions, Uncivil War films) from the exercise. *(Side effect to settle in Front 2: nav-proposal currently sketches an /archive browse page and an "include archive" feed toggle — "searchable only, not linked" may moot both.)*
2. **External-project content is out of scope.** HTFD episodes (28) already removed from insights.json. The main-site CMSs contain **zero** items belonging to Barometer, Periscope, RANGE, Astropolitics, or Indo-Pacific Nexus (verified by tag and by heading sweep). Those projects appear below only as cards/rows to place under a program.
3. **Archive flag**: `archived` stays **computed** (3-year rule) plus one manual override field — `archive_override: null | "archived" | "active"` (Directus dropdown; override wins, `null` follows the rule). Replaces the `evergreen` boolean. It's also the mechanism for the six force-archive calls below and the only way to classify undated items.
4. **Old workstreams retire.** GGS's guidance is the new taxonomy itself ("Introduce tagging (focus area, program, format)"; topic explorer Focus Area → Content → Program) — nothing asks to preserve the old workstream labels. Legacy value stays in each item's `legacy` blob only.

## Terminology (✅ settled Jul 31)

Irene (Jul 31, after clarifying with GGS): *"we will call the Focus Areas — **Programs** … What GGS identifies as Programs we call **Projects**. Moving forward we will have 3 Programs and within these programs multiple projects."* **Adopted same day (Claudio):** all scoping docs, wireframes, and data files now use **Programs** (3, top level) / **Projects** — data keys `program`, `projects`, `parent_project`; data files `programs.json` (the 3) and `projects.json`.

The 3 programs (Irene-confirmed): **Democracy** · **Transatlantic Relations & Global Challenges** ("TR&GC") · **Future Leadership**. Digital World ("Digital Economy") is dropped as a program.

## 1. Projects → Programs

✅ = stated by Irene · ◦ = proposed (high confidence) · ❓ = parked in Questions

### Transatlantic Relations & Global Challenges
| project | basis | notes |
|---|---|---|
| Transatlantic Barometer ↗ | ✅ Irene Jul 29 | "projects within the TR&GC program" |
| Transatlantic Periscope ↗ | ✅ Irene Jul 29 | 〃 |
| RANGE ↗ | ✅ Irene Jul 29 | 〃 |
| Astropolitics ↗ | ◦ | microsite (per Irene's Jul 23 highlight-card copy); space geopolitics |
| Indo-Pacific Nexus ↗ | ◦ | microsite; + "Indo-Pacific in Focus" podcast → ❓ Q-2 |
| Critical Minerals | ◦ | Lithium Rising report lives in main insights |
| The Transponder | ◦ | magazine (7 issues) **+ new podcast, 15+ eps** → ❓ Q-1 |
| Bridging the Atlantic (podcast) | ◦ | transatlantic by name and content |
| Wisdom of the Crowd (podcast) | ◦ | all 6 episodes are transatlantic/geopolitics topics (China, economy, space race, tech policy) — not Democracy despite the name |

### Democracy
| project | basis | notes |
|---|---|---|
| How to Fix Democracy ↗ | ◦ | separate project/site; only its card lives here |
| City Solutions Series | ◦ | urban democracy documentaries |
| Election Analysis | ◦ | 9 election insights attach here |
| Graphic Images | ◦ | autocrats data-viz project |

### Future Leadership
| project | basis | notes |
|---|---|---|
| Bertelsmann Foundation Fellowship (BFF) | ◦ | + 14 Class-of cohort children |
| Summer Enrichment Series | ◦ | + 4 cohort children |
| Leadership in Action (podcast) | ◦ | 9 episodes attach here |

### Archives (no program — per ground rule 1)
CEPI 2010 · CEPI 2011 · 100 Questions · Uncivil War (2 film videos, 2020/21). BFNA Documentaries as a *project card* is the one remaining open item → ❓ Q-3.

## 2. Insights → Programs (98 active of 354)

**256 archived → Archives bucket, unmapped.** For the 98 active (incl. undated), rule chain, first match wins:

1. **Project tag → inherit the project's program**: Election Analysis → Democracy · Leadership in Action → FL · Transponder issues → TR&GC · Wisdom of the Crowd → TR&GC · Bridging the Atlantic → TR&GC · Fellowship → FL · City Solutions → Democracy · Graphic Images → Democracy.
2. **Old workstream → new program**: Politics & Society → TR&GC · Democracy → Democracy · Future Leadership → FL · Digital World → TR&GC (3 items: Hotspots, Cybersecurity + AI R&D infographics — tech reads naturally as "Global Challenges").
3. **Force-archive via `archive_override`** (6 items, our call — not questions for Irene): Hidden Layers ×3 (1 dated Aug 2023 + 2 undated; series looks retired, last real issue Aug 2023) · Federalism in Crisis, Green Ideas, Transatlantic Trends 2020 (legacy reports carrying a 2024-02-28 re-publish date that games the 3-year rule; old workstream literally = "Archives").

### Resulting distribution (active)
| bucket | items |
|---|---|
| TR&GC | 71 |
| Democracy | 14 |
| Future Leadership | 7 |
| → Archives (force-archived) | 6 |
| **Archives total** | **262** |

## 3. Questions for Irene (active content only)

- **Q-1 · The Transponder** — the CMS has the *magazine* (7 issues, last May 2025); your emails show an active *podcast* of the same name (Samuel George, ep 15 as of Jul 2026). One project with two formats, or two projects? Is the magazine continuing? Podcast episodes exist **in neither CMS** — titles/descriptions are in the Word docs attached to the May 11 email (retrievable).
- **Q-2 · Indo-Pacific** — is "Indo-Pacific in Focus" (podcast, Marshall Reid) part of the Indo-Pacific Nexus project (microsite)? Do its episodes live on the main site or the microsite? (Also not in any CMS.)
- **Q-3 · BFNA Documentaries** — the active films (Lithium Rising, Open Veins of Potosí, both 2025) are referenced only by highlight cards; no CMS rows. One Documentaries project home, or each film under its thematic program (both would land in TR&GC today)?
- **Q-4 · Episodes in the Insights feed?** — podcasts render as project pages listing episodes (Irene's May 11 pattern). Open: do episodes *also* appear in the sitewide Insights feed? Applies to LiA (9), Bridging (6), WotC (6), Transponder podcast (15+).

## New copy captured from emails (not yet in data files)

- Podcast section order (May 11): HTFD · The Transponder · Indo-Pacific in Focus · Wisdom of the Crowd · Bridging the Atlantic — plus full series descriptions for HTFD, Transponder, and IPF (fills part of the `pending_copy` gap in projects.json).
- 8 rewritten highlight-card texts (Jul 23) — matches the 8 Directus `highlights`.
- New Bertelsmann Stiftung About-section copy + "remove the image film link" (Irene via Megan, Jul 30) — pending in static-content.json.
- Transponder + IPF episode lists sit in Word attachments on the May 11 email; not yet extracted.
