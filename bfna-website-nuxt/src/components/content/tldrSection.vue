<template>
  <section 
    class="tldr-section"
    :size="size"
    :background-color="backgroundColor"
    :foreground-color="foregroundColor"
    :style="{
      '--_prose-section-background-color': `var(--${backgroundColor})`,
      '--_prose-section-foreground-color': `var(--${foregroundColor})`,
      '--_prose-section-padding-block': `var(--space-${size})`
    }"
    >
    <slot />
  </section>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: ''
  },
  backgroundColor: {
    type: String,
    default: ''
  },
  foregroundColor: {
    type: String,
    default: 'color-base'
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.tldr-section {
  --_prose-section-padding: var(--space-m);
  --_prose-section-background-color: var(--color-base-tint-05);
  --_prose-section-foreground-color: var(--color-base);
}

.tldr-section { 
  padding: var(--_prose-section-padding);
  background-color: var(--_prose-section-background-color);
  color: var(--_prose-section-foreground-color);
  box-sizing: content-box;
  margin-inline: calc(var(--_prose-section-padding) * -1);
}

</style>
