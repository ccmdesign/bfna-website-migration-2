/**
 * `programSlugForName` — the programme slug for a programme **name**, derived
 * at build time from the `bfPrograms` collection's own source files.
 *
 * Exists for the card family's programme chip (Sep 2026). An insight row
 * stores its programme as the display name (`"Democracy"`), and `bfChip`'s
 * `tone="program"` needs the slug to scope the colour tokens. `bfCardInsight`
 * used to answer that with a hand-typed label map inside the component — a
 * second copy of the collection that nobody edits when the collection
 * changes, and string-matching labels in a presentational component, which
 * the card spec forbids.
 *
 * The same construction as `utils/bf-programs.ts`, and for the same reasons:
 * `import.meta.glob` over `content/bf/programs/*.json` (what `content.config.ts`
 * registers as `bfPrograms`) is resolved by Vite into static imports, so only
 * three names and three slugs reach the bundle and nothing is read at runtime.
 * Two globs, one field each, keyed by the same file path — never the whole
 * document, whose `intro` would ship for no reason.
 *
 * A name that is not one of the three — the 52 migration signals such as
 * `PENDING-Q3 (Digital World retired)`, or a project name — returns
 * `undefined`, and the chip falls back to the neutral tone. That is the
 * D-50.2 guard the article page applies: the attribute is a programme slug or
 * it is absent.
 */
const slugs = import.meta.glob<string>(
  '../../content/bf/programs/*.json',
  { eager: true, import: 'slug' }
)

const names = import.meta.glob<string>(
  '../../content/bf/programs/*.json',
  { eager: true, import: 'name' }
)

const SLUG_BY_NAME: ReadonlyMap<string, string> = new Map(
  Object.keys(slugs).map(path => [names[path] as string, slugs[path] as string])
)

export const programSlugForName = (name: string | null | undefined): string | undefined =>
  name ? SLUG_BY_NAME.get(name) : undefined

/**
 * `programChipLabel` — the one label a programme **chip** carries, wherever
 * the site draws one: the insight cards, the Program facets on `/insights`
 * and `/search`, the meta rows of the insight and project pages, and the
 * "start from one of our programs" chips on `/search` and the not-found page.
 *
 * It used to be two answers. The cards and the `/insights` facet shortened
 * the 43-character "Transatlantic Relations & Global Challenges" to
 * `Transatlantic Rel.`, each with its own copy of the rule, while `/search`
 * and both detail pages set the full name — so one programme wore two chip
 * labels, sometimes on one screen. The short form is the one kept: it is the
 * frozen home page's (D-47.2), and a chip is a one-line control that sits
 * beside a format chip in a 300px card, where the full name wraps the pill
 * onto two lines. Headings, crumbs and prose keep the full name.
 *
 * A page-level relabelling with no field behind it, because `bfPrograms`
 * declares no short name. A migration signal (`RE-TAG …`, `PENDING …`) is
 * shown as `Re-tag`, never verbatim; any other value is returned as given.
 */
export const programChipLabel = (name: string | null | undefined): string => {
  if (!name) return ''
  if (name === 'Transatlantic Relations & Global Challenges') return 'Transatlantic Rel.'
  if (name.startsWith('RE-TAG') || name.startsWith('PENDING')) return 'Re-tag'
  return name
}
