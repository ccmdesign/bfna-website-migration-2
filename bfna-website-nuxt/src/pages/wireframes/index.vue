<template>
  <div class="stack" data-gap="xl">
    <!-- Announcement bar (Directus announcements singleton, real data) -->
    <section v-if="banner" class="wf-slot" data-compact data-label="Announcement">
      <div class="center | cluster" data-gap="s">
        <a :href="banner.url" data-external><strong>{{ banner.message }}</strong></a>
      </div>
    </section>

    <!-- Zone 1: Hero -->
    <section class="wf-slot wf-hero" data-label="Hero">
      <div class="center | stack" data-gap="s">
        <!-- `home` row in pages.json: GGS value prop + Irene's About Us opening (placeholder until Irene confirms) -->
        <h1>{{ home?.heading }}</h1>
        <p data-measure="normal">{{ home?.description }}</p>
        <div class="cluster" data-gap="s">
          <NuxtLink to="/wireframes/democracy" class="wf-button" data-variant="primary">Explore our programs</NuxtLink>
          <NuxtLink to="#subscribe" class="wf-button">Get our newsletter</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Zone 2: Focus programs (GGS order: identity first) -->
    <section class="wf-slot" data-label="Programs">
      <div class="center | stack" data-gap="m">
        <h2>Our Programs</h2>
        <div class="switcher" data-gap="m">
          <article v-for="a in areaCards" :key="a.slug" class="wf-card">
            <h3>{{ a.name }}</h3>
            <p v-if="a.tagline">{{ a.tagline }}</p>
            <NuxtLink :to="`/wireframes/${a.slug}`" class="wf-button">Explore {{ a.short }}</NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <!-- Zone 3: Featured projects -->
    <section class="wf-slot" data-label="Featured projects">
      <div class="center | stack" data-gap="m">
        <h2>Projects</h2>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
          <article v-for="p in featuredProjects()" :key="p.slug" class="wf-card">
            <img v-if="p.image" :src="p.image" :alt="p.heading" style="aspect-ratio: 3/2; width: 100%; object-fit: cover;">
            <div v-else class="wf-media" style="--wf-ratio: 3/2;" />
            <h3>{{ p.heading }}<span v-if="p.external_url" aria-hidden="true"> ↗</span></h3>
            <p v-if="trim(p.excerpt ?? p.description)">{{ trim(p.excerpt ?? p.description) }}</p>
            <NuxtLink :to="`/wireframes/projects/${p.slug}`" class="wf-button">Explore {{ p.heading }}</NuxtLink>
          </article>
        </div>
        <p><NuxtLink to="/wireframes/projects"><strong>All projects →</strong></NuxtLink></p>
      </div>
    </section>

    <!-- Zone 4: Insights (highlights folded in as featured strip) -->
    <section class="wf-slot" data-label="Insights">
      <div class="center | stack" data-gap="m">
        <h2>Insights</h2>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
          <article v-for="h in featured" :key="h.slug" class="wf-card">
            <img v-if="h.image" :src="h.image" :alt="h.heading ?? ''" style="aspect-ratio: 16/9; width: 100%; object-fit: cover;">
            <div v-else class="wf-media" style="--wf-ratio: 16/9;" />
            <span class="wf-chip">Featured</span>
            <h3>{{ h.heading }}</h3>
            <p v-if="plain(h.excerpt)">{{ plain(h.excerpt) }}</p>
            <a href="#" :data-external="h.external_url ? true : undefined">View</a>
          </article>
        </div>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
          <article v-for="i in latest" :key="i.slug" class="wf-card">
            <div class="cluster" data-gap="xs">
              <span class="wf-chip">{{ formatLabel(i.format) }}</span>
              <span v-if="i.program" class="wf-chip">{{ shortArea(i.program) }}</span>
            </div>
            <h3><NuxtLink :to="`/wireframes/insights/${i.slug}`">{{ i.heading }}</NuxtLink></h3>
            <p v-if="trim(i.excerpt)">{{ trim(i.excerpt) }}</p>
            <time>{{ monthYear(i.publish_date) }}</time>
          </article>
        </div>
        <p><NuxtLink to="/wireframes/insights"><strong>All insights →</strong></NuxtLink></p>
      </div>
    </section>

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

const { active, highlights, featuredProjects, programs, announcement, homePage, plain, formatLabel, monthYear } = useWfContent()

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

const trim = (s: string | null) => {
  const t = plain(s)
  return t.length > 160 ? t.slice(0, 160).trimEnd() + '…' : t
}
</script>
