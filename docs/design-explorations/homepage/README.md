# BFNA homepage — five art directions (exploration, Sep 2026)

Throwaway static HTML prototypes of the **homepage only**, one per art direction. They exist to
pick a direction, not to ship. Nothing here is a Nuxt component; nothing here is a token decision.

| # | File | Working title | One line |
|---|------|---------------|----------|
| 1 | `01-swiss.html` | **Grid & Grotesk** (Swiss) | The grid is the brand. Grotesk, black on white, numbered bands, hairlines, three flat programme hues. |
| 2 | `02-bold.html` | **Loud & Clear** (Bold) | Type as image. Poster-scale headlines, saturated colour fields, hard-cropped photography. |
| 3 | `03-editorial.html` | **Journal of Record** (Editorial) | A think tank is a publisher. Serif front page, paper white, datelines, columns, double rules. |
| 4 | `04-atlantic.html` | **Great Circle** (Cartographic) | The Atlantic as the brand. Navy instrument panel, mono coordinates, one great-circle arc as the device. |
| 5 | `05-civic.html` | **Civic Modern** (Continuity) | The evolution of today's bfna.org: navy, warm ochre, the dome. Everything sharpened; the baseline to judge the other four against. |

Content is identical across all five: see `content.md`. Wireframe band order is respected
(announcement · hero · programs · featured projects · insights · footer); the wireframe is guidance
for content organisation, not a rigid layout.

## Rules that apply to all five

**Format**
- One self-contained `.html` per direction, all CSS in a `<style>` block, no frameworks, no build step, no JS unless a detail genuinely needs it (none should).
- Google Fonts via `<link>` are allowed. Images from `./assets/` only. Wordmark from `assets/bfna-wordmark.svg`.
- Designed at **1440 wide**; must hold at 1024 and collapse cleanly at 390 (simple stacking is enough — do not over-invest in mobile).
- Semantic HTML (`header/nav/main/section/article/footer`), real heading hierarchy (one `h1`, `h2` per band, `h3` per card), `alt` on every image, body-text contrast ≥ 4.5:1, visible focus styles.
- After the site footer, each page ends with a compact **direction spec strip**: working title, typefaces, palette swatches with hex, three principles. Style it as a proof-sheet (small mono type on a neutral band) so it reads as "not part of the site".

**Anti-slop list (hard rules)**
- No purple, no gradients (a flat photo scrim is fine), no blobs, no glassmorphism, no glows, no blur.
- No walls of tiny text. Body copy 17–19px. Nothing below 12px, and 12–13px only for metadata.
- No icon-in-a-circle feature grids, no "3 tiny cards with icons", no fake stat counters, no "trusted by" logo rows, no emoji, no illustration people, no 3D.
- No rounded-everything: radius 0–6px unless the direction says otherwise. No drop shadows unless the direction says otherwise.
- No stock-UI hero (headline-left, illustration-right). No JS carousels.
- Real content only, from `content.md`. Do not invent authors, numbers, awards, partners or quotes.
- Restraint: a homepage has five bands. Typography and layout do the work, not decoration.

**Verification (each page)**
Render with headless Chrome at 1440 and 390, look at the screenshots, fix overflow / unloaded fonts / broken images / hierarchy that does not read, then re-render:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,6000 --virtual-time-budget=8000 --screenshot=<out>.png "file://<abs path to html>"
```

---

## 01 · Grid & Grotesk (Swiss)

**Concept.** International Typographic Style for a nonpartisan think tank: objective, precise,
un-decorated. The homepage reads like the opening spread of an annual report or a Müller-Brockmann
poster — massive scale contrast, flush-left ragged-right, numbered sections, hairline rules, and a
grid you can feel.

**Type.** `"Helvetica Neue", "Instrument Sans", Helvetica, Arial, sans-serif` (load Instrument Sans
400/500/600/700 from Google as the cross-platform fallback). Scale: 13 / 16 / 18 / 24 / 40 / 72 /
128px. Headline weight 500, `letter-spacing -0.03em`, `line-height 0.95`. Body 18/1.5, measure ≤ 62ch.
Metadata 13px uppercase, tracking 0.06em, tabular figures.

**Colour.** White `#FFF`, ink `#0A0A0A`, hairline `#0A0A0A` at 1px. The three programme hues appear
only as flat 4–8px bars, small swatches or single words — never as backgrounds larger than a card
header. Link/interaction accent: the programme red. Nothing else.

