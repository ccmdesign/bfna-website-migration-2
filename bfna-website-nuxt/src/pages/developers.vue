<script setup lang="ts">
/**
 * `/developers` — public API docs linked from the homepage footer.
 *
 * `/docs` stays the internal design system and is excluded from the sitemap,
 * llms.txt, and robots. This route is the public developer surface.
 */
import { developersPage } from '../../utils/agentContent'

defineOptions({ name: 'DevelopersPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: developersPage.title })
</script>

<template>
  <bfPageHeader
    label="Developers"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Developer API' }]"
    :heading="developersPage.title"
    :tagline="developersPage.description"
  />

  <bfSection
    v-for="section in developersPage.sections"
    :key="section.heading"
    :heading="section.heading"
  >
    <p v-for="(para, i) in section.paragraphs" :key="i">{{ para }}</p>
  </bfSection>

  <bfSection heading="Where to read more">
    <ul class="stack" role="list">
      <li><NuxtLink to="/openapi.json">OpenAPI specification</NuxtLink></li>
      <li><NuxtLink to="/api/v1/organization">GET /api/v1/organization</NuxtLink></li>
      <li><NuxtLink to="/api/v1/navigation">GET /api/v1/navigation</NuxtLink></li>
      <li><NuxtLink to="/api/v1/health">GET /api/v1/health</NuxtLink></li>
      <li><NuxtLink to="/llms.txt">llms.txt</NuxtLink></li>
      <li><NuxtLink to="/.well-known/mcp">MCP server card</NuxtLink></li>
    </ul>
  </bfSection>
</template>
