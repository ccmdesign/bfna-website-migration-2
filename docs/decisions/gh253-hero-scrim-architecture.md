# gh#253 — Hero + scrim architecture, and why one contrast pair moved

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/253>
PR: <https://github.com/ccmdesign/bfna-website-migration-2/pull/274>
Epic: <https://app.plane.so/ccm-design/browse/BF-220/>
Supersedes, in part: `docs/plans/bf220-design-phase-wave-1-plan.md` Phase 1's line
"`--color-program-on-dark` vs the scrim ground >= 4.5" (§3 below).

Two `.css`/`.ts` comments point here — `tokens/semantic-colors.css`'s scrim block and
`pages/[program].vue`'s `HERO_IMAGE` record — so this file carries the two things a
reader of those needs and a code comment cannot hold: the arithmetic, and the one
content decision a human still owns.

---

## 1. The rule, and why it is arithmetic rather than taste

A uniform navy scrim over the **worst case — a blown-out white photograph, which is
exactly BFNA's house style** — needs alpha >= 0.70 for white text at 4.5:1. `--hsl-navy`
is `201, 100%, 18%` → `#003C5C`, relative luminance **0.040044**.

| alpha | composited ground | white |
| --- | --- | --- |
| 0.60 | `#668A9D` | 3.692 fail |
| 0.65 | `#598095` | 4.245 fail |
| **0.70** | **`#4D778D`** | **4.840 PASS** |
| 0.94 (panel) | `#0F4866` | 9.817 pass |

**This is a guarantee, not a sample.** Source-over compositing is monotone per channel
and relative luminance is monotone in each channel, so the composited ground's luminance
is maximised when the photograph is pure white. Every other image composites *darker* and
therefore measures *higher*: mid-grey gives 8.657, black gives 14.944. So white type over
`--color-scrim` clears 4.5:1 for any photograph the client can ever upload, at any crop,
at any viewport. The in-browser pass against the four real photographs (4.90 / 5.05 /
4.90 / 5.83) is corroboration, not the proof.

At that alpha nothing else in the palette survives. To reach 4.5 over `#4D778D` a colour
needs relative luminance >= **0.9263** — white with a tint of hue left in it, not a
programme identity. The programme on-dark tier measures 1.923 / 1.642 / 1.869 there.

**Therefore, and this is the rule the whole architecture rests on: over media, type is
white. Programme colour appears only as an opaque fill — a chip, a rule, a panel — never
as text.** An opaque fill does not composite with the photograph, so it is safe whatever
the photograph is. That determinism is also what makes the later video pass tractable: a
fixed scrim over a moving image behaves exactly as one over a still.

This replaces production's failure mode, where a gradient hand-tuned to one photo
degraded from 10.55:1 to 2.21:1 across a single line of text.

---

## 2. Two modes, one attribute

`data-scrim` sits on the host band — `.bf-hero` / `.bf-page-header` — and `bfHeroMedia`'s
scrim reads it as an ancestor.

- **`full`** (default): flat `--color-scrim` over the band.
- **`panel`**: `--color-scrim-panel` as a near-opaque column the width of the content
  box, photograph uncovered either side.

`panel` ships with no call site. That is deliberate: the issue specifies both modes, the
gate measures both grounds, and the geometry is exercised and screenshotted, but the four
routes this item art-directs all take `full`. A later item that wants the treatment has it
without re-deriving the alpha.

---

## 3. The decision: three contrast pairs were re-pointed, not satisfied

