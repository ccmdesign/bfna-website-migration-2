/**
 * `useProgramTheme` — puts the programme colour scope on the document.
 *
 * gh#252. #251 shipped three colour tiers per programme in
 * `src/public/css/tokens/semantic-colors.css`, keyed to `[data-program]`, with a
 * neutral `:root` default and no consumer. This is the half that makes the
 * attribute appear: a page that knows which programme it belongs to calls this
 * once, and everything below the attribute resolves that programme's
 * `--color-program`, `--color-program-on-light` and `--color-program-on-dark`.
 *
 * ```ts
 * useProgramTheme(program?.slug)
 * ```
 *
 * ## Why `<html>` and not a wrapper element
 *
 * The three calling pages render **no wrapper of their own**, and that is a
 * convention with a reason written at the top of each of their templates:
 * `layouts/bf-default.vue`'s `<main class="stack" data-gap="xl">` is the page's
 * own stack, so a `<div>` around the bands collapses them into a single stack
 * child and loses the rhythm between them. So the attribute cannot go on a new
 * element.
 *
 * The two placements that remain are not equivalent:
 *
 * - **The outermost `bfSection` / `bfPageHeader`.** A custom property inherits
 *   to that band's descendants and to nothing else, so `/democracy` would paint
 *   its header teal and leave the Projects and Insights bands below it on the
 *   neutral `:root` navy. Three bands, two colours — not the mechanism.
 * - **`<html>`, through `useHead`.** One attribute, above the landmark,
 *   recolouring everything below it. This is what production actually did and
 *   what `semantic-colors.css` describes at its point of declaration: "one
 *   custom property, set high in the tree, recolours every component below it".
 *
 * Hence `htmlAttrs`. Note the consequence for later consumers (#253 onward):
 * the scope spans the nav and the footer, not only `<main>`, so a token
 * consumed in site chrome recolours per route. That is production's behaviour;
 * it is a choice to make deliberately at each consumer, not a surprise.
 *
 * `<body>` would also work and would avoid the specificity tie below, but it
 * disagrees with what the token file says it expects, and it would make the
 * `:root` default a scope nothing can ever resolve from rather than a real
 * fallback.
 *
 * ## The specificity tie, and why it is already safe
 *
 * `:root` and `[data-program="democracy"]` have **equal** specificity, and on
 * `<html>` both match the same element — so source order decides. It is
 * correct today and deliberately so: `semantic-colors.css` declares the neutral
 * `:root` block *first*, immediately above the three programme blocks, with a
 * comment saying it is ordered that way precisely for the case where the
 * attribute lands on `<html>`. Both sit in `@layer tokens`, so no layer
 * ordering intervenes. A later file re-declaring `--hsl-program` at `:root`
 * after this block would silently win; nothing does.
 *
 * ## The guard
 *
 * `slug` is checked against `isProgramSlug`, the build-time glob over
 * `content/bf/programs/*.json` that `pages/[program].vue`'s route `validate`
 * already uses. The content collection is the only source of the three slugs.
 *
 * That matters most on `/insights/:slug`, where 52 of the 354 rows store a
 * `program` that is not a programme at all but a migration signal addressed to
 * the client — `PENDING-Q3 (Digital World retired)`, `RE-TAG (was fake
 * category: Podcasts)`, `RE-TAG (was fake category: Archives)` (BF-218 F3). The
 * pages resolve those against `bfPrograms` before they reach this function, so
 * the guard is a second line rather than the only one; it is here so the
 * invariant — *the attribute is a programme slug or it is absent* — belongs to
 * the function that writes the attribute.
 *
 * It is deliberately **not** keyed off `src/types/directus.ts`'s `theme` enum,
 * which still carries the old four-topic taxonomy (`politics-society`,
 * `digital-world`, …) from before the collapse to three Programs.
 *
 * ## Absence is written out, not delegated
 *
 * When there is no programme the `htmlAttrs` key is omitted entirely rather
 * than set to `undefined` and left to unhead's normalisation to drop. The
 * fallback to the neutral `:root` default is a stated acceptance criterion for
 * `/about` and `/search`, and it should not rest on a framework's treatment of
 * an undefined prop.
 *
 * The removal on the way *out* of a programme route is unhead's, and cannot be
 * written out here: the entry is disposed when the page unmounts and the
 * attribute goes with it. Verified in the browser rather than assumed — a
 * programme route to `/about` and back is the one behaviour a file review
 * cannot see.
 */
import { isProgramSlug } from '~/utils/bf-programs'

export const useProgramTheme = (slug?: string | null): void => {
  useHead(isProgramSlug(slug) ? { htmlAttrs: { 'data-program': slug } } : {})
}
