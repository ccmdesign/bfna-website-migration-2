<template>
  <div class="topbar | cluster">
    <h1 class="topbar__title | h3">
      <!-- Slot: logo — Branding/logo area. Defaults to a site name link. -->
      <slot name="logo"><nuxt-link to="/">site name</nuxt-link></slot>
    </h1>
    <nav role="navigation" class="margin-left:auto">
      <ul class="menu | cluster">
        <li><nuxt-link class="menu__item" to="/">Home</nuxt-link></li>
        <li><nuxt-link class="menu__item" to="/blog">Insights</nuxt-link></li>
        <li><nuxt-link class="menu__item" to="/docs">Docs</nuxt-link></li>
        <li><nuxt-link class="menu__item" to="/test">Test</nuxt-link></li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
/**
 * Topbar navigation component providing site header with logo and main navigation.
 *
 * A horizontal navigation bar component that displays the site logo/branding on the left
 * and primary navigation links on the right. Uses CUBE CSS cluster utility for flexible
 * layout. Includes semantic HTML with proper navigation role for accessibility.
 *
 * The logo slot allows custom branding content, defaulting to a site name link. Navigation
 * menu items use semantic link styling with hover states. Designed to work seamlessly
 * within layout components like ccmHero or standalone in page headers.
 *
 * @component ccmTopbar
 * @category organism
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmTopbar />
 *
 * @example Custom Logo
 * <ccmTopbar>
 *   <template #logo>
 *     <nuxt-link to="/">
 *       <img src="/logo.svg" alt="Site Logo" />
 *     </nuxt-link>
 *   </template>
 * </ccmTopbar>
 *
 * @example In Hero Layout
 * <ccmHero>
 *   <template #top-bar>
 *     <ccmTopbar />
 *   </template>
 *   <h1>Page Title</h1>
 * </ccmHero>
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})
</script>

<style scoped>

.topbar {
  width: 100%;
}

.topbar__title {
  padding-block: var(--space-xs);
  
  * { 
    text-decoration: none; 
    color: var(--link-color);
  }

  &:visited {
    color: var(--link-color-visited);
  }
}

.menu__item {
  color: var(--color-base);
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

li:not(:first-child) .menu__item { padding-inline-start: var(--space-xs); 
}
</style>