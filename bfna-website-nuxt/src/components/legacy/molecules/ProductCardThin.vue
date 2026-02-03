<template>
  <div
    ref="cardRef"
    :class="[
      'product-card product-card--item',
      product.theme ? `product-card--${product.theme}` : '',
    ]"
  >
  <div class="product-card__image">
    <img 
      ref="imageRef"
      :src="product.image?.url" 
      sizes="(min-width: 64em) 320px, (min-width: 40em) 45vw, 90vw" 
      loading="lazy" 
      decoding="async" 
      :alt="product.heading"
    > 
  </div>
    <div class="product-card__content">
      <header class="product-card__header">
        <h2 class="product-card__heading">{{ product.heading }}</h2>
      </header>
      <div class="product-card__body">
        <p>{{ product.excerpt }}</p>
      </div>
      <footer v-if="transponderButton" class="product-card__footer">
        <a :href="transponderButton.url" class="button button--primary button--future-leadership">{{ transponderButton.label }}</a>
      </footer>
      <footer v-else class="product-card__footer">
        <a v-if="product.isPodcast":href="`${product.slug}`" class="button button--primary button--future-leadership">Learn More</a>
        <a v-else :href="product.button?.url" class="button button--primary button--future-leadership">Learn More</a>
      </footer>
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

const cardRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()

const adjustImageSize = () => {
  if (!cardRef.value || !imageRef.value) return
  
  const cardHeight = cardRef.value.offsetHeight
  const imageHeight = cardHeight + 4 // 4px bigger than card height
  
  imageRef.value.style.height = `${imageHeight}px`
  imageRef.value.style.width = 'auto'
  imageRef.value.style.objectFit = 'contain'
  imageRef.value.style.objectPosition = 'bottom'
}

onMounted(() => {
  nextTick(() => {
    adjustImageSize()
  })
})

onUpdated(() => {
  nextTick(() => {
    adjustImageSize()
  })
})

const transponderButton = computed(() => {
  if (props.product.slug?.includes('transponder')) {
    return {
      label: 'Open full report',
      url: `${props?.product?.report}`
    }
  }
  return null
})

</script>

<style scoped>
  .product-card--item {
    position: relative;
  }

  .product-card__image {
    position: relative;
    display: flex;
    align-items: flex-end;
    overflow: visible;
  }

  .product-card__image > img {
    position: relative;
    bottom: 0;
  }
</style>