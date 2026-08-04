<!-- Chip: span by default, link when `to`/`href` given. `active` = selected filter. -->
<script setup lang="ts">
defineProps<{
  to?: string | Record<string, unknown>  // string path or route object (filter links)
  href?: string
  external?: boolean
  active?: boolean
}>()
</script>

<template>
  <NuxtLink v-if="to" :to="to" class="wf-chip" :style="active ? 'background:#222;color:#fff' : undefined"><slot /></NuxtLink>
  <a v-else-if="href" :href="href" class="wf-chip" :data-external="external || undefined"><slot /></a>
  <span v-else class="wf-chip"><slot /></span>
</template>
