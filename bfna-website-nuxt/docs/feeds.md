# Site feeds

The site publishes two feeds of its newest insights, generated at build time:

| URL | Format |
| --- | --- |
| `https://www.bfna.org/feed.xml` | RSS 2.0 (with `atom:link rel="self"` and `dc:creator`) |
| `https://www.bfna.org/feed.json` | JSON Feed 1.1 |

Every page's `<head>` advertises both with `<link rel="alternate">`.

## What is in the feed

- **Insights only**: the `bfInsights` collection (`content/bf/insights/*.json`), the
  same rows `/insights/:slug` renders. Articles, reports, videos and infographics.
- **Only rows with a page**: the 17 homepage highlight records (`featured`,
  `retired_news`) have no detail page and are left out.
- **Only dated rows, never future-dated**: the 3 insights without a `publish_date` are
  left out rather than given an invented date.
- **Newest first, 50 items** (`FEED_ITEM_LIMIT`).
- No drafts: the content snapshot holds only published Directus records.

Each item carries:

- title (`heading`);
- canonical link `https://www.bfna.org/insights/<slug>`, also used as the
  permalink GUID;
- `pubDate` (RFC 822, UTC midnight of `publish_date`);
- a plain-text summary of at most 300 characters (`excerpt`, else `subheading`,
  else the body);
- authors as `dc:creator` (RSS) and `authors` (JSON Feed);
- categories: the program (only one of the three real programs, never a
  migration signal such as `PENDING-Q3 …`) and the format label (Article,
  Video, Infographic, Report).

Projects, programs and people are not in the feed: they carry no publish date
in the `bf*` collections.

## How it is built

- `utils/siteFeed.ts`: pure feed logic (selection, RSS and JSON rendering).
- `server/routes/feed.xml.ts`, `server/routes/feed.json.ts`: read the
  collections with `queryCollection` and render. They work in `nuxt dev` too.
- `src/nuxt.config.ts` adds `/feed.xml` and `/feed.json` to the prerender
  routes, so `nuxt generate` writes them as static files for Netlify.
- `public/_headers` sets their content types on Netlify.
- **They regenerate on every build.** Netlify runs `npm run generate`
  (`nuxt generate`) for every deploy of every branch, and the feeds are rendered
  from the committed `content/bf/**` snapshot inside that build. No separate
  command or schedule.
- **A build without them fails.** The `prerender:done` hook in
  `src/nuxt.config.ts` runs `feedOutputProblems()` over the output and throws if
  either file is missing, malformed or empty, so `nuxt generate` exits non-zero
  and Netlify keeps the previous deploy. CI's route harness
  (`scripts/check-routes.ts`, "site feeds" row) runs the same check on every PR
  into `dev`.
- Tests: `tests/agent-readiness/site-feed.test.ts` (`npm run test:agent`), which also
  runs the feed over the committed snapshot, checks well-formed XML, and
  covers the build gate.

The site URL is `SITE_URL` in `utils/agentContent.ts`, the same constant the
sitemap uses, so a deploy preview's feed still links to www.bfna.org.