**Grid & layout.** 12 columns, 24px gutters, 48px outer margins, max 1440. Every band opens with a
1px rule and a left-column label `01 — Programs` in metadata style. Text blocks sit on columns, not
centred. Vertical rhythm on an 8px baseline.

**Bands.**
- *Hero:* no photo or one photo as a strict rectangle in cols 8–12, grayscale (`filter: grayscale(1)`), `hero-democracy.jpg` or `hero-team.jpg`. H1 at 128px in cols 1–9, lede at 24px in cols 1–6, CTA as an underlined text link with `→` — not a pill.
- *Programs:* three columns, each: numeral `01` at 72px light, name at 40px, intro at 18px, `Explore →`. A 6px bar in the programme hue at the top of each column.
- *Projects:* 2×2, image in a strict 4:3 rectangle, grayscale by default, colour on hover; kicker row `Platform · Transatlantic Relations`, title 24px, one-line excerpt.
- *Insights:* the Transponder cover is the **only** full-colour image on the page, in a full-width row: cover in cols 1–4, headline "Transponder · Issue 7 · The Future" at 72px in cols 5–12. Highlights: 4 columns, image + title. Latest: a **table**, not cards — rows with hairlines: `date | title | programme | →`.
- *Footer:* 4 columns of links on a rule; then the wordmark set to the full grid width as a graphic.

**Devices.** Numbered bands; hairlines; `→` arrows; uppercase metadata; tabular figures.
**Do not.** No shadows, no radius, no centred text, no icons, no colour fields, no photo scrims.

---

## 02 · Loud & Clear (Bold)

**Concept.** A think tank with conviction. Type at poster scale, saturated colour fields in the three
programme hues, photography cropped hard and big. The page is a sequence of full-bleed posters that
still respects the wireframe order.

**Type.** Display: `Bricolage Grotesque` 800, optical size 96, `letter-spacing -0.04em`,
`line-height 0.9`, 96–160px for the H1, 56–80px for band headings. Body/UI: `Inter` 400/500 at 17–18px.
Headlines may break onto 2–3 lines and are allowed to overlap images.

**Colour.** Ink `#0A0A0A`, white, and three saturated fields: teal `#0B8B99`, amber `#F0A82A`
(black type on it), red `#E03A4E`. Navy `#002B44` as the one dark field. Never more than three hues
in the viewport at once; large fields alternate with white.

**Layout.** Full-bleed bands; inner container 1440 with 40px margins; tight 16px gutters.

**Bands.**
- *Hero:* split. Left 55%: amber field, H1 at 140px black, lede 20px, CTA a black rectangle button with white type. Right 45%: `hero-democracy.jpg` full height, hard-cropped. The H1 may run over the seam into the photo.
- *Programs:* three **stacked full-width rows**, each in its programme colour: name at 80px left, intro right in two-column measure, `→` at 80px far right. No cards.
- *Projects:* 2×2, image fills the cell (aspect 3:2), title at 40px set on a black chip overlapping the image bottom-left, kicker in the programme hue above it.
- *Insights:* product = navy field, Transponder magenta cover at large scale right, "Transponder #7 — The Future" at 96px white left. Highlights: 4-up images with 28px titles. Latest: a big list — titles at 32px, hairlines between, date and programme in a small mono-ish label left.
- *Footer:* black, wordmark enormous (full width) in white, link columns below in 16px.

