<!-- Breadcrumb trail. Items without `to` render as the current/plain segment. -->
<script setup lang="ts">
export interface WfCrumb { label: string, to?: string }
defineProps<{ items: WfCrumb[] }>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <template v-for="(c, i) in items" :key="c.label">
      <span v-if="i"> / </span>
      <NuxtLink v-if="c.to" :to="c.to">{{ c.label }}</NuxtLink>
      <span v-else>{{ c.label }}</span>
    </template>
  </nav>
</template>
