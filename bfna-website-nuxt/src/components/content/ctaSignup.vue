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
    <h2>Signup for our newsletter</h2>
    <p>Get the latest analysis and design thinking from our team, delivered straight to your inbox. We share practical advice for organizations looking to increase their impact.</p>
    <form class="form">
      <fieldset class="form-fieldset" inline>
        <input type="email" label="Email" placeholder="Email" />
        <input type="submit" label="Subscribe" />
      </fieldset>
    </form>
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
  --_prose-section-background-color: var(--color-accent);
  --_prose-section-foreground-color: var(--color-base);
}

.tldr-section { 
  margin-block: var(--space-xl);
  padding: var(--_prose-section-padding);
  background-color: var(--_prose-section-background-color);
  color: var(--_prose-section-foreground-color);
  box-sizing: content-box;
  margin-inline: calc(var(--_prose-section-padding) * -1);
}

</style>
