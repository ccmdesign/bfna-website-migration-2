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
        :src="product.image.url"
        :width="800"
        :height="600"
        loading="lazy"
        decoding="async"
        :alt="`${product.heading} | ${product.subheading}`"
        format="webp"
        sizes="(min-width: 64em) 400px, (min-width: 48em) 45vw, 90vw"
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

console.log(props.product);

const router = useRouter();
const navigateToSuperProductSlug = (product: any) => {

  if(product.isSuperProduct && product.theme === 'podcasts') {
    router.push({
      name: `podcasts-slug`,
      path: product.isSuperProduct ? `${product.slug}` : product.slug,
      params: { slug: product.isSuperProduct ? `${product.slug}` : product.slug }
    });

  } else {
    router.push({
      name: `content-slug`,
      path: product.slug,
      params: { slug: `${product.theme}/${product.slug}` }
    });
  }
}
</script>
