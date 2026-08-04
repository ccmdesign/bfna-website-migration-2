<!-- Top bar: logo + menu dropdowns (shared MENUS data, same as footer) + search
     + subscribe button. -->
<template>
  <header class="wf-header">
    <nav class="wf-nav | center cluster" aria-label="Main" data-gap="s">
      <NuxtLink to="/wireframes" class="wf-nav__logo">
        <strong>BFNA</strong>
      </NuxtLink>

      <wf-nav-dropdown v-for="m in menus()" :key="m.label" :label="m.label" :items="m.items" />

      <NuxtLink to="/wireframes/search" class="wf-nav__search">Search</NuxtLink>
      <!-- Every page carries the layout's subscribe band, so this anchors locally -->
      <NuxtLink to="#subscribe" class="wf-button">Subscribe</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { menus } = useWfContent()
</script>
