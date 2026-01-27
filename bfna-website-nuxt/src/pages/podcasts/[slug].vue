<template>
  <!-- Product Page -->
   <section
      v-if="productData"
      :class="[
        'product-page',
        productData?.theme ? `product-page--${productData.theme}` : '',
      ]">
      <LegacyMoleculesProductHero v-if="productData" :product="productData" />
    <div>
      <hgroup class="wrapper cards-section--future-leadership" style="margin-bottom: 4rem;">
        <h2 class="text-align:center">{{ productData.productSectionHeading }}</h2>
        <h4 class="text-align:center"></h4>
      </hgroup>
      <div class="wrapper">
        <div class="product-list stack-l">
          <div
            v-for="(product, index) in productData.products"
            :key="index"
          >
            <ProductCardThin :product="product" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSuperProduct } from '~/composables/data/useSuperProduct'
import { usePodcast } from '~/composables/data/usePodcast'
import LegacyMoleculesProductHero from '~/components/legacy/molecules/ProductHero.vue'

definePageMeta({
  layout: 'legacy-base',
  name: 'podcasts-slug',
})

const route = useRoute()
const spData = useSuperProduct()
const podcastData = usePodcast()

const productData = computed(() => {
  if(!spData.value){
    return podcastData.value
    
  }
  return spData.value
})

useHead({
  title: computed(() => {
    if (productData.value) {
      return `${productData.value.heading} | ${productData.value.workstream} | Bertelsmann Foundation`
    }
    return 'Content | Bertelsmann Foundation'
  }),
  meta: [
    {
      property: 'og:image',
      content: computed(() => 
        productData.value?.image?.url || '/images/bfna-og.jpg'
      ),
    },
    {
      name: 'description',
      content: computed(() => 
        productData.value?.excerpt || ''
      ),
    },
  ],
})
</script>

