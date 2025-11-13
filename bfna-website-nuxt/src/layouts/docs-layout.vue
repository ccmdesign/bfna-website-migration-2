<template>
  <div class="layout">
    <slot name="hero">
      <ccm-hero
        class="layout-hero"
        background-color="color-primary-tint-20"
        size="l"
      >
        <hgroup class="stack">
          <span v-if="hero.brow">{{ hero.brow }}</span>
          <h1>{{ hero.title }}</h1>
          <p v-if="hero.tagline">{{ hero.tagline }}</p>
          <p><ccm-button is="NuxtLink" to="/docs">Back to Docs</ccm-button></p>
        </hgroup>
      </ccm-hero>
    </slot>
    <main class="layout-main">
      <slot />
    </main>
    <ccm-footer class="layout-footer" />
  </div>
</template>

<script setup>
const route = useRoute()
const heroState = useState('hero', () => null)
const hero = computed(() => route.meta.hero || heroState.value || {})
</script>

<style>
.layout {
  min-height: 100svh;
  display: grid;
  grid-template: "hero" auto "main" 1fr "footer" auto / 1fr;
}

.layout-hero {
  grid-area: hero;
}

.layout-main {
  grid-area: main;
}

.layout-footer {
  grid-area: footer;
}
</style>