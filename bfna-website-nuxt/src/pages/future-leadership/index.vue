<template>
  <div>
    <LegacyMoleculesHero
      v-if="workstreamData"
      :hero="{
        heading: workstreamData.heading,
        description: workstreamData.excerpt,
      }"
      :theme="workstreamData.theme"
    />

    <div class="wrapper">
      <div class="product-list">
        <div
          v-for="(product, index) in workstreamData?.productsList"
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

      <div v-if="updatesList && updatesList.length > 0" class="cards-section cards-section--updates cards-section--future-leadership">
        <div class="cards-section__title">
          <h1 class="h1">Updates</h1>
        </div>
        <LegacyMoleculesCard
          v-for="(card, index) in updatesList"
          :key="index"
          :card="card"
        />
        <div class="cards-section__button cards-section--future-leadership">
          <div id="more-articles-button" data-workstream="future-leadership" style="width: max-content; margin: auto;">
            <a href="/updates" class="button button--secondary">More Content</a>
          </div>
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
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: workstreamsData } = useWorkstreams('future-leadership')

const workstreamData = computed(() => {
  return workstreamsData.value?.['future-leadership'] || null
})

const updatesList = computed(() => {
  if (!workstreamData.value || workstreamData.value.theme === 'podcasts') {
    return []
  }
  return workstreamData.value.updatesList || []
})

useHead({
  title: computed(() => {
    if (!workstreamData.value) return 'Future Leadership | Bertelsmann Foundation'
    return `${workstreamData.value.heading} | Bertelsmann Foundation`
  }),
})
</script>
<style scoped>
.cards-section__button {
  grid-column: 1 / -1;
  width: 100%;
  padding-top: 2rem;
}

.cards-section__button > div {
  width: 100% !important;
  margin: 0 !important;
  display: flex;
  justify-content: center;
}

.cards-section__title {
  grid-column: 1 / -1;
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 0;
  padding-bottom: 0;
}

.cards-section__title .h1 {
  color: hsl(var(--theme-hsl), 1);
}

.cards-section--democracy {
  --theme-hsl: var(--green-hsl);
}

.cards-section--future-leadership {
  --theme-hsl: var(--red-hsl);
}

.cards-section--politics-society {
  --theme-hsl: var(--yellow-hsl);
}

.cards-section--digital-world {
  --theme-hsl: var(--purple-hsl);
}
</style>

