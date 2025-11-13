<template>
  <div class="wrapper">
    <h1>Base Layout Test Page</h1>
    <p>This page uses the base layout to verify Frame and Footer render correctly.</p>
    <p>If you can see the navigation (Frame) at the top and the footer at the bottom, the base layout is working correctly.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'base',
})

useHead({
  title: 'Base Layout Test | Bertelsmann Foundation',
})
</script>

