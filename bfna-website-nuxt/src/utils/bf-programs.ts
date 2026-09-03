/**
 * `PROGRAM_SLUGS` — the slugs of the three top-level programs, derived at
 * **build time** from the `bfPrograms` collection's own source files.
 *
 * Issue 48 / gh#57. This exists for exactly one caller:
 * `pages/[program].vue`'s `definePageMeta({ validate })`, which has to answer
 * "is this one-segment path a program hub?" before the page's setup — and so
 * before any composable, `queryCollection` or `useAsyncData` has run. A route
 * guard cannot await the content layer without making every navigation wait on
 * it, so the list has to be static.
 *
 * ## Why a glob rather than a literal
 *
 * The three slugs are settled (`democracy`,
 * `transatlantic-relations-global-challenges`, `future-leadership` — BRIEF §8,
 * "resolved"), so a literal array would be *correct*. It would also be a second
 * copy of the collection's contents, sitting in a file nobody edits when the
 * collection changes. The spec's own scope note asks for the list to be
 * cross-checked "against `useBfPrograms().programs` at build time, not
 * hand-typed twice"; reading the collection's source directory **is** that
 * cross-check, collapsed into the derivation itself, with no second copy left
 * to diverge from.
 *
 * `content/bf/programs/*.json` is what `content.config.ts` registers as
 * `bfPrograms` (`include: 'bf/programs/*.json'`), and each file is one
 * normaliser-emitted program document. `import.meta.glob` resolves the pattern
 * at build time: Vite rewrites it into static imports, `import: 'slug'` picks
 * the single named export off each JSON module, and nothing but three short
 * strings survives into either bundle. There is no runtime file read and no
 * runtime cost.
 *
 * ## Why its own module
 *
 * Nuxt's `nuxt:pages-macros-transform` re-emits `pages/*.vue?macro=true` as the
 * `definePageMeta` object plus **only** the top-level imports and declarations
 * that object references. An import is the simplest shape for that extraction
 * to carry; keeping the glob here also means Vite processes it in a plain
 * module, in normal plugin order, rather than inside the post-enforce macro
 * rewrite of an SFC.
 */
const programSlugModules = import.meta.glob<string>(
  '../../content/bf/programs/*.json',
  { eager: true, import: 'slug' }
)

/**
 * Every program slug, sorted, so the value is stable regardless of the order
 * the filesystem hands the glob back in.
 *
 * `readonly` because this is a registry, not a working array: the one consumer
 * asks it a membership question and nothing should ever be pushed onto it.
 */
export const PROGRAM_SLUGS: readonly string[] = Object.values(programSlugModules).sort()

/**
 * Whether `slug` names one of the three program hubs.
 *
 * Takes `unknown` and narrows, because the caller's argument is
 * `route.params.program`, typed `string | string[]` by vue-router: a type
 * predicate here is what lets `validate` stay a one-liner without a cast that
 * would lie if the param ever arrived as an array.
 */
export const isProgramSlug = (slug: unknown): slug is string =>
  typeof slug === 'string' && PROGRAM_SLUGS.includes(slug)
