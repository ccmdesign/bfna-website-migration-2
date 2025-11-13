<template>
  <div>
    <div class="wrapper">
      <div class="product-list">
        <div
          v-for="(product, index) in products"
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
import { useProducts } from '~/composables/data/useProducts'
import LegacyMoleculesProductCard from '~/components/legacy/molecules/ProductCard.vue'
import LegacyMoleculesProductCardWebsite from '~/components/legacy/molecules/ProductCardWebsite.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: products } = useProducts()

useHead({
  title: 'Products | Bertelsmann Foundation',
})
</script>

