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
        <NuxtLink to="/wireframes/democracy" class="wf-button" data-variant="primary">Explore our programs</NuxtLink>
        <NuxtLink to="#subscribe" class="wf-button">Get our newsletter</NuxtLink>
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

    <!-- Zone 3b: Product band — external-only offerings (e.g. The Transponder
         magazine), moved here from the program pages. Data-driven via `external_only`. -->
    <wf-section
      v-for="prod in products" :key="prod.slug"
      :label="`Product — ${prod.heading}`" :heading="prod.heading"
    >
      <!-- Side-by-side: image left, content right. The image is wrapped in a plain
           div so the switcher treats it as a normal flex child — a bare <img> with
           width:100% forces its own row and collapses the layout to stacked. -->
      <div class="switcher" data-gap="l">
        <div v-if="prod.image"><wf-media :src="prod.image" alt="" ratio="3/2" /></div>
        <div class="stack" data-gap="s">
          <p v-if="prod.excerpt || prod.description" data-measure="normal">
            {{ productBlurb(prod) }}
          </p>
          <div class="cluster" data-gap="s">
            <a
              v-if="prod.external_url"
              :href="prod.external_url" class="wf-button" data-variant="primary" data-external="true"
            >Visit {{ prod.heading }} ↗</a>
            <!-- external_url pending (Q6): no fabricated link — status note per the
                 wireframe "Copy pending Qx" convention. -->
            <span v-else class="wf-chip">External link pending {{ prod.pending ?? 'Q6' }}</span>
          </div>
        </div>
      </div>
    </wf-section>

    <!-- Zone 4: Insights (highlights folded in as featured strip) -->
    <wf-section label="Insights" heading="Insights">
      <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-featured v-for="h in featured" :key="h.slug" :item="h" />
      </ul>
      <wf-grid-insights :insights="latest" :excerpt-length="160" :extra-chips="i => i.program ? [shortArea(i.program)] : []" />
      <p><NuxtLink to="/wireframes/insights"><strong>All insights →</strong></NuxtLink></p>
    </wf-section>
    <!-- Subscribe band comes from the layout (global) -->
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { active, highlights, featuredProjects, programs, announcement, homePage, allProducts, plain } = useWfContent()

const banner = announcement()
const home = homePage()
const featured = highlights().slice(0, 4)
const latest = active.slice(0, 6)
const products = allProducts()

// Product blurb: real dataset copy, trimmed to the lead sentence so trailing
// markdown links in the raw excerpt don't leak into the wireframe.
const productBlurb = (p: { excerpt: string | null, description: string | null }) => {
  const t = plain(p.excerpt ?? p.description)
  return t.length > 220 ? t.slice(0, 220).trimEnd() + '…' : t
}

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
