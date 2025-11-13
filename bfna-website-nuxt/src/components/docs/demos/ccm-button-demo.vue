<template>
  <section class="docs-component-demo">
    <ccmButton
      v-bind="demoState.variant.props"
      v-on="demoState.events"
    />
  </section>
</template>

<script setup lang="ts">
import ccmButton from '~/components/ds/molecules/ccmButton.vue'

const promptMetadata = {
  promptId: 'component-demo',
  promptVersion: '2.0.0',
  promptRunId: 'component-demo-1762805857538',
  lastPromptRun: '2025-11-10T20:17:37.539Z'
}

const demoState = {
  variant: {
    name: 'default',
    props: {},
    tokens: [] as string[]
  },
  events: {} as Record<string, (...args: unknown[]) => void>
}

defineExpose({ promptMetadata })
</script>

<style scoped>
.docs-component-demo {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}
</style>
