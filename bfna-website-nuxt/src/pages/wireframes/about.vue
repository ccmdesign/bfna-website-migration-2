<template>
  <div class="stack" data-gap="xl">
    <!-- GGS about template: mission, institutional context, connection to programs -->
    <wf-section label="Mission" gap="s" padded>
      <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink></nav>
      <!-- Consolidated dataset (pages.json ← Irene Jul 29 docx) -->
      <h1>{{ about?.heading ?? 'About Us' }}</h1>
      <p v-for="para in paragraphs(about?.description)" :key="para.slice(0, 20)" data-measure="normal">{{ para }}</p>
    </wf-section>

    <wf-section id="board" label="Board of Directors" heading="Board of Directors">
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
        <wf-card-person v-for="p in boardMembers()" :key="p.slug" :person="p" />
      </div>
    </wf-section>

    <wf-section id="team" label="Team" heading="Team">
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
        <wf-card-person v-for="p in teamMembers()" :key="p.slug" :person="p" />
      </div>
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

    <wf-section id="contact" label="Contact" layout="switcher" gap="l">
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
    </wf-section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { aboutPage, stiftungPage, boardMembers, teamMembers, paragraphs } = useWfContent()
const about = aboutPage()
const stiftung = stiftungPage()
</script>
