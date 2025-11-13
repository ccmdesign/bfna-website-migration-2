<template>
  <article
    ref="cardElement"
    :class="[
      'card',
      card.theme ? `card--${card.theme}` : '',
      card.image ? 'card--infographic' : '',
      card.video ? 'card--video' : '',
      cardOrientation,
    ]"
    :data-w="card.image?.width"
    :data-h="card.image?.height"
    :data-workstream="card.theme"
  >
    <div class="card__content">
      <figure
        v-if="card.image"
        :class="card.isProduct ? 'card__product' : 'card__infographic'"
        aria-hidden="true"
      >
        <NuxtImg
          :src="card.image.url"
          :width="card.image.width || 900"
          :height="card.image.height"
          loading="lazy"
          decoding="async"
          alt="Card image"
          format="webp"
          sizes="(min-width: 75em) 360px, (min-width: 48em) 50vw, 90vw"
        />
      </figure>

      <figure v-if="card.video" class="card__video" aria-hidden="true">
        <NuxtImg
          :src="card.video.thumbnail"
          :width="900"
          :height="600"
          loading="lazy"
          decoding="async"
          alt="Card video thumbnail"
          format="webp"
          sizes="(min-width: 64em) 320px, (min-width: 48em) 50vw, 90vw"
        />
      </figure>

      <h2 v-if="card.brow" class="card__brow">
        <span>{{ card.brow }}</span>
      </h2>

      <h2 class="card__heading">
        <a :href="card.button?.url">{{ card.heading }}</a>
      </h2>

      <h3 v-if="card.subheading" class="card__subheading">
        {{ card.subheading }}
      </h3>

      <p v-if="card.date" class="card__date">{{ card.date }}</p>

      <div v-if="card.excerpt" class="card__excerpt">
        {{ truncate(card.excerpt, 300) }}
      </div>
    </div>
    <footer v-if="card.button || card.by_line" class="card__footer">
      <small v-if="card.by_line" class="card__by-line">{{ card.by_line }}</small>
      <div v-if="card.button" class="card__actions">
        <a :href="card.button.url" class="button button--primary">
          {{ card.button.label }}
          <span v-if="card.heading" class="sr-only">
            about {{ card.heading }}</span
          >
        </a>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  card: {
    theme?: string
    image?: {
      url: string
      width?: number
      height?: number
    }
    video?: {
      thumbnail: string
    }
    brow?: string
    heading?: string
    subheading?: string
    date?: string
    excerpt?: string
    button?: {
      url: string
      label: string
    }
    by_line?: string
    isProduct?: boolean
  }
}>()

const truncate = (text: string, length: number) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Determine card orientation based on image dimensions
// This matches the logic from the external components.js script
const cardOrientation = computed(() => {
  if (!props.card.image?.width || !props.card.image?.height) {
    return ''
  }
  const width = props.card.image.width
  const height = props.card.image.height
  
  // Match the external script logic: if width > height, it's horizontal; otherwise vertical
  // Use a small threshold to handle near-square images
  const aspectRatio = width / height
  return aspectRatio > 1.1 ? 'card--horizontal' : 'card--vertical'
})

const cardElement = ref<HTMLElement | null>(null)

// Sync classes after mount to prevent hydration mismatches with external script
onMounted(() => {
  if (!cardElement.value) return
  
  // Ensure the orientation class matches our computed value
  const expectedClass = cardOrientation.value
  cardElement.value.classList.remove('card--horizontal', 'card--vertical')
  if (expectedClass) {
    cardElement.value.classList.add(expectedClass)
  }
})
</script>

