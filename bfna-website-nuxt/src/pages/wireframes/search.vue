<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <wf-page-header label="Search" heading="Search"
        tagline="Ask in your own words — results are ranked by meaning, not keyword matches.">
        <div class="stack" data-gap="xs" style="max-width: 40rem;">
          <input
            v-model="q" type="search"
            placeholder="Ask anything — e.g. “how do we fix democracy?”"
            aria-label="Semantic search"
            style="width: 100%; font-size: 1.25rem; padding: 0.6em 0.9em;"
          >
          <p class="wf-note">[semantic ranking simulated — real vector search is Front 4]</p>
        </div>
      </wf-page-header>
    </template>

    <!-- Facets: program + format only. Granular country/topic tagging is intentionally
         NOT offered — semantic ranking replaces it (Aug 4 call). -->
    <wf-section v-if="q.length > 1" label="Refine" gap="s">
      <div class="cluster" data-gap="xs">
        <span>Program:</span>
        <button
          v-for="a in programs()" :key="a.slug" type="button" class="wf-chip"
          :style="program === a.name ? 'background:#222;color:#fff;cursor:pointer' : 'cursor:pointer'"
          @click="program = program === a.name ? '' : a.name"
        >{{ a.name }}</button>
      </div>
      <div class="cluster" data-gap="xs">
        <span>Format:</span>
        <button
          v-for="f in FORMATS" :key="f.key" type="button" class="wf-chip"
          :style="format === f.key ? 'background:#222;color:#fff;cursor:pointer' : 'cursor:pointer'"
          @click="format = format === f.key ? '' : f.key"
        >{{ f.label }}</button>
      </div>
      <div v-if="program || format" class="cluster" data-gap="xs">
        <button type="button" class="wf-button" @click="program = ''; format = ''">Clear facets</button>
      </div>
    </wf-section>

    <wf-section v-if="q.length > 1" label="Results">
      <p>
        <strong>{{ results.length }}</strong> results for “{{ q }}”,
        ranked by relevance
        <span v-if="program || format"> · filtered by {{ [program, format && formatLabelFor(format)].filter(Boolean).join(' + ') }}</span>
      </p>
      <p v-if="!results.length" class="wf-note">No records matched — try fewer or different words.</p>
      <ol class="stack" data-gap="s" style="list-style: none; padding: 0;">
        <li v-for="(r, idx) in results.slice(0, 20)" :key="r.slug" class="stack" data-gap="2xs">
          <div class="cluster" data-gap="xs">
            <wf-chip>{{ r.chip }}</wf-chip>
            <wf-chip v-if="r.archived">Archive</wf-chip>
            <NuxtLink :to="r.to">{{ r.heading }}</NuxtLink>
            <time v-if="r.date">{{ r.date }}</time>
          </div>
          <!-- Lo-fi relevance meter — stand-in for a real semantic score (Front 4) -->
          <div class="cluster" data-gap="xs" style="align-items: center;">
            <span class="wf-note" style="border: 0; background: transparent; padding: 0; min-width: 4.5rem;">#{{ idx + 1 }} · {{ Math.round((r.score / topScore) * 100) }}%</span>
            <span aria-hidden="true" style="display: inline-block; height: 6px; background: #222;"
              :style="{ width: `${Math.max(6, Math.round((r.score / topScore) * 100) * 1.6)}px` }"></span>
          </div>
        </li>
      </ol>
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { items, projects, people, programs, formatLabel, monthYear } = useWfContent()
const q = ref('')
const program = ref('')  // program NAME (matches insight/project `program`)
const format = ref('')   // insight format key

const FORMATS = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]
const formatLabelFor = (key: string) => FORMATS.find(f => f.key === key)?.label ?? key

// Cross-type pool from the consolidated dataset: insights + projects + people.
// Carries program + format so the two facets can filter; people carry neither.
const pool = [
  ...items.map(i => ({
    slug: `i-${i.slug}`, heading: i.heading ?? '[untitled]',
    haystack: `${i.heading ?? ''} ${i.excerpt ?? ''}`,
    chip: formatLabel(i.format), archived: !!i.archived,
    program: i.program ?? '', format: (i.format ?? 'article').split('|')[0],
    to: `/wireframes/insights/${i.slug}`, date: monthYear(i.publish_date)
  })),
  ...projects().map(p => ({
    slug: `p-${p.slug}`, heading: p.heading,
    haystack: `${p.heading} ${p.excerpt ?? ''} ${p.description ?? ''}`,
    chip: 'Project', archived: !!p.archived,
    program: p.program ?? '', format: '',
    to: `/wireframes/projects/${p.slug}`, date: ''
  })),
  ...people().map(p => ({
    slug: `pe-${p.slug}`, heading: p.name,
    haystack: `${p.name} ${p.job_title ?? ''}`,
    chip: 'Person', archived: false,
    program: '', format: '',
    to: '/wireframes/about#team', date: ''
  }))
]

// Simulated relevance: lexical scoring dressed as a semantic rank. Full-phrase and
// heading hits weigh above body hits, so ordering reads as relevance rather than a
// raw substring match. A real embedding/vector search is Front 4 — NOT built here.
function score(r: typeof pool[number], phrase: string, terms: string[]): number {
  const heading = r.heading.toLowerCase()
  const body = r.haystack.toLowerCase()
  let s = 0
  if (phrase && heading.includes(phrase)) s += 8
  else if (phrase && body.includes(phrase)) s += 4
  for (const t of terms) {
    if (heading.includes(t)) s += 3
    else if (body.includes(t)) s += 1
  }
  return s
}

const ranked = computed(() => {
  const phrase = q.value.trim().toLowerCase()
  const terms = phrase.split(/\s+/).filter(Boolean)
  return pool
    .map(r => ({ ...r, score: score(r, phrase, terms) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
})

const results = computed(() =>
  ranked.value.filter(r =>
    (!program.value || r.program === program.value) &&
    (!format.value || r.format === format.value)
  )
)

const topScore = computed(() => results.value[0]?.score || 1)
</script>
