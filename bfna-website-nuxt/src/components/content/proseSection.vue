<template>
  <section 
    class="prose-section"
    :size="size"
    :full-width="fullWidth"
    :background-color="backgroundColor"
    :foreground-color="foregroundColor"
    :style="{
      '--_prose-section-background-color': `var(--${backgroundColor})`,
      '--_prose-section-foreground-color': `var(--${foregroundColor})`,
      '--_prose-section-padding-block': `var(--space-${size})`
    }"
    >
    <div :class="['prose-section__content', { center: fullWidth === false }]">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'xl'
  },
  backgroundColor: {
    type: String,
    default: 'transparent'
  },
  foregroundColor: {
    type: String,
    default: '--color-base'
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.prose-section {
  --_prose-section-padding-block: var(--space-xl);
  --_prose-section-background-color: transparent;
  --_prose-section-foreground-color: var(--color-base);
}

.prose-section { 
  padding-block: var(--_prose-section-padding-block);
  background-color: var(--_prose-section-background-color);
  color: var(--_prose-section-foreground-color);
}

.prose-section__content {
  margin-inline: auto;
  max-width: var(--_prose-max-width);
  padding-inline: var(--space-xs);
  box-sizing: content-box;
}

.prose-section:nth-child(even) {
  background-color: var(--color-base-tint-02);
}
</style>
