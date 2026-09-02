<!-- External-only product (today just the Transponder magazine) rendered as a
     "special" card INSIDE the Insights grid rather than as its own band
     (Claudio, Sep 2 — his reply to Irene's "move the Magazine to the Insights").
     data-span="full" gives it the double-width 2x1 slot so it still pops. -->
<script setup lang="ts">
import type { WfProject } from '~/composables/useWfContent'

const props = withDefaults(defineProps<{
  product: WfProject
  excerptLength?: number
}>(), { excerptLength: 220 })

const { plain } = useWfContent()

const blurb = computed(() => {
  const t = plain(props.product.excerpt ?? props.product.description)
  return t.length > props.excerptLength ? t.slice(0, props.excerptLength).trimEnd() + '…' : t
})
</script>

<template>
  <wf-card data-span="full">
    <h3>
      <!-- No external_url yet (Q6), so the title can't be the card's link —
           the pending chip carries that status instead. -->
      <a v-if="product.external_url" :href="product.external_url" data-external>{{ product.heading }}</a>
      <template v-else>{{ product.heading }}</template>
    </h3>
    <p v-if="blurb">{{ blurb }}</p>
    <template #chips>
      <span class="wf-chip">Magazine</span>
      <span v-if="!product.external_url" class="wf-chip">External link pending {{ product.pending ?? 'Q6' }}</span>
    </template>
    <template #media>
      <!-- 21/9 keeps this card about as tall as one row of featured cards while
           being twice as wide — the "1" in the 2x1 slot. Measured against the
           featured cards (636px) it lands at 646px. Ratio lives here, not in
           wireframe.css: wfMedia writes aspect-ratio inline when there is a real
           image, so a stylesheet rule would not win. -->
      <wf-media :src="product.image" alt="" ratio="21/9" />
    </template>
  </wf-card>
</template>