**Imagery.** Hard crops, full colour; a programme-hue duotone (`mix-blend-mode: multiply` over a flat hue) is allowed on the programme rows only.
**Do not.** No gradients, radius > 4px, shadows, light-weight headlines, more than three hues at once, decorative shapes.

---

## 03 · Journal of Record (Editorial)

**Concept.** A think tank is a publisher. The homepage is a front page: masthead with dateline,
lead story, columns, kickers, captions. Serious and literate; distinctive through typography and
rhythm, not colour. "Modern bold" comes from scale and contrast — a 100px serif headline on paper.

**Type.** Display: `Fraunces` (variable) 700, `opsz 144`, `"SOFT" 0, "WONK" 0`, `letter-spacing -0.02em`,
`line-height 0.95`, 88–112px for the H1, 40–48px for band headings, 24–28px for card titles. Ledes in
Fraunces italic 400 at 24px. Body/UI: `Inter` 400/500 at 17px, kickers 12–13px uppercase small tracking.

**Colour.** Paper `#F6F2EA`, ink `#141210`, rules in ink at 1px and a **double rule** (3px + 1px) for
the masthead and footer. One accent for links/kickers: muted red `#B5333F`. Programme hues appear only
as kicker text colour. Navy `#003C5C` only for the footer.

**Layout.** Max 1320, 12 columns, 32px gutters. Vertical hairlines between columns where text sits
side by side. A masthead row: wordmark left, dateline centre (`Washington, D.C. · Friday, 4 September 2026`),
Search right, nav on a second rule below.

**Bands.**
- *Hero (front page):* H1 spanning 8 cols at 104px; lede italic 24px in 5 cols with a **single** drop cap; CTA an underlined text link. Right rail (4 cols, hairline left): kicker "From the Foundation" with the announcement item and 2 of the highlights as text-only entries with datelines.
- *Programs:* three columns separated by vertical hairlines, each: kicker `Program 01` in its hue, name in Fraunces 44px, intro 17px, `Read more →`.
- *Projects:* 2×2 with a 1px rule above each; image 3:2 with an italic 13px caption beneath (e.g. "The Transatlantic Barometer tracks 31 actors."), title Fraunces 28px, kicker in the programme hue.
- *Insights:* product = magazine promo across the grid: cover left (4 cols) with a thin ink frame; "Transponder, Issue 7 — The Future" 64px, description, `Read the issue ↗`. Highlights: 4 columns, image + kicker + 22px title. Latest: two columns of three, each entry: small-caps date · kicker, 26px title, one-line excerpt, hairline between entries.
- *Footer:* double rule, wordmark, four link columns, colophon line.

**Devices.** Double rules; kickers; datelines; captions; one drop cap; folio-style band numbers in the margin.
**Do not.** No cards with shadows, no colour fields except the navy footer, no icons, no second accent, no photo scrims.

---

## 04 · Great Circle (Cartographic)

**Concept.** The Atlantic is the brand. BFNA's platforms (Barometer, Periscope, RANGE) are
instruments; the homepage is an instrument panel: coordinates, meridians, and **one great-circle arc**
from Washington to Europe as the recurring device. Dark-first, precise, lines only.

**Type.** `IBM Plex Sans` 400/500/600 for display and body (H1 at 88px, 600, tight), `IBM Plex Mono`
400/500 at 12–13px uppercase for coordinates, indices and metadata. Body 17px.

**Colour.** Navy surface `#00243A`, ivory type `#F2EEE6`, hairline `rgba(242,238,230,.18)`. Data colours:
teal `#2AA5B3`, amber `#EEAC49`, red `#E5566A`. Light bands use ivory `#F2EEE6` with ink `#0B1F2E`
and the light-surface hues (teal `#116F7E`, ochre `#A3680F`, red `#CF4457`). Rhythm: hero + programs
dark → projects + insights light → footer dark.

**Layout.** Max 1400, 12 columns, 24px gutters. A faint meridian grid on dark bands: 1px vertical
lines every column at 6–8% opacity — subtle, structural, not a "dot grid".

