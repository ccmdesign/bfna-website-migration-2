<template>
  <section
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
</template>

<script setup lang="ts">
import { useProducts } from '~/composables/data/useProducts'
import LegacyMoleculesProductHero from '~/components/legacy/molecules/ProductHero.vue'
import LegacyTemplatesPeopleSection from '~/components/legacy/templates/PeopleSection.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const { data: productsData } = useProducts()

const product = computed(() => {
  if (!productsData.value) return null
  const slug = route.params.slug as string
  return productsData.value.find(
    (p: any) => p.permalink?.replace(/^\//, '').replace(/\/$/, '') === slug
  )
})

useHead({
  title: computed(() => {
    if (!product.value) return 'Product | Bertelsmann Foundation'
    return `${product.value.title} | ${product.value.workstream} | Bertelsmann Foundation`
  }),
  meta: [
    {
      property: 'og:image',
      content: computed(() => product.value?.image?.url || '/images/bfna-og.jpg'),
    },
    {
      name: 'description',
      content: computed(() => product.value?.og_description || ''),
    },
  ],
})
</script>

