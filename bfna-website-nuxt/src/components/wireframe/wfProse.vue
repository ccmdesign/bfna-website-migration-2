<!-- Prose: renders a Directus body field (markdown or legacy HTML) as wireframe
     text blocks. ponytail: markdown-lite parser (headings, lists, paragraphs;
     inline marks stripped) — swap for a real renderer when production styling
     needs bold/links preserved. -->
<script setup lang="ts">
const props = defineProps<{ content?: string | null }>()

type Block = { tag: 'h2' | 'h3' | 'p', text: string } | { tag: 'ul', items: string[] }

// Strip inline markdown marks; wireframe shows structure, not styling
const inline = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .trim()

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
  <div class="stack" data-gap="s">
    <template v-if="blocks.length">
      <template v-for="(b, i) in blocks" :key="i">
        <h2 v-if="b.tag === 'h2'">{{ b.text }}</h2>
        <h3 v-else-if="b.tag === 'h3'">{{ b.text }}</h3>
        <ul v-else-if="b.tag === 'ul'">
          <li v-for="li in b.items" :key="li">{{ li }}</li>
        </ul>
        <p v-else>{{ b.text }}</p>
      </template>
    </template>
    <p v-else>[body copy]</p>
  </div>
</template>
