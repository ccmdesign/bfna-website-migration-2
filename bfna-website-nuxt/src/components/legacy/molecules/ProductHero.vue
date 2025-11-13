<template>
  <div
    :class="[
      'product-hero',
      product.theme ? `product-hero--${product.theme}` : '',
      product.type ? `product-hero--${product.type}` : '',
    ]"
  >
    <div class="product-hero__wrapper">
      <div class="product-hero__content stack-l">
        <LegacyMoleculesBreadcrumb
          v-if="product.breadcrumbs"
          :breadcrumbs="product.breadcrumbs"
        />

        <h1 v-if="product.title" class="product-hero__heading">
          {{ product.title }}
        </h1>

        <h2 v-if="product.subheading" class="product-hero__subheading">
          {{ product.subheading }}
        </h2>

        <div
          v-if="product.description"
          class="product-hero__description"
          v-html="product.description"
        ></div>

        <template v-if="product.buttons">
          <template v-for="(button, index) in product.buttons" :key="index">
            <a
              v-if="button.type === 'report' || button.type === 'website'"
              :href="button.url"
              class="button button--primary"
              target="_blank"
              >{{ product.customButtonLabel || button.label }}</a
            >
            <a
              v-if="button.type === 'video'"
              class="button button--primary modal__trigger"
              :data-id="button.title"
              >{{ button.label }}</a
            >
          </template>
        </template>
      </div>
      <div v-if="product.image?.url" class="product-hero__image">
        <NuxtImg
          :src="product.image.url"
          :width="1024"
          :height="768"
          loading="lazy"
          decoding="async"
          :alt="`${product.heading} | ${product.subheading}`"
          format="webp"
          sizes="(min-width: 64em) 480px, (min-width: 40em) 60vw, 90vw"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  product: {
    theme?: string
    type?: string
    title?: string
    heading?: string
    subheading?: string
    description?: string
    image?: {
      url: string
    }
    buttons?: Array<{
      type: string
      url?: string
      label: string
      title?: string
    }>
    customButtonLabel?: string
    breadcrumbs?: {
      currentPage: string
      items: Array<{
        link: string
        title: string
      }>
    }
  }
}>()
</script>

