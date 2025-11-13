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
  <ccm-section>
    <div class="stack">
      <h2>Documentation</h2>
      <div v-html="documentationFragment" />
    </div>
  </ccm-section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import documentationHtml from './_docs/ccm-button.html?raw'

if (import.meta.client) {
  definePageMeta({
    layout: 'docs2',
    hero: {
      brow: 'Component demos',
      title: 'Button demos',
      tagline: 'Interactive coverage of the component API',
      size: 'l'
    }
  })
}

type DemoVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'unstyled'
type DemoColor = 'primary' | 'secondary' | 'base' | 'accent' | 'success' | 'warning' | 'info'
type DemoSize = 's' | 'm' | 'l' | 'xl'
type DemoBackground = 'transparent' | 'color-surface' | 'color-primary' | 'color-accent'

type DemoEvent = {
  id: number
  context: string
  time: string
}

const variantOptions: DemoVariant[] = ['primary', 'secondary', 'ghost', 'link', 'unstyled']
const colorOptions: DemoColor[] = ['primary', 'secondary', 'base', 'accent', 'success', 'warning', 'info']
const sizeOptions: DemoSize[] = ['s', 'm', 'l', 'xl']
const backgroundOptions: DemoBackground[] = ['transparent', 'color-surface', 'color-primary', 'color-accent']

const structureLinks = {
  demo: '/docs/demos/ccm-button'
}

const contentDefaults = {
  label: 'Fallback text button'
}

const slotContent = {
  label: 'Approve'
}

const iconOnly = {
  label: 'Save to favorites'
}

const visualState = reactive({
  variant: 'primary' as DemoVariant,
  color: 'primary' as DemoColor,
  size: 'm' as DemoSize,
  background: 'transparent' as DemoBackground
})

const disabled = ref(false)
const pressed = ref(false)
const expanded = ref(false)

const events = ref<DemoEvent[]>([])
const nextEventId = ref(0)
const eventLimit = 8

const formatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

const logEvent = (context: string) => {
  nextEventId.value += 1
  const entry: DemoEvent = {
    id: nextEventId.value,
    context,
    time: formatter.format(new Date())
  }
  events.value = [entry, ...events.value].slice(0, eventLimit)
}

const setVariant = (option: DemoVariant) => {
  visualState.variant = option
  logEvent(`visual: variant → ${option}`)
}

const setColor = (option: DemoColor) => {
  visualState.color = option
  logEvent(`visual: color → ${option}`)
}

const setSize = (option: DemoSize) => {
  visualState.size = option
  logEvent(`visual: size → ${option}`)
}

const setBackground = (option: DemoBackground) => {
  visualState.background = option
  logEvent(`visual: background → ${option}`)
}

const toggleDisabled = () => {
  disabled.value = !disabled.value
  logEvent(`behavior: disabled → ${disabled.value}`)
}

const togglePressed = () => {
  pressed.value = !pressed.value
  logEvent(`a11y: aria-pressed → ${pressed.value}`)
}

const toggleExpanded = () => {
  expanded.value = !expanded.value
  logEvent(`a11y: aria-expanded → ${expanded.value}`)
}

const hasEvents = computed(() => events.value.length > 0)
const documentationFragment = documentationHtml
</script>

