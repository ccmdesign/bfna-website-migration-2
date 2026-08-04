<!-- CTA section: GGS conversion pattern — heading + supporting message + SPECIFIC
     action labels (never "Learn More"). All copy arrives via props so it lives in
     the page/dataset, never in the component. `form` renders the email-capture
     variant (input + first CTA as submit); otherwise CTAs render as buttons,
     first one primary unless overridden. -->
<script setup lang="ts">
export interface WfCta {
  label: string
  to?: string       // internal route
  href?: string     // external URL
  external?: boolean
  primary?: boolean
}

withDefaults(defineProps<{
  label?: string    // wf-slot annotation label
  heading?: string
  message?: string
  ctas?: WfCta[]
  form?: boolean
}>(), { label: 'CTA', ctas: () => [] })

const isPrimary = (c: WfCta, idx: number) => (c.primary ?? idx === 0) ? 'primary' : undefined
</script>

<template>
  <wf-section :label="label" gap="s" :heading="heading">
    <p v-if="message" data-measure="normal">{{ message }}</p>
    <form v-if="form" class="cluster" data-gap="s" @submit.prevent>
      <input type="email" placeholder="you@example.org" aria-label="Email address" required>
      <button type="submit" class="wf-button" data-variant="primary">{{ ctas[0]?.label ?? 'Subscribe' }}</button>
    </form>
    <div v-else-if="ctas.length" class="cluster" data-gap="s">
      <template v-for="(c, idx) in ctas" :key="c.label">
        <NuxtLink v-if="c.to" :to="c.to" class="wf-button" :data-variant="isPrimary(c, idx)">{{ c.label }}</NuxtLink>
        <a v-else :href="c.href ?? '#'" class="wf-button" :data-variant="isPrimary(c, idx)" :data-external="c.external || undefined">{{ c.label }}</a>
      </template>
    </div>
  </wf-section>
</template>
