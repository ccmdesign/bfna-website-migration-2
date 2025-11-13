<template>
  <ccm-section full-width>
    <div class="prose-layout | prose">
      <ContentRenderer v-if="doc" :value="doc" class="prose" />
      <div v-else>
        <h1>Document not found</h1>
        <NuxtLink to="/docs">← Back to Documentation</NuxtLink>
      </div>
    </div>
  </ccm-section>
</template>

<script setup>
definePageMeta({
  layout: 'docs-layout'
})

const route = useRoute()
// Join the slug array to form the full path
const slugPath = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug

const { data: doc } = await useAsyncData(`docs-${slugPath}`, () => {
  return queryCollection('docs').path(`/docs/${slugPath}`).first()
})

useHead({
  title: doc.value?.title || 'Documentation',
  meta: [
    { name: 'description', content: doc.value?.description || 'Component and utility documentation' }
  ]
})

const heroState = useState('hero', () => null)
if (doc.value?.hero) {
  heroState.value = {
    brow: doc.value.hero.brow || 'Documentation',
    title: doc.value.hero.title || doc.value.title,
    tagline: doc.value.hero.tagline || doc.value.description,
    backgroundColor: doc.value.hero.backgroundColor || 'transparent',
    size: doc.value.hero.size || 'l',
    hideTopbar: doc.value.hero.hideTopbar === true
  }
} else {
  heroState.value = {
    brow: 'Documentation',
    title: doc.value?.title || 'Documentation',
    tagline: doc.value?.description,
    backgroundColor: 'transparent',
    size: 'l',
    hideTopbar: false
  }
}
</script>

<style scoped>

</style>


