import { describe, it, expect } from 'vitest'
import { displayHeading, splitHeadingKicker, kickerHidesFormatChip } from '../../utils/headingKicker'

/**
 * `src/utils/headingKicker.ts`. Fixtures are real `bfInsights` headings.
 */

describe('splitHeadingKicker — format labels', () => {
  it('splits a format prefix and names its format slug', () => {
    expect(splitHeadingKicker('Infographic: AI Research and Development in the U.S., EU and China')).toEqual({
      kicker: 'Infographic',
      title: 'AI Research and Development in the U.S., EU and China',
      kickerIsFormat: true,
      formatType: 'infographic'
    })
  })

  it('drops a leading "New " and title-cases an all-caps prefix', () => {
    expect(splitHeadingKicker('New Infographic | Strength in Numbers')).toMatchObject({ kicker: 'Infographic', title: 'Strength in Numbers' })
    expect(splitHeadingKicker('NEW PODCAST: The Transponder - Astropolitics')).toMatchObject({ kicker: 'Podcast', title: 'The Transponder - Astropolitics', kickerIsFormat: true })
    expect(splitHeadingKicker('New Documentary| Motown South: Organized Labor in the Battery Belt')).toMatchObject({ kicker: 'Documentary', title: 'Motown South: Organized Labor in the Battery Belt' })
  })

  it('keeps the pipe rule the featured card relied on', () => {
    expect(splitHeadingKicker('Latest Issue | Transponder: The Future')).toMatchObject({ kicker: 'Latest Issue', title: 'Transponder: The Future' })
    expect(splitHeadingKicker('Transatlantic Barometer  | New Indicator: Start Ups')).toMatchObject({ kicker: 'Transatlantic Barometer', title: 'New Indicator: Start Ups', kickerIsFormat: false })
    expect(splitHeadingKicker('New Site | Indo-Pacific Nexus')).toMatchObject({ kicker: 'New Site', title: 'Indo-Pacific Nexus' })
  })

  it('gives non-FORMAT_LABELS formats no formatType', () => {
    expect(splitHeadingKicker('Graphic Images: Autocrats and the Use of Power').formatType).toBeUndefined()
  })
})

describe('splitHeadingKicker — series', () => {
  it('splits named series', () => {
    expect(splitHeadingKicker('Hidden Layers: EU AI Act')).toEqual({ kicker: 'Hidden Layers', title: 'EU AI Act', kickerIsFormat: false })
    expect(splitHeadingKicker('TTIP Negotiations: A Summary of Round 11')).toMatchObject({ kicker: 'TTIP Negotiations' })
  })

  it('matches numbered episodes, seasons and issues by pattern', () => {
    expect(splitHeadingKicker('Season 2, Episode 3: Federica Mogherini on Negotiating the Iran Nuclear Deal')).toMatchObject({ kicker: 'Season 2, Episode 3', title: 'Federica Mogherini on Negotiating the Iran Nuclear Deal' })
    expect(splitHeadingKicker('Episode 4: Change Beyond Climate')).toMatchObject({ kicker: 'Episode 4' })
    expect(splitHeadingKicker('Transponder Issue #7: The Future')).toMatchObject({ kicker: 'Transponder Issue #7', title: 'The Future' })
    expect(splitHeadingKicker('SEASON 1, EPISODE 1: X')).toMatchObject({ kicker: 'Season 1, Episode 1' })
  })
})

describe('splitHeadingKicker — no split', () => {
  it.each([
    'A Developing Dilemma: United States, Europe, China, and the Choices for the Global South',
    'Lithium Rising: The Race for Critical Minerals',
    'TTIP: California’s Gateway to Europe',
    'Migration: Aachen',
    'Greek Debt Crisis: Will the Last Domino Stand?',
    '12 Days of Christmas in Europe',
    'Infographic',
    'Infographic: '
  ])('keeps %j whole', heading => {
    expect(splitHeadingKicker(heading)).toEqual({ kicker: '', title: heading.trim(), kickerIsFormat: false })
  })

  it('treats null and blank as an empty title', () => {
    expect(splitHeadingKicker(null)).toEqual({ kicker: '', title: '', kickerIsFormat: false })
    expect(splitHeadingKicker('   ')).toEqual({ kicker: '', title: '', kickerIsFormat: false })
  })
})

describe('kickerHidesFormatChip', () => {
  it('hides the chip only when the kicker restates the format', () => {
    const infographic = splitHeadingKicker('Infographic: Cybersecurity')
    expect(kickerHidesFormatChip(infographic, 'infographic')).toBe(true)
    expect(kickerHidesFormatChip(infographic, 'article|report')).toBe(false)
  })

  it('never hides for a series or a format with no chip equivalent', () => {
    expect(kickerHidesFormatChip(splitHeadingKicker('Hidden Layers: X'), 'report')).toBe(false)
    expect(kickerHidesFormatChip(splitHeadingKicker('Podcast | The Transponder'), null)).toBe(false)
  })
})

describe('displayHeading — a heading that ends on a colon', () => {
  it('joins a colon-ended heading to its subheading', () => {
    expect(displayHeading('Pianissimo:', 'Brussels’ Silence on Italy’s Democratic Decline'))
      .toBe('Pianissimo: Brussels’ Silence on Italy’s Democratic Decline')
    expect(displayHeading('  Seven Months to Midnight: ', ' The CDU’s Governance Gamble in Saxony-Anhalt '))
      .toBe('Seven Months to Midnight: The CDU’s Governance Gamble in Saxony-Anhalt')
  })

  it('leaves every other heading as it is, trimmed', () => {
    expect(displayHeading('Lithium Rising', 'The Race for Critical Minerals')).toBe('Lithium Rising')
    expect(displayHeading(' The Nuclear Option ')).toBe('The Nuclear Option')
    expect(displayHeading('Pianissimo:', '   ')).toBe('Pianissimo:')
    expect(displayHeading(null, 'Orphan subheading')).toBe('')
  })
})
