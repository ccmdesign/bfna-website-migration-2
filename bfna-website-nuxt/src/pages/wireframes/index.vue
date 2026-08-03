<template>
  <div class="stack" data-gap="xl">
    <!-- Announcement bar (Directus announcements singleton, real data) -->
    <section v-if="banner" class="wf-slot" data-compact data-label="Announcement">
      <div class="center | cluster" data-gap="s">
        <a :href="banner.url" data-external><strong>{{ banner.message }}</strong></a>
      </div>
    </section>

    <!-- Zone 1: Hero -->
    <!-- `home` row in pages.json: GGS value prop + Irene's About Us opening (placeholder until Irene confirms) -->
    <wf-hero :heading="home?.heading" :description="home?.description">
      <NuxtLink to="/wireframes/democracy" class="wf-button" data-variant="primary">Explore our programs</NuxtLink>
      <NuxtLink to="#subscribe" class="wf-button">Get our newsletter</NuxtLink>
    </wf-hero>

    <!-- Zone 2: Focus programs (GGS order: identity first) -->
    <wf-section label="Programs" heading="Our Programs">
      <div class="switcher" data-gap="m">
        <wf-card-program v-for="a in areaCards" :key="a.slug" :program="a" />
      </div>
    </wf-section>

    <!-- Zone 3: Featured projects -->
    <wf-section label="Featured projects" heading="Projects">
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-project v-for="p in featuredProjects()" :key="p.slug" :project="p" media :chips="false" :excerpt-length="160" />
      </div>
      <p><NuxtLink to="/wireframes/projects"><strong>All projects →</strong></NuxtLink></p>
    </wf-section>

    <!-- Zone 4: Insights (highlights folded in as featured strip) -->
    <wf-section label="Insights" heading="Insights">
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-featured v-for="h in featured" :key="h.slug" :item="h" />
      </div>
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
        <wf-card-insight
          v-for="i in latest" :key="i.slug" :insight="i"
          :extra-chips="i.program ? [shortArea(i.program)] : []"
          excerpt :excerpt-length="160"
        />
      </div>
      <p><NuxtLink to="/wireframes/insights"><strong>All insights →</strong></NuxtLink></p>
    </wf-section>

    <!-- Zone 5: Subscribe -->
    <section id="subscribe" class="wf-slot" data-label="Subscribe CTA">
      <form class="center | stack" data-gap="s" style="padding-block: var(--space-l);" @submit.prevent>
        <h2>Subscribe to receive our updates &amp; newsletters</h2>
        <p>Enter your email and customize your preferences.</p>
        <div class="cluster" data-gap="s">
          <input type="email" placeholder="you@example.org" aria-label="Email address" required>
          <button type="submit" class="wf-button" data-variant="primary">Subscribe</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { active, highlights, featuredProjects, programs, announcement, homePage } = useWfContent()

const banner = announcement()
const home = homePage()
const featured = highlights().slice(0, 4)
const latest = active.slice(0, 6)

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
