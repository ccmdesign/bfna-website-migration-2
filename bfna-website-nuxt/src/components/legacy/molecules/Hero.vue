<template>
  <div :class="['hero', theme ? `hero--${theme}` : '']">
    <picture v-if="heroImage && (heroImage.webp || heroImage.fallback)" class="hero__media">
      <source v-if="heroImage.webp" :srcset="heroImage.webp" type="image/webp" />
      <img
        v-if="heroImage.fallback"
        :src="heroImage.fallback"
        :width="heroImage.width"
        :height="heroImage.height"
        alt=""
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
    </picture>

    <div class="wrapper stack-l hero__content">
      <div>
        <a class="hero__logo" href="/">
          <LegacyAtomsLogo />
          <span class="sr-only">Bertelsmann Foundation home</span>
        </a>
      </div>

      <hgroup class="stack-l">
        <div>
          <LegacyMoleculesPlatformNav />
        </div>

        <h1 v-if="hero.heading" class="hero__heading">
          {{ hero.heading }}
        </h1>

        <h2 v-if="hero.subheading" class="hero__subheading">
          {{ hero.subheading }}
          <span v-if="isHomepage" ref="typewriterRef" class="typewriter-words" id="typewriter"></span
          ><br v-if="isHomepage" />{{ hero.subheadingend }}
        </h2>

        <p v-if="hero.description" class="hero__description">
          {{ hero.description }}
        </p>
      </hgroup>

      <footer>
        <a
          v-if="hero.button"
          :href="hero.button.url"
          class="button button--primary"
          >{{ hero.button.label }}</a
        >
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import LegacyAtomsLogo from '~/components/legacy/atoms/Logo.vue'
import LegacyMoleculesPlatformNav from '~/components/legacy/molecules/PlatformNav.vue'
import { useTypeWriter } from '~/composables/legacy/useTypeWriter'

const route = useRoute()

const props = defineProps<{
  hero: {
    heading?: string
    subheading?: string
    subheadingend?: string
    description?: string
    button?: {
      url: string
      label: string
    }
  }
  theme?: string
  heroImage?: {
    webp?: string
    fallback?: string
    width: number
    height: number
  }
}>()

const heroImages: Record<
  string,
  { webp: string; fallback: string; width: number; height: number }
> = {
  default: {
    webp: '/images/hero/homepage.webp',
    fallback: '/images/hero/homepage.jpg',
    width: 1600,
    height: 1067,
  },
  democracy: {
    webp: '/images/hero/democracy@2x.webp',
    fallback: '/images/hero/democracy@2x.jpg',
    width: 1600,
    height: 1600,
  },
  'digital-world': {
    webp: '/images/hero/digital-world@2x.webp',
    fallback: '/images/hero/digital-world.jpg',
    width: 1600,
    height: 1600,
  },
  'future-leadership': {
    webp: '/images/hero/future-leadership@2x.webp',
    fallback: '/images/hero/future-leadership@2x.jpg',
    width: 1600,
    height: 1066,
  },
  'politics-society': {
    webp: '/images/hero/politics-society@2x.webp',
    fallback: '/images/hero/politics-society@2x.jpg',
    width: 1600,
    height: 1600,
  },
  team: {
    webp: '/images/hero/team@2x.webp',
    fallback: '/images/hero/team@2x.jpg',
    width: 1600,
    height: 1600,
  },
  about: {
    webp: '/images/hero/about@2x.webp',
    fallback: '/images/hero/about@2x.jpg',
    width: 1600,
    height: 1600,
  },
  stiftung: {
    webp: '/images/hero/stiftung.webp',
    fallback: '/images/hero/stiftung.jpg',
    width: 1600,
    height: 774,
  },
  archives: {
    webp: '/images/hero/archives@2x.webp',
    fallback: '/images/hero/archives@2x.jpg',
    width: 1600,
    height: 1600,
  },
  updates: {
    webp: '/images/hero/updates@2x.webp',
    fallback: '/images/hero/updates@2x.jpg',
    width: 1600,
    height: 1586,
  },
}

const heroTheme = computed(() => props.theme || 'default')
const heroImage = computed(() => {
  // Use provided heroImage prop if available
  if (props.heroImage) {
    return props.heroImage
  }
  // Fall back to theme-based lookup
  return heroImages[heroTheme.value] || null
})

const isHomepage = computed(() => route.path === '/')
const typewriterRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (isHomepage.value && typewriterRef.value) {
    useTypeWriter(typewriterRef)
  }
})
</script>

