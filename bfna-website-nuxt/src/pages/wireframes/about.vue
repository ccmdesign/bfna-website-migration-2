<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- GGS about template: mission, institutional context, connection to programs.
           Copy = consolidated dataset (pages.json ← Irene Jul 29 docx) -->
      <wf-page-header
        label="Mission" :crumbs="[{ label: 'Home', to: '/wireframes' }]"
        :heading="about?.heading ?? 'About Us'" :tagline="paragraphs(about?.description)"
      />
    </template>

    <wf-section id="board" label="Board of Directors" heading="Board of Directors">
      <ul class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
        <wf-card-person v-for="p in boardMembers()" :key="p.slug" :person="p" />
      </ul>
    </wf-section>

    <wf-section id="team" label="Team" heading="Team">
      <ul class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
        <wf-card-person v-for="p in teamMembers()" :key="p.slug" :person="p" />
      </ul>
    </wf-section>

    <!-- Live-site /bertelsmann-stiftung copy + repo hero image -->
    <wf-section label="Bertelsmann Stiftung" layout="switcher" gap="l">
      <img src="/images/hero/stiftung.jpg" alt="Bertelsmann Stiftung headquarters" style="min-width: 0; max-width: 100%; height: auto; object-fit: cover; align-self: start;">
      <div class="stack" data-gap="s">
        <h2>{{ stiftung?.heading }}</h2>
        <!-- Irene (Jul 30, via Megan): keep photo + text only — old "image film" link removed -->
        <p v-for="(para, i) in paragraphs(stiftung?.description)" :key="i">{{ para }}</p>
      </div>
    </wf-section>

    <wf-contact-section id="contact" />
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { aboutPage, stiftungPage, boardMembers, teamMembers, paragraphs } = useWfContent()
const about = aboutPage()
const stiftung = stiftungPage()
</script>
