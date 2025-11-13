<template>
  <!-- Product Page -->
  <section
    v-if="product"
    :class="[
      'product-page',
      product?.theme ? `product-page--${product.theme}` : '',
    ]"
  >
    <LegacyMoleculesProductHero v-if="product" :product="product" />

    <div v-if="product?.embed_code" class="center-l" v-html="product.embed_code"></div>

    <section
      v-if="product?.team_section?.team"
      class="secondary-section"
    >
      <hgroup class="wrapper">
        <h2 class="text-align:center">{{ product.team_section.heading }}</h2>
        <h4 class="text-align:center">{{ product.team_section.subheading }}</h4>
      </hgroup>

      <LegacyTemplatesPeopleSection :people="product.team_section.team" />
    </section>
  </section>

  <!-- Publication Page -->
  <article v-else-if="publication" class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="publication?.breadcrumbs"
        :breadcrumbs="publication.breadcrumbs"
      />

      <header>
        <h1 v-if="publication?.heading">{{ publication.heading }}</h1>
        <h2 v-if="publication?.subheading">{{ publication.subheading }}</h2>
        <p v-if="publication?.by_line" class="article__by-line">
          {{ publication.by_line }}
        </p>
      </header>

      <div
        v-if="publication?.content"
        class="article__content"
        v-html="publication.content"
      ></div>
    </div>
  </article>

  <!-- Video Page -->
  <article v-else-if="video" class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="video?.breadcrumbs"
        :breadcrumbs="video.breadcrumbs"
      />

      <header>
        <h1 v-if="video?.heading">{{ video.heading }}</h1>
        <h2 v-if="video?.subheading">{{ video.subheading }}</h2>
        <p v-if="video?.by_line" class="article__by-line">
          {{ video.by_line }}
        </p>
      </header>

      <div v-if="video?.video?.url" class="video-section wrapper">
        <figure class="video-section__frame">
          <iframe
            class="iframe-video"
            :src="video.video.url"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </figure>
      </div>

      <div
        v-if="video?.content"
        class="article__content"
        v-html="video.content"
      ></div>
    </div>
  </article>

  <!-- Podcast Page -->
  <article v-else-if="podcast" class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="podcast?.breadcrumbs"
        :breadcrumbs="podcast.breadcrumbs"
      />

      <header>
        <h1 v-if="podcast?.heading">{{ podcast.heading }}</h1>
        <h2 v-if="podcast?.subheading">{{ podcast.subheading }}</h2>
      </header>

      <div
        v-if="podcast?.excerpt"
        class="article__content"
        v-html="podcast.excerpt"
      ></div>
    </div>
  </article>

  <!-- Infographic Page -->
  <article v-else-if="infographic" class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="infographic?.breadcrumbs"
        :breadcrumbs="infographic.breadcrumbs"
      />

      <header>
        <h1 v-if="infographic?.heading">{{ infographic.heading }}</h1>
        <h2 v-if="infographic?.subheading">{{ infographic.subheading }}</h2>
        <p v-if="infographic?.by_line" class="article__by-line">
          {{ infographic.by_line }}
        </p>
      </header>

      <div
        v-if="infographic?.content"
        class="article__content"
        v-html="infographic.content"
      ></div>

      <figure v-if="infographic?.infographic?.url" class="prose__infographic">
        <NuxtImg
          v-if="infographic?.image?.url"
          :src="infographic.image.url"
          :alt="infographic.image.title"
          loading="lazy"
        />
        <p>
          <a
            :href="infographic.infographic.url"
            class="button button--secondary"
            target="_blank"
          >
            Download Original
          </a>
        </p>
      </figure>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useProducts } from '~/composables/data/useProducts'
import { usePublications } from '~/composables/data/usePublications'
import { useVideos } from '~/composables/data/useVideos'
import { usePodcasts } from '~/composables/data/usePodcasts'
import { useInfographics } from '~/composables/data/useInfographics'
import LegacyMoleculesProductHero from '~/components/legacy/molecules/ProductHero.vue'
import LegacyTemplatesPeopleSection from '~/components/legacy/templates/PeopleSection.vue'
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const { data: productsData } = await useProducts()
const { data: publicationsData } = await usePublications()
const { data: videosData } = await useVideos()
const { data: podcastsData } = await usePodcasts()
const { data: infographicsData } = await useInfographics()

// Normalize route path for comparison (remove trailing slash, ensure starts with /)
const normalizePath = (path: string) => {
  let normalized = path.startsWith('/') ? path : '/' + path
  normalized = normalized.replace(/\/$/, '') || normalized
  return normalized
}

const normalizedRoutePath = computed(() => normalizePath(route.path))

// Normalize URL from data (remove leading/trailing slashes)
const normalizeUrl = (url: string) => {
  return url?.replace(/^\//, '').replace(/\/$/, '') || ''
}

// Find product by matching the full permalink path
const product = computed(() => {
  if (!productsData.value) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = productsData.value.find(
    (p: any) => {
      const permalink = p.permalink || ''
      const normalizedPermalink = normalizePath(permalink)
      return normalizedPermalink === routePath
    }
  )
  
  return found || null
})

// Find publication by matching button.url
const publication = computed(() => {
  if (!publicationsData.value?.items) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = publicationsData.value.items.find(
    (p: any) => {
      const url = normalizeUrl(p.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  
  return found || null
})

// Find video by matching button.url
const video = computed(() => {
  if (!videosData.value?.items) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = videosData.value.items.find(
    (v: any) => {
      const url = normalizeUrl(v.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  
  return found || null
})

// Find podcast by matching button.url
const podcast = computed(() => {
  if (!podcastsData.value?.items) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = podcastsData.value.items.find(
    (p: any) => {
      const url = normalizeUrl(p.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  
  return found || null
})

// Find infographic by matching button.url
const infographic = computed(() => {
  if (!infographicsData.value?.items) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = infographicsData.value.items.find(
    (i: any) => {
      const url = normalizeUrl(i.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  
  return found || null
})

// If no content found after data loads, return 404
if (!product.value && !publication.value && !video.value && !podcast.value && 
    !infographic.value &&
    productsData.value && publicationsData.value && videosData.value && 
    podcastsData.value && infographicsData.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found'
  })
}

useHead({
  title: computed(() => {
    if (product.value) {
      return `${product.value.title} | ${product.value.workstream} | Bertelsmann Foundation`
    }
    if (publication.value) {
      return `${publication.value.heading} | Bertelsmann Foundation`
    }
    if (video.value) {
      return `${video.value.heading} | Bertelsmann Foundation`
    }
    if (podcast.value) {
      return `${podcast.value.heading} | Bertelsmann Foundation`
    }
    if (infographic.value) {
      return `${infographic.value.heading} | Bertelsmann Foundation`
    }
    return 'Content | Bertelsmann Foundation'
  }),
  meta: [
    {
      property: 'og:image',
      content: computed(() => 
        product.value?.image?.url || 
        publication.value?.image?.url || 
        video.value?.video?.thumbnail || 
        infographic.value?.image?.url ||
        '/images/bfna-og.jpg'
      ),
    },
    {
      name: 'description',
      content: computed(() => 
        product.value?.og_description || 
        publication.value?.excerpt || 
        video.value?.excerpt || 
        podcast.value?.excerpt || 
        infographic.value?.og_description ||
        ''
      ),
    },
  ],
})
</script>

