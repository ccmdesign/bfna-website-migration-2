<script setup lang="ts">
/**
 * `bfProse` — the body-string renderer.
 *
 * Ports `components/wireframe/wfProse.vue` (frozen, D2 — read, never edited),
 * whose job is to take one body field and render it as block-level text. The
 * port kept wfProse's parser character for character, and that parser kept
 * only headings, `-` lists and paragraphs: every link lost its URL, inline
 * images printed as `!caption` or as a raw URL, blockquotes printed their
 * `>`. wfProse's own comment said where the fix belonged ("swap for a real
 * renderer when production styling needs bold/links preserved"), and the
 * refined article page is that moment. The parser now lives in
 * `utils/proseBlocks.ts`; its header has the measurements and the rules.
 *
 * ## What it renders
 *
 * Paragraphs with emphasis, code, links and footnote references; headings
 * `h2`–`h6`; bulleted and numbered lists; blockquotes; rules; figures, with a
 * caption when the body writes one; YouTube embeds; pipe tables; and a Notes
 * list for footnotes, each note linked back to where it is cited. Every block
 * is styled in `public/css/components/prose.css`, not here — see "No scoped
 * styles" below.
 *
 * ## Still no `v-html`, and now an allow-list as well
 *
 * The parser returns plain data and this component renders it through the
 * template and `h()`, so every string from the body is text interpolation or
 * an attribute binding — no markup from the body is ever inserted as markup.
 * That was the original construction's safety argument and it is unchanged.
 *
 * What changed is that a body can now put a value in `href` and `src`, which
 * Vue does not police. So links, images and embeds pass
 * `safeHref` / `safeImageSrc` / `safeEmbedId` first: `http(s)`, `mailto:`,
 * `tel:`, root-relative and `#` targets only, images over `https` only, and an
 * embed only when it is a YouTube video, kept as its id alone — every URL
 * this component writes for it is built from that id by `utils/youtube.ts`.
 * A `javascript:` link renders its text and no anchor.
 *
 * Links that leave the site take the system's own treatment: `data-external`
 * (the `↗` of `external-link.css`) and `newTabAttrs` (`utils/link.ts`), the
 * same pair `bfButton`'s anchor branch spreads.
 *
 * ## Heading ranks start at 2, and cannot start lower
 *
 * Nothing here emits an `h1` — the page's single rank-1 heading is
 * `bfPageHeader`'s or `bfHero`'s (BRIEF §5 rule 9) — and a legacy body's `<h1>`
 * is flattened by the parser's tag strip before the line loop sees it. The
 * authored ranks are also compacted and clamped, so a body whose first
 * heading is `###` opens on `h2` and never skips a rank (the 22 pages
 * `scripts/check-routes.ts` records in `HEADING_SKIP_KNOWN`).
 *
 * ## A video loads nothing from YouTube until the reader presses play
 *
 * The one legacy `<iframe>` (`/insights/disrupting-democracy`) renders the
 * way the insight page's own video does (`pages/insights/[slug].vue`): a
 * poster that is a plain link to the video on YouTube — so it works before
 * hydration and without JavaScript — holding YouTube's `hq` still (lazy, so
 * it costs nothing until it is scrolled near; upgraded to the sharp `maxres`
 * one once it has loaded, when that exists) and a "Play video" pill. A plain
 * click swaps in the privacy-enhanced player, autoplaying because that is
 * what the press asked for, and moves focus into it, so a keyboard user is
 * not dropped to the top of the page when the link they pressed is
 * replaced. A modified click (new tab, new window) is left to the browser.
 *
 * The link and the player are named after what the video shows — the
 * `label` the parser takes from the text around it — never a generic "Video
 * (YouTube)". The styles mirror `article.css`'s `.bf-article-video__*` in
 * `prose.css`, because this component renders on project pages too.
 *
 * ## Images that no longer exist
 *
 * 31 of the 113 inline images point at Contentful assets that now answer
 * 404. A figure whose image fails is hidden (`v-show`) once the failure is
 * known — from the `error` event, or, for one that failed before hydration,
 * from `complete && naturalWidth === 0` on mount — rather than leaving a
 * broken-image glyph and its caption in the column. The server render always
 * includes the figure, so hydration never mismatches.
 *
 * ## One instance per page
 *
 * Footnote anchors are `#bf-fn-<id>` / `#bf-fnref-<id>` and the Notes heading
 * is `#bf-prose-notes`. Every call site renders a single body, so the ids are
 * unique; a page that ever renders two bodies with notes would need a prefix
 * prop first.
 *
 * ## No `data-measure`, and no scoped styles
 *
 * The line-length cap is the **caller's**: `bfSection`'s `measure`, narrowed
 * further on the article by `article.css`. A cap declared here would fight
 * that one.
 *
 * The styles are in `public/css/components/prose.css` because most of what
 * this component renders is built by `h()` inside a local functional
 * component, which carries no scope id — a scoped rule could not reach an
 * `<a>` or an `<em>`. One stylesheet for every block keeps the rules in one
 * place and in one specificity regime.
 *
 * Presentational-only (D8): one prop in, nothing out, no collection, no store.
 */
