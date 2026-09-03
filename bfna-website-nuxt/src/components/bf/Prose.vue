<script setup lang="ts">
/**
 * `bfProse` — the body-string renderer.
 *
 * Ports `components/wireframe/wfProse.vue` (frozen, D2 — read, never edited),
 * whose whole job is to take one body field and render it as block-level text.
 * Bodies arrive from the `data` collections as **plain strings** in one of two
 * shapes, and this component handles both:
 *
 *  - **markdown-lite** — `##` / `###` line-leading heading markers, `- ` and
 *    `* ` list markers, everything else a paragraph, with the inline marks
 *    (`**bold**`, `*italic*`, `` `code` ``, `[label](url)`) stripped to their
 *    text;
 *  - **legacy HTML** — the Directus-era bodies, detected by `/<[a-z][^>]*>/i`,
 *    whose block closers become newlines, whose remaining tags are dropped and
 *    whose `&amp;` / `&nbsp;` entities are decoded, after which the same
 *    line loop runs.
 *
 * ## What is ported verbatim, and why that is the point
 *
 * `inline()`, the legacy pre-pass, the line loop and the `Block` union are the
 * wf source's own, character for character. The epic's rule 10 is that a `bf-*`
 * component renders the same data its `wf-*` counterpart renders in the
 * matching slot; for a parser, "the same data" means the same *parse*, so any
 * improvement here — nested lists, ordered lists, preserved emphasis — would be
 * a behaviour change dressed as a port. The wf source's own comment says where
 * that work belongs ("swap for a real renderer when production styling needs
 * bold/links preserved"), and it is not this issue.
 *
 * The one deliberate divergence is the **empty-body case**: the wf source
 * prints a `[body copy]` placeholder and this component renders nothing
 * (residual #186, taken in gh#61). Reasoning at the template below.
 *
 * ## Heading ranks start at 2, and cannot start lower
 *
 * `##` and `#` alike map to rank 2; `###` maps to rank 3. Nothing in this file
 * emits a rank-1 heading, and nothing can: a legacy body's rank-1 heading is
 * flattened to a paragraph line by the tag-strip pass *before* the line loop
 * ever sees it, so the element is gone and only its text survives. That keeps
 * the page's single rank-1 heading — `bfPageHeader`'s or `bfHero`'s — unique
 * (BRIEF §5 rule 9). It is a preserved constraint rather than a new fix, and it
 * is asserted by name on probe 45 because it is easy to regress.
 *
 * ## No `v-html`
 *
 * Every block's text goes through interpolation, so Vue escapes it. That is the
 * wf source's construction, kept — which is also why "sanitising untrusted
 * input" being out of scope costs nothing here: no markup from the body is ever
 * inserted as markup.
 *
 * ## No `data-measure`, and no stylesheet
 *
 * The line-length cap is the **caller's**, exactly as in the wf source, which
 * carries no measure attribute either: every call site wraps this component in
 * `<bfSection measure="narrow">`, whose inner `.center[data-measure="narrow"]`
 * resolves `--_center-measure: 60ch` in `@layer composition`. A cap declared
 * here would fight that one and would make a wide-measure call site impossible.
 *
 * There is no `<style>` block at all. `.stack[data-gap="s"]` already sets the
 * block rhythm and the ambient type scale already sets the type; a rule in this
 * file could only restate the composition layer or add something the spec
 * forbids. No new CSS variables, no colour, and no `:not()` of any shape
 * (D-20.5).
 *
 * Presentational-only (D8): one prop in, nothing out, no collection, no store.
 */
