import { describe, it, expect } from 'vitest'
import {
  FORMAT_LABELS,
  KIND_LABELS,
  formatLabel,
  kindLabel,
  monthYear,
  paragraphs
} from '../../utils/format'

/**
 * `src/utils/format.ts` — pure formatters ported from `useWfContent.ts`.
 *
 * These lock the ported behaviour, including the `??`/`||` edge cases that a
 * well-meaning refactor would quietly "fix". Fixture values marked "real" are
 * taken from `src/assets/wireframe-data/{insights,projects}.json`.
 */

describe('formatLabel', () => {
  it('maps every entry in FORMAT_LABELS', () => {
    expect(formatLabel('article')).toBe('Article')
    expect(formatLabel('report')).toBe('Report')
    expect(formatLabel('video')).toBe('Video')
    expect(formatLabel('infographic')).toBe('Infographic')
    expect(Object.keys(FORMAT_LABELS)).toHaveLength(4)
  })

  it('looks up only the first segment of a pipe-delimited value', () => {
    // real: 193 of 354 insights carry format 'article|report'
    expect(formatLabel('article|report')).toBe('Article')
    expect(formatLabel('report|article')).toBe('Report')
  })

  it('falls back to Article for an unmapped format', () => {
    expect(formatLabel('podcast')).toBe('Article')
    expect(formatLabel('something-new')).toBe('Article')
  })

  it('falls back to Article for null and for empty string', () => {
    // null is nullish -> defaults to 'article' -> 'Article'
    expect(formatLabel(null)).toBe('Article')
    // '' is NOT nullish: it misses the table and hits the ?? 'Article' fallback
    expect(formatLabel('')).toBe('Article')
  })
})

describe('kindLabel', () => {
  const mapped: [string, string][] = [
    ['research-initiative', 'Research Initiative'],
    ['research-documentary-project', 'Research & Documentary Project'],
    ['research-multimedia-initiative', 'Research & Multimedia Initiative'],
    ['data-visualization-project', 'Data & Visualization Project'],
    ['data-analysis-platform', 'Data & Analysis Platform'],
    ['interactive-multimedia-platform', 'Interactive Multimedia Platform'],
    ['geopolitical-forecasting-platform', 'Geopolitical Forecasting Platform'],
    ['podcast-series', 'Podcast Series'],
    ['podcast', 'Podcast'],
    ['fellowship', 'Fellowship Program']
  ]

  it.each(mapped)('maps %s', (slug, label) => {
    expect(kindLabel(slug)).toBe(label)
  })

  it('covers the whole KIND_LABELS table', () => {
    expect(Object.keys(KIND_LABELS)).toHaveLength(mapped.length)
  })

  it('returns the raw slug back when unmapped', () => {
    // real: projects.json carries kind 'cohort', which has no label entry
    expect(kindLabel('cohort')).toBe('cohort')
    expect(kindLabel('something-new')).toBe('something-new')
  })

  it('returns null for null and for empty string', () => {
    expect(kindLabel(null)).toBeNull()
    // '' is falsy, so it short-circuits to null rather than returning ''
    expect(kindLabel('')).toBeNull()
  })
})

describe('monthYear', () => {
  it('formats a real snapshot publish_date as short month + year', () => {
    // real: insights.json publish_date '2026-07-21' (mid-month: timezone-safe)
    expect(monthYear('2026-07-21')).toBe('Jul 2026')
    expect(monthYear('2026-03-17')).toBe('Mar 2026')
  })

  it('formats a full ISO timestamp', () => {
    expect(monthYear('2026-05-27T12:00:00.000Z')).toBe('May 2026')
  })

  it('always produces the "Mon YYYY" shape', () => {
    expect(monthYear('2024-11-14')).toMatch(/^[A-Z][a-z]{2} \d{4}$/)
  })

  it('returns an empty string for null and for empty string', () => {
    expect(monthYear(null)).toBe('')
    expect(monthYear('')).toBe('')
  })
})

describe('paragraphs', () => {
  it('splits body copy on blank lines', () => {
    expect(paragraphs('First para.\n\nSecond para.\n\nThird para.')).toEqual([
      'First para.',
      'Second para.',
      'Third para.'
    ])
  })

  it('returns a single entry when there is no blank line', () => {
    expect(paragraphs('Just the one paragraph.')).toEqual(['Just the one paragraph.'])
    expect(paragraphs('Line one\nline two')).toEqual(['Line one\nline two'])
  })

  it('drops empty segments but keeps whitespace-only ones', () => {
    // '\n\n\n\n' splits to ['a', '', 'b'] -> the '' is filtered out
    expect(paragraphs('a\n\n\n\nb')).toEqual(['a', 'b'])
    // an odd number of newlines leaves a whitespace segment, which is truthy
    expect(paragraphs('a\n\n\nb')).toEqual(['a', '\nb'])
    expect(paragraphs('\n\nleading')).toEqual(['leading'])
  })

  it('returns an empty array for null, undefined and empty string', () => {
    expect(paragraphs(null)).toEqual([])
    expect(paragraphs(undefined)).toEqual([])
    expect(paragraphs('')).toEqual([])
  })
})
