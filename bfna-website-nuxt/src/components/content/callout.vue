<template>
  <div>
    <slot />
  </div>
</template>

<script setup>
// Simple component with just one prop example
defineProps({
  type: {
    type: String,
    default: 'info'
  }
})
</script>

<style scoped>
.callout {
  
}
</style>
