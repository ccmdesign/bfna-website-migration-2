<template>
  <header class="wf-header">
    <nav class="wf-nav | center cluster" aria-label="Main" data-gap="s">
      <NuxtLink to="/wireframes" class="wf-nav__logo">
        <strong>BFNA</strong>
      </NuxtLink>

      <details class="wf-nav__group" @toggle="closeOthers">
        <summary>About</summary>
        <ul>
          <li><NuxtLink to="/wireframes/about">Mission</NuxtLink></li>
          <li><NuxtLink to="/wireframes/about#board">Board of Directors</NuxtLink></li>
          <li><NuxtLink to="/wireframes/about#team">Team</NuxtLink></li>
          <li><a href="#" data-external>Bertelsmann Stiftung</a></li>
          <li><NuxtLink to="/wireframes/about#contact">Contact</NuxtLink></li>
        </ul>
      </details>

      <details class="wf-nav__group" @toggle="closeOthers">
        <summary>Programs</summary>
        <ul>
          <li v-for="a in programs()" :key="a.slug"><NuxtLink :to="`/wireframes/${a.slug}`">{{ a.name }}</NuxtLink></li>
        </ul>
      </details>

      <details class="wf-nav__group" @toggle="closeOthers">
        <summary>Projects</summary>
        <ul>
          <li v-for="p in navProjects" :key="p.slug"><NuxtLink :to="`/wireframes/projects/${p.slug}`">{{ p.heading }}</NuxtLink></li>
          <li><NuxtLink to="/wireframes/projects"><strong>All Projects →</strong></NuxtLink></li>
        </ul>
      </details>

      <details class="wf-nav__group" @toggle="closeOthers">
        <summary>Insights</summary>
        <ul>
          <li><NuxtLink to="/wireframes/insights">All Insights</NuxtLink></li>
          <li><NuxtLink to="/wireframes/insights?format=article">Articles</NuxtLink></li>
          <li><NuxtLink to="/wireframes/insights?format=report">Reports</NuxtLink></li>
          <li><NuxtLink to="/wireframes/insights?format=video">Videos</NuxtLink></li>
          <li><NuxtLink to="/wireframes/insights?format=infographic">Infographics</NuxtLink></li>
          <li><NuxtLink to="/wireframes/archive"><strong>Archive</strong></NuxtLink></li>
        </ul>
      </details>

      <NuxtLink to="/wireframes/search" class="wf-nav__search">Search</NuxtLink>
      <NuxtLink to="/wireframes/#subscribe" class="wf-button">Subscribe</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
// "Projects" per Irene's wording (Q1 signal). Dropdown = flagships only;
// links go to on-site project pages (Q4 resolved) — external ↗ lives on the page CTA.
const { programs, navProjects: navProjectList } = useWfContent()
const navProjects = navProjectList()

// Native <details> dropdowns — keyboard-accessible. Only one open at a time:
function closeOthers(e: Event) {
  const self = e.target as HTMLDetailsElement
  if (!self.open) return
  for (const d of self.parentElement?.querySelectorAll('details[open]') ?? []) {
    if (d !== self) (d as HTMLDetailsElement).open = false
  }
}
</script>
