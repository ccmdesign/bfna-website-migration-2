/**
 * Pure display formatters for the `bf-*` layer.
 *
 * Ported verbatim from `src/composables/useWfContent.ts` (`FORMAT_LABELS`
 * :195-200, `KIND_LABELS` :202-213, and the lookups at :274, :275, :283,
 * :284-285). Same names, same signatures, same behaviour — including the
 * edge cases below. The wireframe composable is frozen (D2/DoD-4) and is
 * copied from, never edited; the duplication ends when the wireframe layer
 * retires.
 *
 * No Vue imports, no Nuxt runtime, no date library — this module is a plain
 * TypeScript unit and must stay that way.
 *
 * `plain()` (HTML strip / entity decode) is deliberately NOT here. That work
 * moved into the build-time normaliser, and no `bf-*` file may re-derive it.
 */

/** Insight `format` slug → display label. */
export const FORMAT_LABELS: Record<string, string> = {
  article: 'Article',
  report: 'Report',
  video: 'Video',
  infographic: 'Infographic'
}

/** Project `kind` slug → display label. */
export const KIND_LABELS: Record<string, string> = {
  'research-initiative': 'Research Initiative',
  'research-documentary-project': 'Research & Documentary Project',
  'research-multimedia-initiative': 'Research & Multimedia Initiative',
  'data-visualization-project': 'Data & Visualization Project',
  'data-analysis-platform': 'Data & Analysis Platform',
  'interactive-multimedia-platform': 'Interactive Multimedia Platform',
  'geopolitical-forecasting-platform': 'Geopolitical Forecasting Platform',
  'podcast-series': 'Podcast Series',
  'podcast': 'Podcast',
  'fellowship': 'Fellowship Program'
}

/**
 * Display label for an insight `format`.
 *
 * Snapshot values are pipe-delimited multi-values (`'article|report'`), so only
 * the first segment is looked up. Anything unmapped — including `''`, which is
 * not nullish and therefore skips the `'article'` default — falls back to
 * `'Article'`.
 *
 * The `?? ''` on the split result is a type-only guard for
 * `noUncheckedIndexedAccess`: `String.prototype.split` always returns at least
 * one element, so index 0 is never actually `undefined` and that fallback can
 * never fire. (`useWfContent.ts:274` omits it and carries a TS2538 for it.)
 */
export function formatLabel(f: string | null): string {
  return FORMAT_LABELS[(f ?? 'article').split('|')[0] ?? ''] ?? 'Article'
}

/**
 * Display label for a project `kind`.
 *
 * Returns the raw slug back when unmapped, and `null` for any falsy input
 * (`null` and `''` alike).
 */
export function kindLabel(k: string | null): string | null {
  return k ? KIND_LABELS[k] ?? k : null
}

/**
 * Split body copy into paragraphs on blank lines. Empty segments are dropped;
 * nullish or empty input yields `[]`.
 */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split('\n\n').filter(Boolean)
}

/**
 * Short month + year, e.g. `'Mar 2024'`. Empty string for falsy input.
 *
 * Native `Date`/`toLocaleDateString` by design — no date library. Date-only
 * strings parse as UTC midnight and render in the runtime's local zone, so the
 * month can shift for values at a month boundary. That is the existing
 * behaviour and is preserved deliberately.
 */
export function monthYear(date: string | null): string {
  return date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''
}
