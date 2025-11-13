<template>
  <div
    :class="[
      'product-card',
      product.theme ? `product-card--${product.theme}` : '',
      product.type ? `product-card--${product.type}` : '',
    ]"
  >
    <div class="product-card__content">
      <header class="product-card__header">
        <h2 class="product-card__heading">{{ product.heading }}</h2>
        <h3 class="product-card__subheading">{{ product.subheading }}</h3>
      </header>
      <div class="product-card__body">
        <p>{{ product.excerpt }}</p>
      </div>
      <footer class="product-card__footer">
        <a
          :href="product.button?.url"
          :class="['button', 'button--primary', product.theme ? `button--${product.theme}` : '']"
          >{{ product.button?.label }}</a
        >
      </footer>
    </div>
    <div v-if="product.image?.url" class="product-card__image">
      <NuxtImg
        :src="product.image.url"
        :width="800"
        :height="600"
        loading="lazy"
        decoding="async"
        :alt="`${product.heading} | ${product.subheading}`"
        format="webp"
        sizes="(min-width: 64em) 360px, (min-width: 48em) 40vw, 90vw"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  product: {
    theme?: string
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
    }
  }
}>()
</script>

