<template>
  <div>
    <LegacyMoleculesHero
      v-if="podcastsWorkstream"
      :hero="{
        heading: podcastsWorkstream.heading,
        description: podcastsWorkstream.excerpt,
      }"
      :theme="podcastsWorkstream.theme"
    />
    <div class="wrapper">
      <div class="product-list">
        <div
          v-for="(product, index) in podcasts || []"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkstreams } from '~/composables/data/useWorkstreams'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesProductCard from '~/components/legacy/molecules/ProductCard.vue'
import LegacyMoleculesProductCardWebsite from '~/components/legacy/molecules/ProductCardWebsite.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: workstreamData } = useWorkstreams('podcasts')
const podcastsWorkstream = workstreamData.value?.podcasts

const podcasts = computed(() => {
  return workstreamData.value?.podcasts.superProductsList || []
})

useHead({
  title: 'Podcasts | Bertelsmann Foundation',
})
</script>