`scripts/check-contrast.ts` carried three `program-on-dark--<slug>` pairs measuring
`--color-program-on-dark` against `over(--color-scrim, --color-surface-page)`. They
reported `not yet defined` because `--color-scrim` did not exist. Residual
[#264](https://github.com/ccmdesign/bfna-website-migration-2/issues/264) recorded that as
a coverage gap: a value sabotaged to 1.05:1 still exited 0.

**This item defined `--color-scrim` and found the pair unsatisfiable.**

- The ceiling over that ground is **4.840, reached by pure white**. Nothing else in the
  palette gets to 4.5 there (see §1).
- `future-leadership`'s on-dark red `#DC7986` (luminance 0.306116) needs a ground of
  luminance <= **0.029137**. Navy at full opacity is **0.040044** — already above it. So
  over a navy scrim red fails at *every* alpha for any photograph no darker than navy
  itself, which is precisely the case the pair's ground (`--color-surface-page`, white)
  models and the only case that can be asserted about an image nobody has uploaded yet.

Every alternative was costed and none satisfies the pair as written:

| design | teal | red | amber |
| --- | --- | --- | --- |
| scrim 0.70 (shipped) | 1.923 | 1.642 | 1.869 |
| panel 0.94 | 3.900 | 3.330 | 3.791 |
| opaque navy (alpha 1.0) | 4.633 | **3.955 fail** | 4.503 |
| lighten the on-dark tier | needs luminance >= 0.9263 — white with a tint |
| a near-black scrim instead of navy | needs alpha >= 0.82 — erases the photograph, and abandons the navy scrim |

So the pair was asserting exactly what §1 forbids: programme colour as text over media.
It is **re-pointed to `--color-surface-inverse`** (`#080808`) — the ground the tier is
named for, the ground `semantic-colors.css` has recorded its ratios against since gh#251,
and one nothing had ever checked. Live and passing at **7.957 / 6.792 / 7.734**.

The scrim ground is not left unmeasured. `white-on-scrim` (4.840) went live and
`white-on-scrim-panel` (9.817) was added — the one foreground the architecture ever puts
over media. **After this change no pair in the gate is pending.** `KNOWN_FAILURES` (one
row, amber, #263) and `SHIPPED_BASELINE` are byte-identical to `dev`; the self-check still
passes 14/14, and the gate now bites where it did not: the sabotage #264 recorded as
exiting 0 (`--hsl-program-on-dark` [democracy] pushed to L=12%) now fails at 1.49 and
exits 1.

### Where this departs from #264, stated plainly

#264's suggested fix was a **fourth** pair per programme against
`--color-surface-inverse`, with "the scrim-composited pairs stay pending for the hero
phase". This *is* the hero phase, and it is the phase that discovered the
scrim-composited pair can never pass. Adding a sibling and keeping the original would
have left three pairs reporting red forever, or pending forever, for a combination the
design forbids. So the pair is re-pointed rather than joined. #264's on-dark half is
closed by that; its other two items stay open — the `:root` neutral programme default
that no pair declares, and the observation that `pendingFrom` has no expiry rule.

### The residual risk this creates

Nothing now measures a programme colour against a scrim ground, so §1's rule — the
load-bearing one — is enforced by prose and review rather than by a gate. A selector-level
check (no `--color-program*` used as a `color` under `[data-scrim]`) would close it and is
raised separately.

---

## 4. The imagery mapping — the one thing a human still owns

Local files under `src/public/images/hero/`, read by nothing before this item:

| route | file | note |
| --- | --- | --- |
| `/` | `homepage.jpg` | 1600x1067 |
| `/democracy` | `democracy.jpg` | **1600x1600, square** |
| `/future-leadership` | `future-leadership.jpg` | 1600x1066 |
| `/transatlantic-relations-global-challenges` | **`politics-society.jpg`** | **1600x1600, square** |

Two things here are decisions, not implementation:

1. **The filenames carry the old four-topic taxonomy.** Politics & Society is the topic
   that merged into Transatlantic Relations & Global Challenges (BRIEF §8), so
   `politics-society.jpg` is the nearest asset on disk for the merged programme and is
   mapped there deliberately. It is a stand-in chosen on purpose, and it should be
   confirmed or replaced by someone who owns the art direction.
2. **Two of the three sources are square.** `object-fit: cover` into a band roughly a
   third as tall discards the top and bottom of each. `bfHeroMedia` exposes
   `--_bf-hero-media-image-position` (default `center`) so a band can be re-cropped from
   a stylesheet without re-cutting the asset — but which third of each photograph should
   survive is an art-direction call nobody has made yet.

The programme documents' own `image` field is an absolute Directus URL and is deliberately
not used: `bfMedia` hands absolute URLs to the browser untouched, so they get no
`NuxtImg` treatment and no srcset.

The four other `bfPageHeader` routes pass no image and render exactly as before. `about.jpg`
and `archives.jpg` are on disk for whoever art-directs them.

---

## 5. Scope of this record

The tokens, the components and the gate change ship in PR #274. This file exists because
two shipped comments defer to it, because §3 is a deliberate departure from a line of the
wave-1 plan and from the literal text of #264, and because §4 names a decision that
belongs to a person rather than to a commit.
