<script setup lang="ts">
defineOptions({ name: 'ContactPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: 'Contact' })
</script>

<template>
  <bfPageHeader
    label="Contact"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Contact' }]"
    heading="Contact"
    tagline="Connect with the Bertelsmann Foundation North America about our research, programs, projects, and public dialogue."
  />

  <bfSection label="Get in touch" heading="Get in touch">
    <div class="stack" data-gap="m">
      <p>The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership. Our work includes research, policy dialogue, leadership programs, and multimedia storytelling focused on the global challenges shaping the future of the United States, Europe, and the wider world.</p>
      <p>For general questions about the Foundation, its research, or its public programs, email <a href="mailto:info@bfna.org">info@bfna.org</a>. The Foundation is based in Washington, DC.</p>
      <p>Visitors can also explore the <NuxtLink to="/about">About</NuxtLink> page for the mission, Board of Directors, and team; <NuxtLink to="/projects">Projects</NuxtLink> for current initiatives; and <NuxtLink to="/insights">Insights</NuxtLink> for published articles, reports, videos, and infographics.</p>
      <p>The site includes a contact form on the About page for visitors who prefer to begin an inquiry there. It currently presents the fields without submitting data to a site endpoint; email remains the available general contact route.</p>
    </div>
  </bfSection>
</template>
