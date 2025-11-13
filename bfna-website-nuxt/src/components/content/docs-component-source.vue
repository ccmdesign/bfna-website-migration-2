<script setup lang="ts">
defineOptions({
  name: 'DocsComponentSource'
})

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const sourceCode = ref<string>('')
const loading = ref(true)

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    const button = document.querySelector('.copy-button') as HTMLButtonElement
    if (button) {
      const originalText = button.textContent || ''
      button.textContent = 'Copied!'
      button.classList.add('copied')

      setTimeout(() => {
        button.textContent = originalText
        button.classList.remove('copied')
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

onMounted(() => {
  loading.value = false
  const lines = [
    `// Component: ${props.name}.vue`,
    '// This is a placeholder for the actual source code',
    '// In production, this would load the real component file',
    '',
    '<template>',
    `  <div class="${props.name}">`,
    '    <!-- Component template goes here -->',
    '  </div>',
    '</template>',
    '',
    '<script setup lang="ts">',
    '// Component script goes here',
    'defineProps({',
    '  // Component props',
    '})',
    '</' + 'script>',
    '',
    '<style scoped>',
    '/* Component styles go here */',
    '</style>'
  ]
  sourceCode.value = lines.join('\n')
})
</script>

<template>
  <div class="component-source">
    <div v-if="loading" class="loading">
      <p>Loading source code...</p>
    </div>

    <div v-else class="source-container">
      <div class="source-header | cluster">
        <h4 split-right>{{ name }}.vue</h4>
        <ccm-button
          variant="ghost"
          size="s"
          @click="copyToClipboard(sourceCode)"
          title="Copy source code"
        >
          Copy
        </ccm-button>
      </div>

      <pre class="source-code"><code>{{ sourceCode }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.component-source {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background-color: var(--color-background);
}

.loading {
  padding: var(--space-m);
  text-align: center;
}

.source-container {
  display: grid;
  gap: 0;
  background-color: var(--color-base-tint-05);
  border-bottom: 1px solid var(--color-base-tint-10);
  border-radius: var(--radius-m);
}

.source-header {
  padding: var(--space-s) var(--space-m);
}

.source-header h4 {
  margin: 0;
  color: var(--color-base-60-tint);
}

.copy-button {
  padding: var(--space-3xs) var(--space-2xs);
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--size--2);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: var(--color-secondary);
}

.copy-button.copied {
  background-color: var(--color-success);
}

.source-code {
  margin: 0;
  padding: var(--space-m);
  background-color: var(--color-code-background);
  color: var(--color-code-text);
  font-family: var(--font-family-mono);
  font-size: var(--size--1);
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  tab-size: 2;
}
</style>

