import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { feedItems, type FeedInsight, type FeedItem } from '../../utils/siteFeed'

/** The feed's items, read from the same collections `/insights/:slug` reads. */
export async function loadFeedItems(event: H3Event): Promise<FeedItem[]> {
  const [insights, programs] = await Promise.all([
    queryCollection(event, 'bfInsights').all(),
    queryCollection(event, 'bfPrograms').all()
  ])
  return feedItems(insights as FeedInsight[], new Set(programs.map(program => program.name)))
}
