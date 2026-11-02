/**
 * `/feed.xml` — RSS 2.0 of the newest insights. Prerendered to a static file
 * (`nitro.prerender.routes` in `src/nuxt.config.ts`); see `utils/siteFeed.ts`
 * for what gets in.
 */
import { rssXml } from '../../utils/siteFeed'
import { loadFeedItems } from '../utils/feed-items'

export default defineEventHandler(async (event) => {
  const items = await loadFeedItems(event)
  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return rssXml(items)
})
