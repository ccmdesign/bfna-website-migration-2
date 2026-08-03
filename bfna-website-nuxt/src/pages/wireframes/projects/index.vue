<template>
  <div class="stack" data-gap="xl">
    <section class="wf-slot" data-label="Projects index">
      <div class="center | stack" data-gap="s" style="padding-block: var(--space-l);">
        <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink></nav>
        <h1>{{ indexPage?.heading ?? 'All Projects' }}</h1>
        <p v-if="indexPage?.description" data-measure="normal">{{ indexPage.description }}</p>
      </div>
    </section>

    <section v-for="a in programs()" :key="a.slug" class="wf-slot" :data-label="a.name">
      <div class="center | stack" data-gap="m">
        <h2><NuxtLink :to="`/wireframes/${a.slug}`">{{ a.name }}</NuxtLink></h2>
        <div class="grid" data-min-width="s" data-gap="m">
          <article v-for="p in projectsByProgram(a.name)" :key="p.slug" class="wf-card">
            <div v-if="kindLabel(p.kind) || p.external_url || p.pending" class="cluster" data-gap="xs">
              <span v-if="kindLabel(p.kind)" class="wf-chip">{{ kindLabel(p.kind) }}</span>
              <span v-if="p.external_url" class="wf-chip">External platform</span>
              <span v-if="p.pending" class="wf-chip">Copy pending {{ p.pending }}</span>
            </div>
            <h3>{{ p.heading }}</h3>
            <p v-if="excerptFor(p)">{{ excerptFor(p) }}</p>
            <NuxtLink :to="`/wireframes/projects/${p.slug}`" class="wf-button">Explore {{ p.heading }}</NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <!-- Legacy items whose new program is unresolved (Q3) — kept visible -->
    <section v-if="retag.length" class="wf-slot" data-label="Pending re-tag (Q3)">
      <div class="center | stack" data-gap="m">
        <h2>Pending re-tag</h2>
        <div class="grid" data-min-width="s" data-gap="m">
          <article v-for="p in retag" :key="p.slug" class="wf-card">
            <div v-if="p.external_url" class="cluster" data-gap="xs">
              <span class="wf-chip">External platform</span>
            </div>
            <h3>{{ p.heading }}</h3>
            <p v-if="excerptFor(p)">{{ excerptFor(p) }}</p>
            <NuxtLink :to="`/wireframes/projects/${p.slug}`" class="wf-button">Explore {{ p.heading }}</NuxtLink>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { programs, projectsByProgram, projectsPendingRetag, pageBySlug, kindLabel, plain } = useWfContent()
const indexPage = pageBySlug('projects')

const retag = projectsPendingRetag()

const excerptFor = (p: { excerpt: string | null, description: string | null }) => {
  const t = plain(p.excerpt ?? p.description)
  return t.length > 120 ? t.slice(0, 120).trimEnd() + '…' : t
}
</script>
