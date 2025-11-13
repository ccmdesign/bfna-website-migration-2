<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue'
import type { Component } from 'vue'

definePageMeta({
  layout: 'demo'
})

const route = useRoute()
const slugParam = computed(() => {
  const value = route.params.slug
  return Array.isArray(value) ? value.join('/') : value
})

const demoComponent = shallowRef<Component | null>(null)
const hasError = ref(false)

const loadDemo = async (slug: string) => {
  try {
    const module = await import(`~/components/docs/demos/${slug}.vue`)
    return module.default || module
  } catch (error) {
    console.warn(`[docs:demos] Failed to load demo component for ${slug}`, error)
    return null
  }
}

watchEffect(async () => {
  hasError.value = false
  const slug = slugParam.value
  if (!slug) {
    demoComponent.value = null
    return
  }
  const component = await loadDemo(slug)
  demoComponent.value = component
  if (!component) {
    hasError.value = true
  }
})

const pageTitle = computed(() => {
  if (slugParam.value) {
    return `${slugParam.value} demo`
  }
  return 'Component demo'
})

const pageDescription = computed(() => {
  return 'Interactive design system component demo'
})

useHead(() => ({
  title: pageTitle.value,
  meta: [
    {
      name: 'description',
      content: pageDescription.value
    }
  ]
}))
</script>

<template>
  <ccm-section full-width>
    <div class="docs-demo__content | stack" data-space="m">
      <component
        v-if="demoComponent"
        :is="demoComponent"
        class="docs-demo__mount"
      />
      <div v-else-if="hasError" class="docs-demo__missing | stack" data-space="2xs">
        <h1>Demo unavailable</h1>
        <p>No demo was found for <code>{{ slugParam }}</code>. Regenerate demos or check the slug.</p>
        <NuxtLink to="/docs">← Back to Documentation</NuxtLink>
      </div>
      <div v-else class="docs-demo__loading | stack" data-space="2xs">
        <h1>Loading demo…</h1>
      </div>
    </div>
  </ccm-section>
</template>

<style scoped>
.docs-demo__content {
  min-height: min(70vh, 640px);
}

.docs-demo__mount {
  height: 100%;
}

.docs-demo__missing,
.docs-demo__loading {
  padding: var(--space-l);
  border-radius: var(--radius-l);
  background-color: var(--color-base-tint-05);
}
</style>