import type { ProseProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfProse' })

/*
 * Fallthrough is left on. The template has a single root, so `$attrs` has one
 * unambiguous destination and `class` merges with `stack` rather than replacing
 * it (BRIEF §5 rule 4). Unlike `bfSection`, this component declares no
 * prop-shaped surface for a caller to mistype, so there is nothing an allowlist
 * would protect.
 */
const props = defineProps<ProseProps>()

/**
 * One parsed block. A discriminated union rather than a `tag` plus optional
 * fields, so the template's branches are exhaustive by construction and a `ul`
 * can carry `items` while the other three carry `text`.
 *
 * Ported from the wf source unchanged, including the closed rank set: adding
 * `'h4'` here would silently widen what the parser may emit.
 */
type Block = { tag: 'h2' | 'h3' | 'p', text: string } | { tag: 'ul', items: string[] }

/**
 * Strip inline markdown marks, leaving the text.
 *
 * Ported verbatim. Link text survives and the URL does not — which is the
 * documented limitation, not an oversight: preserving links needs a real
 * renderer and a decision about `rel`/`target` that this issue does not make.
 */
const inline = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .trim()

/**
 * The body, parsed. Ported verbatim from the wf source.
 *
 * The legacy pre-pass runs first and only when the content actually looks like
 * markup, so a markdown body containing a stray `<` is not mangled by it. After
 * it, both paths are the same line loop: rank-3 heading, rank-2 heading (`#` or
 * `##`), list item — appended to the open list if the previous block is one —
 * else paragraph.
 */
const blocks = computed<Block[]>(() => {
  let src = props.content ?? ''
  // Legacy HTML bodies: turn block closers into line breaks, drop tags
  if (/<[a-z][^>]*>/i.test(src)) {
    src = src.replace(/<\/(p|h[1-6]|li|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '').replace(/&(amp|nbsp);/g, m => m === '&amp;' ? '&' : ' ')
  }
  const out: Block[] = []
  for (const line of src.split(/\n+/).map(l => l.trim()).filter(Boolean)) {
    if (/^###\s/.test(line)) out.push({ tag: 'h3', text: inline(line.slice(4)) })
    else if (/^##?\s/.test(line)) out.push({ tag: 'h2', text: inline(line.replace(/^#+\s/, '')) })
    else if (/^[-*]\s/.test(line)) {
      const last = out[out.length - 1]
      if (last?.tag === 'ul') last.items.push(inline(line.slice(2)))
      else out.push({ tag: 'ul', items: [inline(line.slice(2))] })
    }
    else out.push({ tag: 'p', text: inline(line) })
  }
  return out
})
</script>

<template>
  <!--
    One root, `.stack[data-gap="s"]` — the wf source's own, kept element for
    element. The rhythm between blocks is the composition layer's; nothing here
    restates it.
  -->
  <div class="bf-prose | stack" data-gap="s">
    <!--
      No `v-if="blocks.length"` guard around the loop: an empty list renders no
      children on its own, and the guard only existed to select between the
      blocks and the placeholder that is now gone.
    -->
    <template v-for="(b, i) in blocks" :key="i">
      <h2 v-if="b.tag === 'h2'">{{ b.text }}</h2>
      <h3 v-else-if="b.tag === 'h3'">{{ b.text }}</h3>
      <ul v-else-if="b.tag === 'ul'">
        <li v-for="li in b.items" :key="li">{{ li }}</li>
      </ul>
      <p v-else>{{ b.text }}</p>
    </template>
    <!--
      Empty content renders **nothing** — residual #186, decided here for every
      template at once. The frozen `wfProse` writes a visible `[body copy]`
      placeholder, and #45 ported it deliberately: in a wireframe, a body that
      failed to arrive is a content defect a reviewer must be able to see on the
      page. On the public site it is scaffolding shipped to a visitor — 97 of
      the 354 `bfInsights` rows and 3 `bfProjects` rows store a null body
      (video and infographic items, where the media *is* the body), and every
      one of those pages was printing `[body copy]` to a reader.

      So the component emits no placeholder and no empty `<p>`: the `.stack`
      root stays, childless, and contributes no gap. The wireframe keeps its own
      placeholder untouched (D2) — `wfProse` is not edited, and the two
      renderers now differ here on purpose. Probe 45 asserts the new behaviour
      by the same two rows that used to assert the old one.
    -->
  </div>
</template>
