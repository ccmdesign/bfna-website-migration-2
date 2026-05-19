<template>
  <div
    :class="[
      'product-card',
      product.theme ? `product-card--${product.theme}` : '',
      product.type ? `product-card--${product.type}` : '',
    ]"
  >
    <div v-if="product.image?.url" class="product-card__image">
      <NuxtImg
        v-if="!isExternalImage(product.image.url)"
        :src="product.image.url"
        :width="1280"
        :height="960"
        loading="lazy"
        decoding="async"
        :alt="`${product.heading} | ${product.subheading}`"
        :format="isPng(product.image.url) ? undefined : 'webp'"
        sizes="(min-width: 64em) 1000px, (min-width: 48em) 60vw, 90vw"
      />
      <img
        v-else
        :src="product.image.url"
        loading="lazy"
        decoding="async"
        :alt="`${product.heading} | ${product.subheading}`"
        sizes="(min-width: 64em) 1000px, (min-width: 48em) 60vw, 90vw"
      />
    </div>
    <div class="product-card__content">
      <header class="product-card__header">
        <h2 class="product-card__heading">{{ product.heading }}</h2>
      </header>
      <div class="product-card__body">
        <p>{{ product.excerpt }}</p>
      </div>

      <footer class="product-card__footer">
        <a v-if="product.products?.length"
          @click.prevent="navigateToSuperProductSlug(product)"
          :class="['button', 'button--primary', product.theme ? `button--${product.theme}` : '']"
          >{{ product.button?.label }}</a
        >
        <a v-else
          :href="product.button?.url"
          :class="['button', 'button--primary', product.theme ? `button--${product.theme}` : '']"
          >{{ product.button?.label }}</a
        >
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExternalImage } from '~/composables/useExternalImage'

const props = defineProps<{
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
    },
    products?: Array<any>
  }
}>()

const { isExternalImage, isPng } = useExternalImage()
const router = useRouter();

const navigateToSuperProductSlug = (product: any) => {
  if (product.isSuperProduct && product.theme === 'podcasts') {
    // Navigate to podcasts page
    const slug = product.isSuperProduct ? product.slug : product.slug
    const url = slug.startsWith('/') ? `podcasts/${slug}` : `/podcasts/${slug}`
    router.push(url)
  } else {
    // Navigate to content-slug page
    const slug = product.slug
    const theme = product.theme || ''
    const url = theme ? `/${theme}/${slug}` : (slug.startsWith('/') ? slug : `/${slug}`)
    router.push(url)
  }
}
</script>
