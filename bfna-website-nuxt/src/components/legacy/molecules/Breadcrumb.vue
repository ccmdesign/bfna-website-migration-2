<template>
  <div class="breadcrumbs">
    <template v-for="(item, index) in breadcrumbs.items" :key="index">
      <NuxtLink class="breadcrumbs__page-link" :to="item.link">{{ item.title }}</NuxtLink>
      <svg
        class="breadcrumbs__divider"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
        />
      </svg>
    </template>
    <span class="breadcrumbs__current-page">{{ breadcrumbs.currentPage }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  breadcrumbs: {
    currentPage: string
    items: Array<{
      link: string
      title: string
    }>
  }
}>()
</script>

