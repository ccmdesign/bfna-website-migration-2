<script setup lang="ts">
definePageMeta({
  layout: 'docs-layout'
})

const route = useRoute()
const slugParam = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

const { data: doc } = await useAsyncData(`component-doc-${slugParam}`, () => {
  return queryCollection('componentDocs').path(`/docs/components/${slugParam}`).first()
})

useHead({
  title: doc.value?.title || doc.value?.componentId || 'Component Documentation',
  meta: [
    {
      name: 'description',
      content: doc.value?.description || 'Design system component documentation'
    }
  ]
})

const heroState = useState('hero', () => null)

if (doc.value) {
  const hero = doc.value.hero || {}
  heroState.value = {
    brow: hero.brow || 'Component Docs',
    title: hero.title || doc.value.title || doc.value.componentId,
    tagline: hero.tagline || doc.value.description,
    backgroundColor: hero.backgroundColor || 'transparent',
    size: hero.size || 'l',
    hideTopbar: hero.hideTopbar === true
  }
} else {
  heroState.value = {
    brow: 'Component Docs',
    title: 'Component not found',
    tagline: `No documentation exists for ${slugParam}`,
    backgroundColor: 'transparent',
    size: 'l',
    hideTopbar: false
  }
}
</script>

<template>
  <ccm-section full-width>
    <div class="prose-layout | prose">
      <ContentRenderer v-if="doc" :value="doc" class="prose" />
      <div v-else class="docs-components__missing | stack" data-space="2xs">
        <h1>Component documentation missing</h1>
        <p>The requested component overview has not been authored yet.</p>
        <NuxtLink to="/docs">← Back to Documentation</NuxtLink>
      </div>
    </div>
  </ccm-section>
</template>

<style scoped>
.docs-components__missing {
  padding: var(--space-l);
  border-radius: var(--radius-l);
  background-color: var(--color-base-tint-05);
}
</style>

