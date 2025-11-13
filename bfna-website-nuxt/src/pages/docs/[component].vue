<script setup lang="ts">
definePageMeta({
  redirect: to => {
    const component = Array.isArray(to.params.component) ? to.params.component[0] : to.params.component
    if (!component) {
      return '/docs'
    }
    return `/docs/components/${component}`
  }
})
</script>

<template>
  <div />
</template>
