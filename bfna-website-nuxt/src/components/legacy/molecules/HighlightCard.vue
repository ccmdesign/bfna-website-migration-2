<template>
  <article
    :class="[
      'highlight-card',
      'card',
      newItem.theme ? `card--${newItem.theme}` : '',
    ]"
    :data-workstream="newItem.theme"
  >
    <div class="highlight-card__content card__content">
      <figure
        v-if="newItem.image"
        class="highlight-card__figure card__video"
        aria-hidden="true"
      >
        <NuxtImg
          :src="newItem.image.url"
          :width="480"
          :height="320"
          loading="lazy"
          decoding="async"
          alt="Highlight card image"
          format="webp"
          sizes="(min-width: 64em) 320px, (min-width: 40em) 45vw, 90vw"
        />
      </figure>
    </div>
    <div>
      <h2 class="card__heading">
        <a 
          :href="newItem.url"
          :target="isExternalLink(newItem.url) ? '_blank' : undefined"
          :rel="isExternalLink(newItem.url) ? 'noopener noreferrer' : undefined"
        >{{ newItem.heading }}</a>
      </h2>

      <h3 v-if="newItem.subheading" class="card__subheading">
        {{ newItem.subheading }}
      </h3>

      <div v-if="newItem.excerpt" class="card__excerpt">
        {{ truncate(newItem.excerpt, 300) }}
      </div>
      <footer v-if="newItem.url" class="card__footer">
        <div class="card__actions">
          <a 
            :href="newItem.url" 
            class="button button--primary"
            :target="isExternalLink(newItem.url) ? '_blank' : undefined"
            :rel="isExternalLink(newItem.url) ? 'noopener noreferrer' : undefined"
          >
            {{ newItem.buttonLabel }}
            <span v-if="newItem.heading" class="sr-only">
              about {{ newItem.heading }}</span
            >
          </a>
        </div>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  newItem: {
    theme?: string
    image?: {
      url: string
    }
    heading?: string
    subheading?: string
    excerpt?: string
    url?: string
    buttonLabel?: string
  }
}>()

const truncate = (text: string, length: number) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

const isExternalLink = (url?: string) => {
  if (!url) return false
  // Check if URL starts with http:// or https://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if it's not the same domain (bfna.org or localhost for dev)
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      // Consider external if not bfna.org, www.bfna.org, or localhost
      return !hostname.includes('bfna.org') && !hostname.includes('localhost')
    } catch {
      // If URL parsing fails, treat as external if it starts with http
      return true
    }
  }
  return false
}
</script>

