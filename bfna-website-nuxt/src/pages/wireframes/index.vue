<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- Announcement bar (Directus announcements singleton, real data) -->
      <section v-if="banner" class="wf-slot" data-compact data-label="Announcement">
        <div class="center | cluster" data-gap="s">
          <a :href="banner.url" data-external><strong>{{ banner.message }}</strong></a>
        </div>
      </section>

      <!-- `home` row in pages.json: GGS value prop + Irene's About Us opening (placeholder until Irene confirms) -->
      <wf-hero :heading="home?.heading" :description="home?.description">
        <!-- "Get our newsletter" removed — no newsletter exists (Irene, Aug 5).
             Label matches the programme hubs: Irene asked for "Explore our work"
             on Democracy (#59) and TR&GC (#63), and proposed the same here (#43). -->
        <NuxtLink to="/wireframes/democracy" class="wf-button" data-variant="primary">Explore our work</NuxtLink>
      </wf-hero>
    </template>

    <!-- Zone 2: Focus programs (GGS order: identity first) -->
    <wf-section label="Programs" heading="Our Programs">
      <ul class="switcher" data-gap="m">
        <wf-card-program v-for="a in areaCards" :key="a.slug" :program="a" />
      </ul>
    </wf-section>

    <!-- Zone 3: Featured projects -->
    <wf-section label="Featured projects" heading="Projects">
      <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-project v-for="p in featuredProjects()" :key="p.slug" :project="p" media :chips="false" :excerpt-length="160" />
      </ul>
      <p><NuxtLink to="/wireframes/projects"><strong>All projects →</strong></NuxtLink></p>
    </wf-section>

    <!-- Zone 4: Insights (highlights folded in as featured strip) -->
    <wf-section label="Insights" heading="Insights">
      <!-- The Transponder issue leads the grid as a full-width "special" card
           instead of sitting in its own band above (Claudio, Sep 2). -->
      <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-product v-for="prod in products" :key="prod.slug" :product="prod" />
        <wf-card-featured v-for="h in featured" :key="h.slug" :item="h" />
      </ul>
      <wf-grid-insights :insights="latest" :excerpt-length="160" :extra-chips="i => i.program ? [shortArea(i.program)] : []" />
      <p><NuxtLink to="/wireframes/insights"><strong>All insights →</strong></NuxtLink></p>
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { active, highlights, featuredProjects, programs, announcement, homePage, allProducts } = useWfContent()

const banner = announcement()
const home = homePage()
const featured = highlights().slice(0, 4)
const latest = active.slice(0, 6)
const products = allProducts()

// Card tagline = first sentence of the area intro (dataset copy, Irene Jul 29)
const areaCards = programs().map(a => ({
  slug: a.slug,
  name: a.name,
  short: a.slug === 'transatlantic-relations-global-challenges' ? 'Transatlantic Relations' : a.name,
  tagline: (a.intro ?? '').split(/(?<=\.)\s/)[0] || null
}))

const shortArea = (a: string) =>
  a === 'Transatlantic Relations & Global Challenges' ? 'Transatlantic Rel.' : a.startsWith('RE-TAG') || a.startsWith('PENDING') ? 'Re-tag' : a
</script>
