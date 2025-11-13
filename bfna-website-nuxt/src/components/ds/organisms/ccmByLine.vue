<template>
    <div class="by-line | cluster">
      <span>© {{ new Date().getFullYear() }} CCM Design</span>
      <a href="#" class="margin-left:auto">by ccm.design</a>
    </div>
</template>

<script setup lang="ts">
/**
 * Footer byline component displaying copyright and attribution information.
 *
 * A simple, horizontal layout component that combines copyright notice with a link
 * to the designer's site. Uses the cluster layout utility for automatic spacing
 * and aligns the attribution link to the right. Ideal for page footers.
 *
 * Currently displays fixed content with dynamic year calculation. The cluster
 * layout provides responsive spacing between copyright text and attribution link.
 *
 * @component ccmByLine
 * @category ds-component
 * @standards all-10
 *
 * @example Basic Footer Usage
 * <ccmByLine />
 *
 * @example In Footer Layout
 * <footer class="bg-neutral padding:l">
 *   <ccmByLine />
 * </footer>
 *
 * @example With Custom Wrapper Styling
 * <div class="container max-width:l">
 *   <ccmByLine />
 * </div>
 *
 * @example In Dark Theme Footer
 * <footer class="bg-dark color-light padding-block:xl">
 *   <ccmByLine />
 * </footer>
 */
defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})
</script>

<style scoped>
a {
  color: var(--link-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

a:visited {
  color: var(--link-color-visited);
}
</style>
