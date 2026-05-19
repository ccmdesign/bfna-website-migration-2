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

        <h1 v-if="product.heading" class="product-hero__heading">
          {{ product.heading }}
        </h1>

        <h2 v-if="product.subheading" class="product-hero__subheading">
          {{ product.subheading }}
        </h2>

        <div v-if="product.description" class="product-hero__description" v-html="product.description"></div>
        
        <div
          v-if="product.embedCode"
          class="product-hero__description"
          v-html="product.embedCode"
        ></div>

        <template v-if="product.button">
          <template v-if="product.button.type === 'report'">
            <a
              :href="product.report"
              class="button button--primary"
              target="_blank"
              >Open full report</a
            >
          </template>
          <template v-else-if="product.button.type === 'video'">
            <a
              v-if="product.button.type === 'video'"
              class="button button--primary modal__trigger"
              >{{ product.button.label }}</a
            >
          </template>
        </template>
      </div>
      <div v-if="product.image?.url" class="product-hero__image">
        <NuxtImg
          v-if="!isExternalImage(product.image.url)"
          :src="product.image.url"
          :width="1024"
          :height="768"
          loading="lazy"
          decoding="async"
          :alt="`${product.heading} | ${product.subheading}`"
          :format="isPng(product.image.url) ? undefined : 'webp'"
          sizes="(min-width: 80em) 600px, (min-width: 50em) 45vw, 90vw"
        />
        <img
          v-else
          :src="product.image.url"
          loading="lazy"
          decoding="async"
          :alt="`${product.heading} | ${product.subheading}`"
          sizes="(min-width: 80em) 600px, (min-width: 50em) 45vw, 90vw"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'
import { useExternalImage } from '~/composables/useExternalImage'

const { isExternalImage, isPng } = useExternalImage()

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
    button?: {
      type: string
      label: string
      url?: string
    }[]
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