import { h, type FunctionalComponent, type VNodeChild } from 'vue'
import type { ProseProps } from '~/types/bf-contracts'
import { newTabAttrs } from '~/utils/link'
import { parseProse, type ProseInline } from '~/utils/proseBlocks'
import { youtubeEmbedUrl, youtubePoster, youtubeWatchUrl } from '~/utils/youtube'

defineOptions({ name: 'BfProse' })

/*
 * Fallthrough is left on. The template has a single root, so `$attrs` has one
 * unambiguous destination and `class` merges with `stack` rather than replacing
 * it (BRIEF §5 rule 4). Unlike `bfSection`, this component declares no
 * prop-shaped surface for a caller to mistype, so there is nothing an allowlist
 * would protect.
 */
const props = defineProps<ProseProps>()

/** The body, parsed — deterministic, so the server and the client agree. */
const blocks = computed(() => parseProse(props.content))

/** An authored footnote id, reduced to what an `id` attribute should hold. */
const noteId = (id: string) => id.replace(/[^\w-]/g, '-')

/**
 * Inline nodes → vnodes. Text is returned as a string child, which Vue
 * escapes; every element is one of six known tags.
 */
const renderInline = (nodes: ProseInline[]): VNodeChild[] => nodes.map((n): VNodeChild => {
  switch (n.t) {
    case 'text': return n.v
    case 'code': return h('code', n.v)
    case 'em': return h('em', renderInline(n.c))
    case 'strong': return h('strong', renderInline(n.c))
    case 'link': return h('a', {
      'href': n.href,
      'data-external': n.external || undefined,
      ...newTabAttrs(n.href)
    }, renderInline(n.c))
    case 'fnref': return h('sup', { class: 'bf-prose__ref' }, n.linked
      ? h('a', {
          'href': `#bf-fn-${noteId(n.id)}`,
          'id': n.first ? `bf-fnref-${noteId(n.id)}` : undefined,
          'aria-label': `Note ${n.n}`
        }, String(n.n))
      : String(n.n))
  }
})

/** The inline renderer as a component, so the template can place it in any block. */
const ProseText: FunctionalComponent<{ nodes: ProseInline[] }> = p => renderInline(p.nodes)
ProseText.props = ['nodes']

const root = ref<HTMLElement | null>(null)

/** Figure `src`s whose image failed to load. Client-only state; empty on the server. */
const broken = reactive(new Set<string>())

onMounted(() => {
  root.value?.querySelectorAll<HTMLImageElement>('.bf-prose__figure img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) broken.add(img.getAttribute('src') ?? '')
  })
})

/* ---------------------------------------------------------------- video */

/** Indices of the embeds the reader has pressed play on. A new body starts with none. */
const playing = reactive(new Set<number>())
watch(() => props.content, () => playing.clear())

/**
 * Poster stills by video id: `hq` until it has loaded, then `maxres` when
 * YouTube has one — for some videos it answers with a 120px grey
 * placeholder instead, which is why the probe checks the width first.
 */
const posters = reactive(new Map<string, string>())
const probed = new Set<string>()

function upgradePoster(id: string) {
  if (probed.has(id)) return
  probed.add(id)
  const probe = new Image()
  probe.onload = () => {
    if (probe.naturalWidth > 120) posters.set(id, probe.src)
  }
  probe.src = youtubePoster(id, 'maxres')
}

/* A poster that loaded before hydration fired its `load` with no listener attached. */
onMounted(() => {
  blocks.value.forEach((b, i) => {
    if (b.tag !== 'embed') return
    const img = root.value?.querySelector<HTMLImageElement>(`[data-embed="${i}"] img`)
    if (img?.complete && img.naturalWidth > 0) upgradePoster(b.id)
  })
})

/** Play in place; see "A video loads nothing from YouTube" above. */
async function play(event: MouseEvent, i: number) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  playing.add(i)
  await nextTick()
  root.value?.querySelector<HTMLIFrameElement>(`[data-embed="${i}"] iframe`)?.focus()
}
</script>

