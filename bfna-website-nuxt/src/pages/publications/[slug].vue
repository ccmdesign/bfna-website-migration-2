<template>
  <article class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="publication?.breadcrumbs"
        :breadcrumbs="publication.breadcrumbs"
      />

      <header>
        <h1 v-if="publication?.heading">{{ publication.heading }}</h1>
        <h2 v-if="publication?.subheading">{{ publication.subheading }}</h2>
        <p v-if="publication?.by_line" class="article__by-line">
          {{ publication.by_line }}
        </p>
      </header>

      <div
        v-if="publication?.content"
        class="article__content"
        v-html="publication.content"
      ></div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { usePublications } from '~/composables/data/usePublications'
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const { data: publicationsData } = usePublications()

const publication = computed(() => {
  if (!publicationsData.value?.items) return null
  const slug = route.params.slug as string
  return publicationsData.value.items.find(
    (p: any) => p.button?.url?.replace(/^\//, '').replace(/\/$/, '') === slug
  )
})

useHead({
  title: computed(() => {
    if (!publication.value) return 'Publication | Bertelsmann Foundation'
    return `${publication.value.heading} | Bertelsmann Foundation`
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => publication.value?.excerpt || ''),
    },
  ],
})
</script>

