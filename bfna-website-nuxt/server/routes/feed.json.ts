/**
 * `/feed.json` — JSON Feed 1.1 of the same items as `/feed.xml`.
 */
import { jsonFeed } from '../../utils/siteFeed'
import { loadFeedItems } from '../utils/feed-items'

export default defineEventHandler(async (event) => {
  const items = await loadFeedItems(event)
  setResponseHeader(event, 'content-type', 'application/feed+json; charset=utf-8')
  return jsonFeed(items)
})
