<template>
  <!-- Product Page -->
   <section
      v-if="product"
      :class="[
        'product-page',
        product?.theme ? `product-page--${product.theme}` : '',
      ]">
      <LegacyMoleculesProductHero v-if="product" :product="product" />
    <div>
      <hgroup class="wrapper cards-section--future-leadership" style="margin-bottom: 4rem;">
        <h2 class="text-align:center">{{ product.productSectionHeading }}</h2>
        <h4 class="text-align:center"></h4>
      </hgroup>
      <div class="wrapper">
        <div class="product-list stack-l">
          <div v-for="(pc, index) in product.products" :key="index">
            <ProductCardThin v-if="product.isSuperProduct" :product="pc" />
          </div>
          <section
            v-if="product?.people" class="secondary-section">
            <LegacyTemplatesPeopleSection :people="product.people" />
          </section>
        </div>
      </div>
    </div>
  </section>
  <!-- Publication Page -->
  <article v-else-if="publication" class="article">
    <div class="wrapper wrapper--no-hero">
      <section :class="['prose', `prose--${publication.theme || 'default'}`]">
        <LegacyMoleculesBreadcrumb
          v-if="publication?.breadcrumbs"
          :breadcrumbs="publication.breadcrumbs"
        />
        <hgroup class="prose__headers">
          <h1 class="prose__main-heading" v-if="publication?.heading">{{ publication.heading }}</h1>
          <h2 class="prose__secondary-heading" v-if="publication?.subheading">{{ publication.subheading }}</h2>
          <p v-if="publication?.byLine" class="prose__byline-open">
            {{ publication.byLine }}
          </p>
        </hgroup>
 
        <div v-if="publication?.content" class="prose__body">
          <p v-if="publication.excerpt" class="prose__intro">{{ publication.excerpt }}</p>
          <div class="prose__content" v-html="publication.content"></div>
        </div>
      </section>

    </div>
  </article>

  <!-- Video Page -->
  <article v-else-if="video" class="article">
    <div class="wrapper wrapper--no-hero">
      <section :class="['prose', `prose--${video.theme || 'default'}`]">
        <LegacyMoleculesBreadcrumb
          v-if="video?.breadcrumbs"
          :breadcrumbs="video.breadcrumbs"
        />
        <hgroup class="prose__headers">
          <h1 class="prose__main-heading" v-if="video?.heading">{{ video.heading }}</h1>
          <h2 class="prose__secondary-heading" v-if="video?.subheading">{{ video.subheading }}</h2>
          <p v-if="video?.byLine" class="prose__by-line">
            {{ video.byLine }}
          </p>
        </hgroup>
  
        <div v-if="video?.videoUrl" class="video-section wrapper">
          <figure class="video-section__frame">
            <iframe
              class="iframe-video"
              :src="video.videoUrl"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </figure>
        </div>
        <div v-if="video?.content" class="prose__body">
          <p v-if="video.excerpt" class="prose__intro">{{ video.excerpt }}</p>
          <div class="prose__content" v-html="video.content"></div>
        </div>
      </section>
    </div>
  </article>

  <!-- Infographic Page -->
  <article v-else-if="infographic" class="article">
    <div class="wrapper wrapper--no-hero">
      <section :class="['prose', `prose--${infographic.theme || 'default'}`]">
        <LegacyMoleculesBreadcrumb
          v-if="infographic?.breadcrumbs"
          :breadcrumbs="infographic.breadcrumbs"
        />
  
        <hgroup class="prose__headers">
          <h1 class="prose__main-heading" v-if="infographic?.heading">{{ infographic.heading }}</h1>
          <h2 class="prose__secondary-heading" v-if="infographic?.subheading">{{ infographic.subheading }}</h2>
          <p v-if="infographic?.byLine" class="prose__by-line">
            {{ infographic.byLine }}
          </p>
        </hgroup>
  
        <div
          v-if="infographic?.content"
          class="prose__body"
          v-html="infographic.content"
        ></div>
  
        <figure v-if="infographic?.infographic" class="prose__infographic" style="text-align: center;">
          <NuxtImg
            v-if="infographic?.image?.url"
            :src="infographic.image.url"
            :alt="infographic.image.title"
            loading="lazy"
          />
          <p>
            <a
              :href="infographic.infographic"
              class="button button--secondary"
              target="_blank"
            >
              Download Original
            </a>
          </p>
        </figure>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useSuperProduct } from '~/composables/data/useSuperProduct'
import { useProduct } from '~/composables/data/useProduct'
import { usePublication } from '~/composables/data/usePublication'
import { useVideo } from '~/composables/data/useVideo'
import { useInfographic } from '~/composables/data/useInfographic'
import LegacyMoleculesProductHero from '~/components/legacy/molecules/ProductHero.vue'
import LegacyTemplatesPeopleSection from '~/components/legacy/templates/PeopleSection.vue'
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'

definePageMeta({
  layout: 'legacy-base',
  name: 'content-slug',
})

const spData = useSuperProduct()
const productData = useProduct()
const publication = usePublication()
const video = useVideo()
const infographic = useInfographic()

const product  = computed(() => {
  if(!spData.value) {
    return productData.value
  }
  return spData.value
})

useHead({
  title: computed(() => {
    if (product.value) {
      return `${product.value.heading} | ${product.value.workstream} | Bertelsmann Foundation`
    }
    if (publication.value) {
      return `${publication.value.heading} | Bertelsmann Foundation`
    }
    if (video.value) {
      return `${video.value.heading} | Bertelsmann Foundation`
    }
    if (infographic.value) {
      return `${infographic.value.heading} | Bertelsmann Foundation`
    }
    return 'Content | Bertelsmann Foundation'
  }),
  meta: [
    {
      property: 'og:image',
      content: computed(() => 
        product.value?.image?.url || 
        publication.value?.image?.url || 
        video.value?.video?.thumbnail || 
        infographic.value?.image?.url ||
        '/images/bfna-og.jpg'
      ),
    },
    {
      name: 'description',
      content: computed(() => 
        product.value?.excerpt || 
        publication.value?.excerpt || 
        video.value?.excerpt || 
        infographic.value?.excerpt ||
        ''
      ),
    },
  ],
})
</script>

