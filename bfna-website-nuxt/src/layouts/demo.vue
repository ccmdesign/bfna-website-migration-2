<template>
  <ccmHero>
    <hgroup>
      <h4>{{ heroAttrs.brow }}</h4>
      <h1>{{ heroAttrs.title }}</h1>
      <h3>{{ heroAttrs.tagline }}</h3>
    </hgroup>
  </ccmHero>

  <main>
    <div class="center">
      <h2>Interactive Demo</h2>
      <slot>
        <p>No demo content provided</p>
      </slot>
    </div>
  </main>
</template>

<style scoped>

</style>

<script setup lang="ts">
// Get current route to derive docs path
const route = useRoute()
const docsPath = computed(() => route.path)

// Query all docs from the docs collection
const { data: allDocs } = await useAsyncData('demo-docs', () => {
  return queryCollection('docs').all()
})

// Filter for components
const components = computed(() => {
  // Filter docs that have component implementations
  return allDocs.value?.filter(doc => doc.hasComponent === true) || []
})

// Get current component doc based on route path
const { data: currentDoc } = await useAsyncData(`demo-current-${docsPath.value}`, () => {
  return queryCollection('docs').path(docsPath.value).first()
})

// Extract hero attributes from frontmatter
const heroAttrs = computed(() => {
  const doc = currentDoc.value as any // Type assertion for frontmatter access
  if (doc?.hero) {
    return {
      brow: doc.category || 'Components',
      title: doc.hero.title || 'Component',
      tagline: doc.hero.tagline || 'Component documentation and demos'
    }
  }
  return {
    brow: 'Components',
    title: 'Component',
    tagline: 'No documentation found'
  }
})

// Extract chip attributes from frontmatter
const chipAttrs = computed(() => {
  const doc = currentDoc.value as any
  return {
    status: doc?.status || 'Unknown',
    priority: doc?.priority || 'Unknown',
    hasDocs: doc?.hasDocs !== undefined ? doc.hasDocs : false,
    published: doc?.published !== undefined ? doc.published : false
  }
})

</script>

