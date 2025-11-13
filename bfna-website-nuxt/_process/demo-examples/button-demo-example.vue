<template>
  <ccm-section>
    <div class="stack">
      <h2>Variants</h2>
      <div class="cluster" data-space="xs">
        <ccmButton variant="primary">
          Primary
        </ccmButton>
        <ccmButton variant="secondary">
          Secondary
        </ccmButton>
        <ccmButton variant="ghost">
          Ghost
        </ccmButton>
        <ccmButton variant="link">
          Link
        </ccmButton>
        <ccmButton variant="unstyled">
          Unstyled
        </ccmButton>
      </div>
    </div>
  </ccm-section>
  <ccm-section>
    <div class="stack">
      <h2>Colors</h2>
      <div class="cluster" data-space="xs">
        <ccmButton color="primary">
          Primary
        </ccmButton>
        <ccmButton color="secondary">
          Secondary
        </ccmButton>
        <ccmButton color="base">
          Base
        </ccmButton>
        <ccmButton color="accent">
          Accent
        </ccmButton>
        <ccmButton color="success">
          Success
        </ccmButton>
        <ccmButton color="warning">
          Warning
        </ccmButton>
        <ccmButton color="info">
          Info
        </ccmButton>
        <ccmButton color="fail">
          Fail
        </ccmButton>
      </div>
      <div class="cluster" data-space="xs">
        <ccmButton color="primary" variant="secondary">
          Primary
        </ccmButton>
        <ccmButton color="secondary" variant="secondary">
          Secondary
        </ccmButton>
        <ccmButton color="base" variant="secondary">
          Base
        </ccmButton>
        <ccmButton color="accent" variant="secondary">
          Accent
        </ccmButton>
        <ccmButton color="success" variant="secondary">
          Success
        </ccmButton>
        <ccmButton color="warning" variant="secondary">
          Warning
        </ccmButton>
        <ccmButton color="info" variant="secondary">
          Info
        </ccmButton>
        <ccmButton color="fail" variant="secondary">
          Fail
        </ccmButton>
      </div>
      <div class="cluster" data-space="xs">
        <ccmButton color="primary" variant="ghost">
          Primary
        </ccmButton>
        <ccmButton color="secondary" variant="ghost">
          Secondary
        </ccmButton>
        <ccmButton color="base" variant="ghost">
          Base
        </ccmButton>
        <ccmButton color="accent" variant="ghost">
          Accent
        </ccmButton>
        <ccmButton color="success" variant="ghost">
          Success
        </ccmButton>
        <ccmButton color="warning" variant="ghost">
          Warning
        </ccmButton>
        <ccmButton color="info" variant="ghost">
          Info
        </ccmButton>
        <ccmButton color="fail" variant="ghost">
          Fail
        </ccmButton>  
      </div>
      <div class="cluster" data-space="xs">
        <ccmButton color="primary" variant="primary" disabled>
          Primary
        </ccmButton>
        <ccmButton color="secondary" variant="primary" disabled>
          Secondary
        </ccmButton>
        <ccmButton color="base" variant="primary" disabled>
          Base
        </ccmButton>
        <ccmButton color="accent" variant="primary" disabled>
          Accent
        </ccmButton>
        <ccmButton color="success" variant="secondary" disabled>
          Success
        </ccmButton>
        <ccmButton color="warning" variant="secondary" disabled>
          Warning
        </ccmButton>
        <ccmButton color="info" variant="secondary" disabled>
          Info
        </ccmButton>
        <ccmButton color="fail" variant="secondary" disabled>
          Fail
        </ccmButton>  
      </div>
    </div>
  </ccm-section>
  <ccm-section>
    <div class="stack">
      <h2>Sizes</h2>
      <div class="cluster">
        <ccmButton variant="primary" size="s">
          Small
        </ccmButton>
        <ccmButton variant="primary" size="m">
          Medium
        </ccmButton>
        <ccmButton variant="primary" size="l">
          Large
        </ccmButton>
        <ccmButton variant="primary" size="xl">
          Extra Large
        </ccmButton>
      </div>
    </div>
  </ccm-section>
  <ccm-section>
    <div class="stack">
      <h2>Button Groups</h2>
      <ccmFormGroup>
        <ccmButton color="primary" variant="primary">Button 1</ccmButton>
        <ccmButton color="primary" variant="secondary">Button 2</ccmButton>
        <ccmButton color="fail" variant="secondary" disabled>Button 3</ccmButton>
        <ccmButton color="primary" variant="secondary" disabled>Button 4</ccmButton>
      </ccmFormGroup>
    </div>
  </ccm-section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

definePageMeta({
  layout: 'default',
  hero: {
    brow: 'Component demos',
    title: 'Button demos',
    tagline: 'Interactive coverage of the component API',
    size: 'l'
  }
})
</script>