<template>
  <section
    :class="[
      'split-section',
      workstream.slug ? `split-section--${workstream.slug}` : '',
    ]"
  >
    <div class="split-section__wrapper">
      <div class="split-section__box">
        <div class="split-section__figure">
          <NuxtImg
            v-if="workstream.image && !isExternalImage(workstream.image)"
            :src="workstream.image"
            :width="1024"
            :height="768"
            class="split-section__image"
            loading="lazy"
            decoding="async"
            :alt="`${workstream.slug}'s image for ${workstream.heading}`"
            format="webp"
            sizes="(min-width: 64em) 520px, (min-width: 40em) 60vw, 90vw"
          />
          <img
            v-else-if="workstream.image"
            :src="workstream.image"
            class="split-section__image"
            loading="lazy"
            decoding="async"
            :alt="`${workstream.slug}'s image for ${workstream.heading}`"
            sizes="(min-width: 64em) 520px, (min-width: 40em) 60vw, 90vw"
          />
        </div>
      </div>
      <div class="split-section__box">
        <div class="split-section__content">
          <h2 class="split-section__headline">{{ workstream.heading }}</h2>
          <p class="split-section__excerpt">{{ workstream.excerpt }}</p>
          <a
            v-if="workstream.button"
            :href="workstream.button.url"
            class="button button--primary"
            >{{ workstream.button.label }}</a
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useExternalImage } from '~/composables/useExternalImage'

const { isExternalImage } = useExternalImage()

const props = defineProps<{
  workstream: {
    slug?: string
    heading?: string
    excerpt?: string
    image?: string
    button?: {
      url: string
      label: string
    }
  }
}>()
</script>

