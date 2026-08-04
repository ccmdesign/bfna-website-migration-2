<!-- Top-bar dropdown: native <details> (keyboard-accessible), closes siblings
     so only one menu is open at a time. -->
<script setup lang="ts">
import type { WfMenuItem } from '~/composables/useWfContent'
defineProps<{ label: string, items: WfMenuItem[] }>()

function closeSiblings(e: Event) {
  const self = e.target as HTMLDetailsElement
  if (!self.open) return
  for (const d of self.parentElement?.querySelectorAll('details[open]') ?? []) {
    if (d !== self) (d as HTMLDetailsElement).open = false
  }
}
</script>

<template>
  <details class="wf-nav__group" @toggle="closeSiblings">
    <summary>{{ label }}</summary>
    <ul>
      <li v-for="i in items" :key="i.label"><wf-menu-link :item="i" /></li>
    </ul>
  </details>
</template>
