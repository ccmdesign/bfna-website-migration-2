<template>
  <article
    :class="['doc-card', 'card', card.theme ? `card--${card.theme}` : '']"
    :data-workstream="card.theme"
  >
    <div class="doc-card__content card__content">
      <figure v-if="card.backgroundImage" class="card__video" aria-hidden="true">
        <NuxtImg
          :src="card.backgroundImage"
          :width="900"
          :height="600"
          loading="lazy"
          decoding="async"
          alt="Document card background image"
          format="webp"
          sizes="(min-width: 64em) 360px, (min-width: 40em) 60vw, 90vw"
        />
      </figure>
    </div>
    <div>
      <h2 class="card__heading">
        <a :href="card.button?.url">{{ card.heading }}</a>
      </h2>

      <h3 v-if="card.subheading" class="card__subheading">
        {{ card.subheading }}
      </h3>

      <div v-if="card.description" class="card__excerpt">
        {{ truncate(card.description, 300) }}
      </div>
      <footer v-if="card.button || card.by" class="card__footer">
        <small v-if="card.by" class="card__by-line">By {{ card.by }}</small>
        <div v-if="card.button" class="card__actions">
          <a :href="card.button.url" class="button button--primary">
            {{ card.button.label }}
            <span v-if="card.heading" class="sr-only">
              about {{ card.heading }}</span
            >
          </a>
        </div>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  card: {
    theme?: string
    backgroundImage?: string
    heading?: string
    subheading?: string
    description?: string
    button?: {
      url: string
      label: string
    }
    by?: string
  }
}>()

const truncate = (text: string, length: number) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

