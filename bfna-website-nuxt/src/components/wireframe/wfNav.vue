<!-- Top bar: logo + menu dropdowns (shared MENUS data, same as footer) + search.
     The Subscribe button was removed with the newsletter band (Irene, Aug 5). -->
<template>
  <header class="wf-header">
    <nav class="wf-nav | center cluster" aria-label="Main" data-gap="s">
      <NuxtLink to="/wireframes" class="wf-nav__logo">
        <strong>BFNA</strong>
      </NuxtLink>

      <template v-for="m in menus()" :key="m.label">
        <!-- Plain button (no dropdown): external/internal top-level link -->
        <a
          v-if="m.href"
          :href="m.href"
          class="wf-nav__link"
          :data-external="m.external || undefined"
        >{{ m.label }}</a>
        <NuxtLink v-else-if="m.to" :to="m.to" class="wf-nav__link">{{ m.label }}</NuxtLink>
        <wf-nav-dropdown v-else :label="m.label" :items="m.items ?? []" />
      </template>

      <NuxtLink to="/wireframes/search" class="wf-nav__search">Search</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { menus } = useWfContent()
</script>