<template>
  <!--
    One root, `.stack[data-gap="s"]` — the wf source's own. The rhythm between
    blocks starts from the composition layer's gap and is refined per block in
    `prose.css`.
  -->
  <div ref="root" class="bf-prose | stack" data-gap="s">
    <template v-for="(b, i) in blocks" :key="i">
      <p v-if="b.tag === 'p'" :data-subhead="b.solo || undefined"><ProseText :nodes="b.c" /></p>

      <ul v-else-if="b.tag === 'ul'">
        <li v-for="(item, j) in b.items" :key="j"><ProseText :nodes="item" /></li>
      </ul>

      <ol v-else-if="b.tag === 'ol'" :start="b.start === 1 ? undefined : b.start">
        <li v-for="(item, j) in b.items" :key="j"><ProseText :nodes="item" /></li>
      </ol>

      <blockquote v-else-if="b.tag === 'blockquote'">
        <p v-for="(para, j) in b.paras" :key="j"><ProseText :nodes="para" /></p>
      </blockquote>

      <hr v-else-if="b.tag === 'hr'">

      <!--
        `alt` is the body's own string, passed through as authored (gh#222: the
        text is content, never invented). Many are file names; that is a
        content fix, and the same one gh#234 carries for lead images.
      -->
      <figure v-else-if="b.tag === 'figure'" v-show="!broken.has(b.src)" class="bf-prose__figure">
        <img :src="b.src" :alt="b.alt" loading="lazy" decoding="async" @error="broken.add(b.src)">
        <figcaption v-if="b.caption"><ProseText :nodes="b.caption" /></figcaption>
      </figure>

      <!--
        A video: the poster link until the press, then the privacy-enhanced
        player (the docblock's "A video loads nothing…"). The poster is
        decorative (`alt=""`); the link's name starts with the words it shows,
        "Play video". "Watch on YouTube" is for the reader who would rather,
        with the site's off-site marker, as on the insight page.
      -->
      <figure v-else-if="b.tag === 'embed'" class="bf-prose__embed" :data-embed="i">
        <div class="bf-prose__embed-frame">
          <iframe
            v-if="playing.has(i)"
            :src="youtubeEmbedUrl(b.id, { autoplay: true })"
            :title="`Video: ${b.label}`"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          />
          <a
            v-else
            class="bf-prose__embed-facade"
            :href="youtubeWatchUrl(b.id)"
            :aria-label="`Play video: ${b.label}`"
            @click="play($event, i)"
          >
            <img
              class="bf-prose__embed-poster"
              :src="posters.get(b.id) ?? youtubePoster(b.id)"
              alt=""
              loading="lazy"
              decoding="async"
              @load="upgradePoster(b.id)"
            >
            <span class="bf-prose__embed-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="12" /><path d="M9.75 7.5v9l7-4.5z" /></svg>
              Play video
            </span>
          </a>
        </div>
        <p class="bf-prose__embed-source">
          <a :href="youtubeWatchUrl(b.id)" data-external v-bind="newTabAttrs(youtubeWatchUrl(b.id))">Watch on YouTube</a>
        </p>
      </figure>

      <!--
        A pipe table. The wrapper scrolls sideways on a narrow screen instead
        of widening the page, so it is focusable and named — a keyboard user
        must be able to reach what is off to the side. The name is the
        table's own (`label`: its lead-in or its header row, numbered when
        the body has several), so two tables are two distinct regions.
      -->
      <div v-else-if="b.tag === 'table'" class="bf-prose__table" role="region" :aria-label="b.label" tabindex="0">
        <table>
          <thead>
            <tr>
              <th v-for="(cell, j) in b.head" :key="j" scope="col" :style="b.align[j] ? { textAlign: b.align[j] } : undefined"><ProseText :nodes="cell" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in b.rows" :key="r">
              <td v-for="(cell, j) in row" :key="j" :style="b.align[j] ? { textAlign: b.align[j] } : undefined"><ProseText :nodes="cell" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!--
        Notes, in the order the text first cites them. Each carries the id its
        reference links to, and a way back when the text cites it. The heading
        is an `h2`: the notes are a section of the piece, like any other.
      -->
      <section v-else-if="b.tag === 'footnotes'" class="bf-prose__notes" aria-labelledby="bf-prose-notes">
        <h2 id="bf-prose-notes">Notes</h2>
        <ol>
          <li v-for="note in b.items" :id="`bf-fn-${noteId(note.id)}`" :key="note.id" :value="note.n">
            <ProseText :nodes="note.c" />
            <a
              v-if="note.referenced"
              class="bf-prose__back"
              :href="`#bf-fnref-${noteId(note.id)}`"
              :aria-label="`Back to note ${note.n} in the text`"
            ><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></a>
          </li>
        </ol>
      </section>

      <!--
        Every heading rank through one `<component :is>` (gh#223). `b.tag` is a
        closed union of tag names, so this can only resolve to a heading
        element; the other members are named above, which makes this the
        `v-else` by construction.
      -->
      <component :is="b.tag" v-else :data-caps="b.caps || undefined"><ProseText :nodes="b.c" /></component>
    </template>
    <!--
      Empty content renders **nothing** — residual #186. 97 of the 354
      `bfInsights` rows and 3 `bfProjects` rows store a null body (video and
      infographic items, where the media *is* the body), and the wireframe's
      `[body copy]` placeholder is scaffolding a visitor must never see. The
      `.stack` root stays, childless, and contributes no gap.
    -->
  </div>
</template>
