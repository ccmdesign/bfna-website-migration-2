<template>
  <footer class="wf-footer">
    <div class="center | stack" data-gap="l">
      <div class="grid" data-min-width="xs" data-gap="l">
        <div class="stack" data-gap="xs">
          <p><strong>BFNA</strong></p>
          <p>Bertelsmann Foundation North America</p>
          <p><NuxtLink to="/wireframes/search">Search</NuxtLink></p>
          <p><NuxtLink to="/wireframes/#subscribe" class="wf-button">Subscribe</NuxtLink></p>
        </div>

        <nav class="stack" data-gap="xs" aria-label="Footer — About">
          <p><strong>About</strong></p>
          <ul class="stack" data-gap="2xs">
            <li><NuxtLink to="/wireframes/about">Mission</NuxtLink></li>
            <li><NuxtLink to="/wireframes/about#board">Board of Directors</NuxtLink></li>
            <li><NuxtLink to="/wireframes/about#team">Team</NuxtLink></li>
            <li><a href="#" data-external>Bertelsmann Stiftung</a></li>
            <li><NuxtLink to="/wireframes/about#contact">Contact</NuxtLink></li>
          </ul>
        </nav>

        <nav class="stack" data-gap="xs" aria-label="Footer — Programs">
          <p><strong>Programs</strong></p>
          <ul class="stack" data-gap="2xs">
            <li v-for="a in programs()" :key="a.slug"><NuxtLink :to="`/wireframes/${a.slug}`">{{ a.name }}</NuxtLink></li>
          </ul>
        </nav>

        <nav class="stack" data-gap="xs" aria-label="Footer — Projects">
          <p><strong>Projects</strong></p>
          <ul class="stack" data-gap="2xs">
            <li v-for="p in navProjects()" :key="p.slug"><NuxtLink :to="`/wireframes/projects/${p.slug}`">{{ p.heading }}</NuxtLink></li>
            <li><NuxtLink to="/wireframes/projects"><strong>All Projects →</strong></NuxtLink></li>
          </ul>
        </nav>

        <nav class="stack" data-gap="xs" aria-label="Footer — Insights">
          <p><strong>Insights</strong></p>
          <ul class="stack" data-gap="2xs">
            <li><NuxtLink to="/wireframes/insights">All Insights</NuxtLink></li>
            <li><NuxtLink to="/wireframes/insights?format=article">Articles</NuxtLink></li>
            <li><NuxtLink to="/wireframes/insights?format=report">Reports</NuxtLink></li>
            <li><NuxtLink to="/wireframes/insights?format=video">Videos</NuxtLink></li>
            <li><NuxtLink to="/wireframes/insights?format=infographic">Infographics</NuxtLink></li>
            <li><NuxtLink to="/wireframes/archive"><strong>Archive</strong></NuxtLink></li>
          </ul>
        </nav>
      </div>

      <ul class="cluster" data-gap="s" aria-label="Social media">
        <li v-for="s in socials" :key="s.name"><a :href="s.url" data-external>{{ s.name }}</a></li>
      </ul>

      <div class="cluster" data-gap="m">
        <p>© {{ new Date().getFullYear() }} Copyright Bertelsmann Foundation.</p>
        <p><a href="#">Privacy Policy</a></p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { programs, navProjects } = useWfContent()

// Real social profiles (static-content.json, legacy Frame)
const socials = [
  { name: 'Facebook', url: 'https://www.facebook.com/BertelsmannFoundation/' },
  { name: 'Twitter', url: 'https://twitter.com/BertelsmannFdn' },
  { name: 'YouTube', url: 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg' },
  { name: 'Instagram', url: 'https://www.instagram.com/bertelsmannfoundation/' },
  { name: 'Vimeo', url: 'https://vimeo.com/bfna' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.' }
]
</script>