**Bands.**
- *Hero:* navy. Left: mono index `BFNA · WASHINGTON, D.C. · 38.90°N 77.04°W`, H1 88px, lede 20px, CTA an outlined rectangle. Right (cols 7–12): one SVG — a quadratic great-circle arc from a point labelled `WASHINGTON, D.C.` to a point labelled `BRUSSELS 50.85°N 4.35°E`, with a third small tick `GÜTERSLOH`; 1.5px ivory stroke, small hollow circle markers, mono labels. No globe, no map fill — the arc alone.
- *Programs:* three "panels" on the navy, hairline-framed, each: mono index `01 / DEMOCRACY`, a 2px tick in the data colour, name 36px, intro 17px, `Open →`. Optional: image as a 3:2 rectangle at reduced opacity behind a hairline frame.
- *Projects (ivory):* 2×2; platform screenshots in a 1px hairline frame with a mono kicker above (`PLATFORM · 31 ACTORS`, `PLATFORM · MULTIMEDIA`, `PODCAST · VIDEO`, `FELLOWSHIP · 5 MONTHS`), title 28px 600, excerpt.
- *Insights (ivory):* product = a full-width band: cover with hairline frame left, `TRANSPONDER · ISSUE 07` mono kicker, "The Future" at 72px, `Read the issue ↗`. Highlights: 4-up with images and mono dates. Latest: a **ticker table**: mono date | title 22px | programme dot in data colour | `→`.
- *Footer:* navy, small arc icon repeated as a section marker, four link columns, mono legal line.

**Devices.** The arc (hero-scale once, tiny as a marker elsewhere); mono coordinates; hairline frames; data-colour dots.
**Do not.** No glows, gradients, neon, blur, dot-grid "AI dashboard" look, 3D globe, radar sweeps, fake numbers (only 31 actors, issue 07, 5 months are real).

---

## 05 · Civic Modern (Continuity)

**Concept.** The evolution of today's bfna.org, not a rebrand: keep what people recognise (navy, warm
ochre, architecture photography, the dome) and sharpen everything — bigger type, stricter grid, calmer
cards, more air. This is the "could ship" baseline the other four are judged against.

**Type.** Display: `Source Serif 4` 600, `opsz 60`, `letter-spacing -0.015em`, H1 at 80px, band
headings 48px, card titles 24px. Body/UI: `Source Sans 3` 400/600 at 18px; kickers 13px uppercase 600.

**Colour.** Navy `#003C5C` primary; amber `#EEAC49` for the announcement bar and primary CTA (black
type on amber), ochre `#A3680F` for text-size accents; ivory `#F7F5F0` band backgrounds; white cards
with a 1px `#E4E0D8` border, radius 4px, **no shadow**. Programme colour as a 4px tab on the left edge
of programme cards and as kicker colour: teal `#116F7E`, ochre `#A3680F`, red `#CF4457`.

**Layout.** Max 1280, 12 columns, 32px gutters, 96–128px band padding. Sticky white header with the
wordmark and nav; amber announcement bar above it.

**Bands.**
- *Hero:* full-bleed `hero-homepage.jpg` (the dome), 80vh, a flat navy scrim at 70% on the left half only, H1 white 80px serif, lede 20px white, CTA amber rectangle.
- *Programs:* three cards on ivory: image 3:2 top, name 32px serif, intro 18px, `Explore →`; colour tab left.
- *Projects:* 2×2 white cards on white band: image 3:2, kicker in programme hue, title 24px, excerpt, external mark where relevant.
- *Insights:* product = navy band, Transponder cover right, "Transponder Magazine — Issue 7: The Future" 48px serif white, description, amber CTA. Highlights: 4 cards with images. Latest: 3×2 text cards, kicker + 24px serif title + excerpt + date.
- *Footer:* navy, ivory type, wordmark, four columns, legal line.

**Devices.** Colour tabs; kickers; arrow links; the dome.
**Do not.** No shadow on everything, no orange gradient, no rounded-2xl, no icon grid, no centred hero.
