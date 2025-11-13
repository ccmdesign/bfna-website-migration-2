<template>
  <div class="error-page">
    <div class="wrapper">
      <h1>{{ error.statusCode === 404 ? '404' : 'Error' }}</h1>
      <p>{{ error.statusCode === 404 ? 'Page not found' : 'An error occurred' }}</p>
      <NuxtLink to="/" class="button button--primary">Go to Homepage</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

useHead({
  title: props.error.statusCode === 404 ? '404 - Page Not Found' : 'Error'
})
</script>

<style scoped>
.error-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.wrapper {
  text-align: center;
}

h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.button--primary {
  background-color: hsl(199, 84%, 20%);
  color: hsl(0, 0%, 100%);
}

.button--primary:hover,
.button--primary:focus {
  background-color: hsl(199, 84%, 15%);
  color: hsl(0, 0%, 100%);
}
</style>

