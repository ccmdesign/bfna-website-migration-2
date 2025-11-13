<script setup lang="ts">
defineOptions({
  name: 'DocsCodeBlock'
})

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'vue'
  },
  title: {
    type: String,
    default: ''
  },
  showCopy: {
    type: Boolean,
    default: true
  }
})

const copySuccess = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.code)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}
</script>

<template>
  <div class="code-block">
    <!-- Header -->
    <div v-if="title || showCopy" class="code-header">
      <div v-if="title" class="code-title">
        <h4>{{ title }}</h4>
        <span class="language-badge">{{ language }}</span>
      </div>
      <button
        v-if="showCopy"
        class="copy-button"
        @click="copyToClipboard"
        :class="{ 'copied': copySuccess }"
      >
        {{ copySuccess ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <!-- Code -->
    <pre class="code-content"><code :class="`language-${language}`">{{ code }}</code></pre>
  </div>
</template>

<style scoped>
.code-block {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background-color: var(--color-code-background);
  border: 1px solid var(--color-base);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-s) var(--space-m);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-base);
}

.code-title {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.code-title h4 {
  margin: 0;
  font-size: var(--size-0);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

.language-badge {
  padding: var(--space-3xs) var(--space-2xs);
  background-color: var(--color-secondary);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--2);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
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

.code-content {
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

/* Basic syntax highlighting for common languages */
.code-content :deep(.token.tag) {
  color: var(--color-code-keyword);
}

.code-content :deep(.token.attr-name) {
  color: var(--color-code-property);
}

.code-content :deep(.token.attr-value) {
  color: var(--color-code-string);
}

.code-content :deep(.token.comment) {
  color: var(--color-code-comment);
  font-style: italic;
}

.code-content :deep(.token.keyword) {
  color: var(--color-code-keyword);
  font-weight: var(--font-weight-medium);
}

.code-content :deep(.token.string) {
  color: var(--color-code-string);
}

.code-content :deep(.token.number) {
  color: var(--color-code-number);
}

.code-content :deep(.token.function) {
  color: var(--color-code-function);
}

.code-content :deep(.token.operator) {
  color: var(--color-code-operator);
}

.code-content :deep(.token.punctuation) {
  color: var(--color-code-punctuation);
}

/* Scrollbar styling */
.code-content::-webkit-scrollbar {
  height: 8px;
}

.code-content::-webkit-scrollbar-track {
  background: var(--color-background);
}

.code-content::-webkit-scrollbar-thumb {
  background: var(--color-base);
  border-radius: var(--border-radius-sm);
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-secondary);
}
</style>

