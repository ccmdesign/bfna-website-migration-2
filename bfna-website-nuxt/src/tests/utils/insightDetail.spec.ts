import { describe, it, expect } from 'vitest'
import { bodyWords, downloadAction, externalAction, insightVariant, readingMinutes } from '../../utils/insightDetail'
import { youtubeEmbedUrl, youtubeId } from '../../utils/youtube'

/**
 * `src/utils/insightDetail.ts` and `src/utils/youtube.ts` — the decisions the
 * insight detail page lays its body out from. Fixture values are real rows.
 */

const row = (over: Partial<Parameters<typeof insightVariant>[0]> = {}) => ({
  video_url: null, format: null, content: null, image: null, ...over
})

describe('youtubeId', () => {
  it('reads every spelling the data uses', () => {
    expect(youtubeId('https://youtu.be/umeJCOtggpY')).toBe('umeJCOtggpY')
    expect(youtubeId('https://www.youtube.com/watch?v=pNq3kRPcz9M&feature=youtu.be')).toBe('pNq3kRPcz9M')
    expect(youtubeId('https://youtu.be/sbp0YNJRdZw?list=PL36lfVkdVQqlMpF2-ZzhluO28KpILH8BQ')).toBe('sbp0YNJRdZw')
    expect(youtubeId('https://www.youtube.com/embed/ejvFyp0HQ0M')).toBe('ejvFyp0HQ0M')
  })

  it('refuses other hosts and malformed ids', () => {
    expect(youtubeId('https://vimeo.com/123')).toBeNull()
    expect(youtubeId('https://youtube.com.evil.example/watch?v=umeJCOtggpY')).toBeNull()
    expect(youtubeId('https://youtu.be/short')).toBeNull()
    expect(youtubeId(null)).toBeNull()
  })

  it('builds the embed from the id alone', () => {
    expect(youtubeEmbedUrl('umeJCOtggpY', { autoplay: true })).toBe('https://www.youtube-nocookie.com/embed/umeJCOtggpY?rel=0&autoplay=1')
  })
})

describe('insightVariant', () => {
  it('decides by the fields, not by `format` alone', () => {
    expect(insightVariant(row({ video_url: 'https://youtu.be/umeJCOtggpY', format: 'video' }))).toBe('video')
    // 13 rows say `video` and carry no video: podcast episodes.
    expect(insightVariant(row({ format: 'video', image: 'https://bfna.simplyas.com/assets/x' }))).toBe('summary')
    expect(insightVariant(row({ format: 'infographic', image: 'x' }))).toBe('infographic')
    expect(insightVariant(row({ format: 'report', image: 'x', content: '  ' }))).toBe('summary')
    expect(insightVariant(row({ format: 'article|report', content: 'Text.' }))).toBe('article')
  })
})

describe('actions', () => {
  it('labels a download without claiming a file type', () => {
    expect(downloadAction({ download: 'https://bfna.simplyas.com/assets/a', format: 'infographic' })?.label).toBe('Download the infographic')
    expect(downloadAction({ download: 'https://bfna.simplyas.com/assets/a', format: 'article|report' })).toMatchObject({ label: 'Download the report', external: true })
    expect(downloadAction({ download: null, format: 'report' })).toBeNull()
  })

  it('labels an external link by platform, then kicker, then host', () => {
    expect(externalAction({ external_url: 'https://open.spotify.com/episode/2fTW3YYVR8QaRvrOBMvwhN' }, 'Podcast')?.label).toBe('Listen on Spotify')
    expect(externalAction({ external_url: 'https://wisdom-of-the-crowd.simplecast.com/episodes/x' }, '')?.label).toBe('Listen to the episode')
    expect(externalAction({ external_url: 'https://www.bfnadocs.org/lithium-rising' }, 'Documentary Film')?.label).toBe('Watch the documentary')
    expect(externalAction({ external_url: 'https://bfnadocs.org/agora' }, '')?.label).toBe('Watch the documentary')
    expect(externalAction({ external_url: 'https://www.greenideasbfna.org/' }, '')?.label).toBe('Visit greenideasbfna.org')
    expect(externalAction({ external_url: 'https://www.bfna.org/future-leadership/class-of-2026/' }, '')).toMatchObject({ label: 'Continue reading', external: false })
    expect(externalAction({ external_url: 'not a url' }, '')).toBeNull()
  })
})

describe('reading time', () => {
  it('counts prose words, not link targets or image lines', () => {
    expect(bodyWords('Two words [and a link](https://example.org/a/b/c) ![alt](//x/y.png)')).toBe(5)
    expect(bodyWords(null)).toBe(0)
    expect(readingMinutes(5293)).toBe(23)
    expect(readingMinutes(10)).toBe(1)
  })
})
