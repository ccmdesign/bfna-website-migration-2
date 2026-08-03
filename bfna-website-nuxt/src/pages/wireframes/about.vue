<template>
  <div class="stack" data-gap="xl">
    <!-- GGS about template: mission, institutional context, connection to programs -->
    <section class="wf-slot" data-label="Mission">
      <div class="center | stack" data-gap="s" style="padding-block: var(--space-l);">
        <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink></nav>
        <!-- Consolidated dataset (pages.json ← Irene Jul 29 docx) -->
        <h1>{{ about?.heading ?? 'About Us' }}</h1>
        <p v-for="para in paragraphs(about?.description)" :key="para.slice(0, 20)" data-measure="normal">{{ para }}</p>
      </div>
    </section>

    <section id="board" class="wf-slot" data-label="Board of Directors">
      <div class="center | stack" data-gap="m">
        <h2>Board of Directors</h2>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
          <article v-for="p in boardMembers()" :key="p.slug" class="wf-card">
            <img v-if="p.image" :src="p.image" :alt="p.name" style="aspect-ratio: 1/1; width: 100%; object-fit: cover;">
            <div v-else class="wf-media" style="--wf-ratio: 1/1;" />
            <h3>{{ p.name }}</h3>
            <p>{{ p.job_title }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="team" class="wf-slot" data-label="Team">
      <div class="center | stack" data-gap="m">
        <h2>Team</h2>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
          <article v-for="p in teamMembers()" :key="p.slug" class="wf-card">
            <img v-if="p.image" :src="p.image" :alt="p.name" style="aspect-ratio: 1/1; width: 100%; object-fit: cover;">
            <div v-else class="wf-media" style="--wf-ratio: 1/1;" />
            <h3>{{ p.name }}</h3>
            <p>{{ p.job_title ?? '—' }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Live-site /bertelsmann-stiftung copy + repo hero image -->
    <section class="wf-slot" data-label="Bertelsmann Stiftung">
      <div class="center | switcher" data-gap="l">
        <img src="/images/hero/stiftung.jpg" alt="Bertelsmann Stiftung headquarters" style="min-width: 0; max-width: 100%; height: auto; object-fit: cover; align-self: start;">
        <div class="stack" data-gap="s">
          <h2>{{ stiftung?.heading }}</h2>
          <!-- Irene (Jul 30, via Megan): keep photo + text only — old "image film" link removed -->
          <p v-for="(para, i) in paragraphs(stiftung?.description)" :key="i">{{ para }}</p>
        </div>
      </div>
    </section>

    <section id="contact" class="wf-slot" data-label="Contact">
      <div class="center | switcher" data-gap="l">
        <form class="stack" data-gap="s" @submit.prevent>
          <h2>Contact</h2>
          <p><a href="mailto:info@bfna.org">info@bfna.org</a></p>
          <label class="stack" data-gap="2xs">Name<input type="text"></label>
          <label class="stack" data-gap="2xs">Email<input type="email"></label>
          <label class="stack" data-gap="2xs">Message<textarea rows="4" /></label>
          <div><button type="submit" class="wf-button" data-variant="primary">Send message</button></div>
        </form>
        <form class="stack" data-gap="s" @submit.prevent>
          <h2>Subscribe to receive our updates &amp; newsletters</h2>
          <p>Enter your email and customize your preferences.</p>
          <label class="stack" data-gap="2xs">Email<input type="email" placeholder="you@example.org"></label>
          <div><button type="submit" class="wf-button" data-variant="primary">Subscribe</button></div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { aboutPage, stiftungPage, boardMembers, teamMembers, paragraphs } = useWfContent()
const about = aboutPage()
const stiftung = stiftungPage()
</script>
