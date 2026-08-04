<!-- Footer: brand + search row → 4 menu columns (shared MENUS data, same as the
     top bar) → centered social strip → right-aligned legal strip.
     Subscribe lives in the layout's global band, not here. -->
<template>
  <footer class="wf-footer">
    <div class="center | stack" data-gap="l">
      <div class="cluster" data-gap="s" style="justify-content: space-between; align-items: baseline;">
        <div>
          <p><strong>BFNA</strong></p>
          <p>Bertelsmann Foundation North America</p>
        </div>
        <p><NuxtLink to="/wireframes/search">Search</NuxtLink></p>
      </div>

      <div class="grid" data-gap="l" style="grid-template-columns: repeat(4, 1fr);">
        <nav v-for="m in menus()" :key="m.label" class="stack" data-gap="xs" :aria-label="`Footer — ${m.label}`">
          <p>
            <a v-if="m.href" :href="m.href" :data-external="m.external || undefined"><strong>{{ m.label }}</strong></a>
            <NuxtLink v-else-if="m.to" :to="m.to"><strong>{{ m.label }}</strong></NuxtLink>
            <strong v-else>{{ m.label }}</strong>
          </p>
          <ul v-if="m.items" class="stack" data-gap="2xs">
            <li v-for="i in m.items" :key="i.label"><wf-menu-link :item="i" /></li>
          </ul>
        </nav>
      </div>

      <ul class="cluster" data-gap="s" aria-label="Social media" style="justify-content: center;">
        <li v-for="s in socials" :key="s.name"><a :href="s.url" data-external>{{ s.name }}</a></li>
      </ul>

      <div class="cluster" data-gap="m" style="justify-content: space-between;">
        <div class="cluster" data-gap="m">
          <p>© {{ new Date().getFullYear() }} Copyright Bertelsmann Foundation.</p>
          <p><a href="#">Privacy Policy</a></p>
        </div>
        <p>Site by <a href="https://ccm.design" data-external>ccm.design</a></p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { menus } = useWfContent()

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
