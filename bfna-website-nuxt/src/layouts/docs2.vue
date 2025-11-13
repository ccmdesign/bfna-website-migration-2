<template>
  <div class="layout">
    <ccm-hero
      v-if="hero"
      class="layout-hero"
      :brow="hero.brow"
      :title="hero.title"
      :tagline="hero.tagline"
      :background-color="hero.backgroundColor"
      :size="hero.size || 'l'"
      :hideTop="hero.hideTop === true"
    />
    <main class="layout-main">
      <slot />
    </main>
    <ccm-footer class="layout-footer" />
  </div>
</template>

<script setup>
const route = useRoute()
const heroState = useState('hero', () => null)
const hero = computed(() => route.meta.hero || heroState.value)
</script>

<style>
.layout {
  min-height: 100svh;
  display: grid;
  grid-template: "hero" auto "main" 1fr "footer" auto / 1fr;
}

.layout-hero {
  grid-area: hero;
  background-color: #eee;
}

.layout-main {
  grid-area: main;
}

.layout-footer {
  grid-area: footer;
  background-color: #eee;

}
</style>

