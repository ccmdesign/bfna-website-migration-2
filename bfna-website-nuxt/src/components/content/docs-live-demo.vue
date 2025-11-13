<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'DocsLiveDemo'
})

const props = defineProps({
  code: {
    type: String,
    required: true
  }
})

function extractTemplate(code: string): string {
  const match = code.match(/<template[^>]*>([\s\S]*?)<\/template>/)
  return match ? match[1].trim() : code
}

// Simple approach: just display the code as HTML for now
const demoHtml = computed(() => {
  try {
    const template = extractTemplate(props.code)
    // Basic HTML sanitization - just remove script tags
    return template.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  } catch (error) {
    return '<div class="demo-error">Error processing demo code</div>'
  }
})
</script>

<template>
  <div class="live-demo">
    <!-- For now, render as HTML. In a full implementation, we'd compile to actual Vue components -->
    <div
      class="demo-content"
      v-html="demoHtml"
    />

    <!-- Future: Use actual Vue component compilation -->
    <!-- <component :is="dynamicComponent" /> -->
  </div>
</template>

<style scoped>
.live-demo {
  border: 1px solid var(--color-base);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
  min-height: 60px;
  padding: var(--space-m);
}

.demo-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.demo-error {
  color: var(--color-fail);
  font-style: italic;
  padding: var(--space-s);
  background-color: var(--color-fail);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
}

.demo-placeholder {
  color: var(--color-secondary);
  font-style: italic;
}

/* Style common demo elements */
.demo-content :deep(button) {
  margin: var(--space-2xs);
}

.demo-content :deep(.ccm-button) {
  margin: var(--space-2xs);
}
</style>

