<!-- One menu item — shared by nav dropdowns and footer columns so both render
     the same WfMenuItem data identically. -->
<script setup lang="ts">
import type { WfMenuItem } from '~/composables/useWfContent'
defineProps<{ item: WfMenuItem }>()
</script>

<template>
  <NuxtLink v-if="item.to" :to="item.to">
    <strong v-if="item.strong">{{ item.label }}</strong>
    <template v-else>{{ item.label }}</template>
  </NuxtLink>
  <a v-else :href="item.href ?? '#'" data-external>{{ item.label }}</a>
</template>
