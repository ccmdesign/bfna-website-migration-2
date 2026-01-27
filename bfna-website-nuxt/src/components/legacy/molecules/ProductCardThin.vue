<template>
  <div
    :class="[
      'product-card product-card--item',
      product.theme ? `product-card--${product.theme}` : '',
    ]"
  >
  <div class="product-card product-card--future-leadership product-card--item">
    <div class="product-card__image">
      <img :src="product.image?.url" sizes="(min-width: 64em) 320px, (min-width: 40em) 45vw, 90vw" loading="lazy" decoding="async" :alt="product.heading"> 
    </div>
      <div class="product-card__content">
        <header class="product-card__header">
          <h2 class="product-card__heading">{{ product.heading }}</h2>
        </header>
        <div class="product-card__body">
          <p>{{ product.excerpt }}</p>
        </div>
        <footer class="product-card__footer">
          <a v-if="product.isPodcast":href="`${product.slug}`" class="button button--primary button--future-leadership">Learn More</a>
          <a v-else :href="product.button?.url" class="button button--primary button--future-leadership">Learn More</a>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  product: {
    theme?: string
    slug?: string
    type?: string
    heading?: string
    subheading?: string
    excerpt?: string
    image?: {
      url: string
    }
    button?: {
      url: string
      label: string
    },
    isPodcast?: boolean
  }
}>()

console.log(34, props.product)

</script>

