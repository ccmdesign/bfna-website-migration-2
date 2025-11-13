<template>
  <div>
    <LegacyMoleculesHero
      v-if="workstreamData"
      :hero="{
        heading: workstreamData.heading,
        description: workstreamData.description,
      }"
      :theme="workstreamData.theme"
      :hero-image="heroConfig"
    />

    <div class="wrapper">
      <div class="product-list">
        <div
          v-for="(product, index) in workstreamData?.products_list"
          :key="index"
          class="product-card-wrapper"
        >
          <LegacyMoleculesProductCardWebsite
            v-if="product.type === 'website'"
            :product="product"
          />
          <LegacyMoleculesProductCard
            v-else
            :product="product"
          />
        </div>
      </div>

      <div v-if="updatesList && updatesList.length > 0" class="cards-section cards-section--updates">
        <LegacyMoleculesCard
          v-for="(card, index) in updatesList"
          :key="index"
          :card="card"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkstream } from '~/composables/data/useWorkstream'
import { useHeroImage } from '~/composables/data/useHeroImage'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesProductCard from '~/components/legacy/molecules/ProductCard.vue'
import LegacyMoleculesProductCardWebsite from '~/components/legacy/molecules/ProductCardWebsite.vue'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const slug = route.params.slug as string

const { data: workstream, pending } = useWorkstream(slug)

// 404 handling - check after data loads
watch([workstream, pending], ([value, isLoading]) => {
  if (!isLoading && value === null) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workstream not found',
    })
  }
}, { immediate: true })

// Type guard: ensure workstream is not null and not an array
const workstreamData = computed(() => {
  const ws = workstream.value
  if (!ws || Array.isArray(ws)) {
    return null
  }
  return ws
})

// Get hero image config for preloading
const { config: heroConfig } = useHeroImage(workstreamData.value?.theme)

// Filter updates list (exclude if theme is 'podcasts')
const updatesList = computed(() => {
  const ws = workstreamData.value
  if (!ws || ws.theme === 'podcasts') {
    return []
  }
  return ws.updates_list || []
})

// Preload hero image and set page title
useHead({
  link: [
    ...(heroConfig.value?.webp
      ? [
          {
            rel: 'preload',
            as: 'image' as const,
            fetchpriority: 'high' as const,
            href: heroConfig.value.webp,
          },
        ]
      : []),
    ...(heroConfig.value?.fallback && heroConfig.value.fallback !== heroConfig.value?.webp
      ? [
          {
            rel: 'preload',
            as: 'image' as const,
            fetchpriority: 'high' as const,
            href: heroConfig.value.fallback,
          },
        ]
      : []),
  ],
  title: computed(() => {
    const ws = workstreamData.value
    if (!ws) return 'Workstream | Bertelsmann Foundation'
    return `${ws.heading} | Bertelsmann Foundation`
  }),
})
</script>
