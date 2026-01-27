<template>
  <div>
    <LegacyMoleculesHero
      v-if="workstreamData"
      :hero="{
        heading: workstreamData.heading,
        description: workstreamData.description,
      }"
      theme="archives"
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
import { useWorkstreams } from '~/composables/data/useWorkstreams'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesProductCard from '~/components/legacy/molecules/ProductCard.vue'
import LegacyMoleculesProductCardWebsite from '~/components/legacy/molecules/ProductCardWebsite.vue'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: workstreamsData } = useWorkstreams()

const workstreamData = computed(() => {
  return workstreamsData.value?.archives || null
})

const updatesList = computed(() => {
  // TODO: Extract updates list from workstream data
  return []
})

useHead({
  title: 'Archives | Bertelsmann Foundation',
})
</script>

