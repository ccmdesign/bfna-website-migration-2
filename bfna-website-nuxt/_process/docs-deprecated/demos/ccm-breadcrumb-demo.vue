<template>
  <div class="stack" data-space="l">
    <ccmSection size="l" background-color="color-surface-subtle">
      <div class="stack" data-space="m">
        <div class="stack" data-space="3xs">
          <h2>Default composition</h2>
          <p>Uses the landmark nav element with chevron separators and link styling inherited from the design system.</p>
        </div>

        <ccmBreadcrumb :items="defaultItems" />

        <div class="box" data-padding="s" data-border="subtle">
          <p><strong>Content object:</strong></p>
          <ul class="stack" data-space="4xs">
            <li v-for="(item, index) in defaultItems" :key="`default-${index}`">
              <code>{{ item.label }}</code>
              <span v-if="item.to"> → <code>{{ item.to }}</code></span>
            </li>
          </ul>
        </div>
      </div>
    </ccmSection>

    <ccmSection size="l">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Structure props</h2>
          <p>Swap the root element to align with your layout while keeping nav semantics when needed.</p>
        </div>

        <ccmFormGroup aria-label="Breadcrumb landmark" variant="attached" gap="2xs">
          <ccmButton
            v-for="option in structureOptions"
            :key="option.id"
            type="button"
            size="s"
            :variant="structureTag === option.id ? 'primary' : 'secondary'"
            color="primary"
            @click="structureTag = option.id"
          >
            {{ option.label }}
          </ccmButton>
        </ccmFormGroup>

        <p class="stack" data-space="5xs">
          <span><strong>Rendered as:</strong> <code>{{ structureTag }}</code></span>
          <span>{{ structureDescription }}</span>
        </p>

        <ccmBreadcrumb :is="structureTag" :items="structureItems" />
      </div>
    </ccmSection>

    <ccmSection size="l" background-color="color-surface-subtle">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Content presets</h2>
          <p>Single content object containing ordered items; last entry becomes the current page automatically.</p>
        </div>

        <ccmFormGroup aria-label="Breadcrumb content presets" gap="2xs">
          <ccmButton
            v-for="preset in contentPresets"
            :key="preset.id"
            type="button"
            size="s"
            :variant="activeContentPresetId === preset.id ? 'primary' : 'secondary'"
            color="primary"
            @click="activeContentPresetId = preset.id"
          >
            {{ preset.label }}
          </ccmButton>
        </ccmFormGroup>

        <p>{{ currentContentPreset.description }}</p>

        <ccmBreadcrumb :items="contentItems" />

        <div class="box" data-padding="s" data-border="subtle">
          <p><strong>Resolved items:</strong></p>
          <ul class="stack" data-space="4xs">
            <li v-for="(item, index) in contentItems" :key="`content-${index}`">
              <code>{{ item.label }}</code>
              <span v-if="item.to"> → <code>{{ item.to }}</code></span>
              <span v-else-if="item.href"> → <code>{{ item.href }}</code></span>
            </li>
          </ul>
        </div>
      </div>
    </ccmSection>

    <ccmSection size="l">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Visual controls</h2>
          <p>Size, wrapping, separator style, chevron icon, and inline padding all flow through tokens.</p>
        </div>

        <div class="stack" data-space="3xs">
          <strong>Size</strong>
          <ccmFormGroup aria-label="Breadcrumb size" gap="2xs">
            <ccmButton
              v-for="sizeOption in sizeOptions"
              :key="sizeOption"
              type="button"
              size="s"
              :variant="visualSize === sizeOption ? 'primary' : 'secondary'"
              color="primary"
              @click="visualSize = sizeOption"
            >
              {{ sizeOption.toUpperCase() }}
            </ccmButton>
          </ccmFormGroup>
        </div>

        <div class="stack" data-space="3xs">
          <strong>Variant</strong>
          <ccmFormGroup aria-label="Breadcrumb variant" gap="2xs">
            <ccmButton
              v-for="variantOption in variantOptions"
              :key="variantOption"
              type="button"
              size="s"
              :variant="visualVariant === variantOption ? 'primary' : 'secondary'"
              color="primary"
              @click="visualVariant = variantOption"
            >
              {{ variantOption }}
            </ccmButton>
          </ccmFormGroup>
        </div>

        <div class="stack" data-space="3xs">
          <strong>Separator</strong>
          <ccmFormGroup aria-label="Separator style" gap="2xs">
            <ccmButton
              v-for="separatorOption in separatorOptions"
              :key="separatorOption"
              type="button"
              size="s"
              :variant="visualSeparator === separatorOption ? 'primary' : 'secondary'"
              color="primary"
              @click="visualSeparator = separatorOption"
            >
              {{ separatorOption }}
            </ccmButton>
          </ccmFormGroup>

          <ccmFormGroup
            v-if="showCustomSeparator"
            aria-label="Custom separator glyph"
            gap="2xs"
          >
            <ccmButton
              v-for="glyph in customSeparatorOptions"
              :key="glyph"
              type="button"
              size="s"
              :variant="customSeparatorSymbol === glyph ? 'primary' : 'secondary'"
              color="primary"
              @click="customSeparatorSymbol = glyph"
            >
              {{ glyph }}
            </ccmButton>
          </ccmFormGroup>

          <ccmFormGroup
            v-if="isChevronSeparator"
            aria-label="Chevron icon"
            gap="2xs"
          >
            <ccmButton
              v-for="icon in chevronIcons"
              :key="icon"
              type="button"
              size="s"
              :variant="visualIcon === icon ? 'primary' : 'secondary'"
              color="primary"
              @click="visualIcon = icon"
            >
              {{ icon.replace('_', ' ') }}
            </ccmButton>
          </ccmFormGroup>
        </div>

        <div class="stack" data-space="3xs">
          <strong>Inline padding</strong>
          <ccmFormGroup aria-label="Item padding" gap="2xs">
            <ccmButton
              v-for="paddingOption in paddingOptions"
              :key="paddingOption"
              type="button"
              size="s"
              :variant="visualPadding === paddingOption ? 'primary' : 'secondary'"
              color="primary"
              @click="visualPadding = paddingOption"
            >
              {{ paddingOption }}
            </ccmButton>
          </ccmFormGroup>
        </div>

        <ccmBreadcrumb
          :items="visualItems"
          :size="visualSize"
          :variant="visualVariant"
          :separator="visualSeparator"
          :icon-name="visualIcon"
          :item-padding-inline="visualPadding"
        >
          <template v-if="showCustomSeparator" #separator>
            <span aria-hidden="true">{{ customSeparatorSymbol }}</span>
          </template>
        </ccmBreadcrumb>
      </div>
    </ccmSection>

    <ccmSection size="l" background-color="color-surface-subtle">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Behavior &amp; SEO</h2>
          <p>Toggle schema.org JSON-LD emission and control canonical URLs via <code>baseUrl</code>.</p>
        </div>

        <div class="cluster" data-space="2xs" data-justify="start" data-align="center">
          <ccmToggleButton
            v-model="includeJsonLd"
            mode="switch"
            label="Inject JSON-LD"
            size="m"
            @toggle="handleJsonLdToggle"
          />
          <span>Last toggle payload: <code>{{ String(lastTogglePayload) }}</code></span>
        </div>

        <ccmFormField label="Base URL" help-text="Used for relative breadcrumb links in JSON-LD.">
          <template #default="{ inputProps }">
            <input
              v-bind="inputProps"
              type="url"
              :value="baseUrl"
              placeholder="https://ccm.design"
              @input="onBaseUrlInput"
            />
          </template>
        </ccmFormField>

        <ccmBreadcrumb
          :items="behaviorItems"
          :include-json-ld="includeJsonLd"
          :base-url="resolvedBaseUrl"
        />

        <div class="box" data-padding="s" data-border="subtle">
          <p><strong>JSON-LD preview</strong></p>
          <pre v-if="includeJsonLd"><code>{{ jsonLdPreview }}</code></pre>
          <p v-else>JSON-LD injection disabled.</p>
        </div>
      </div>
    </ccmSection>

    <ccmSection size="l">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Accessibility</h2>
          <p>Override the landmark label to match your navigation context.</p>
        </div>

        <ccmFormField label="aria-label" help-text="Defaults to &quot;Breadcrumbs&quot; when left blank.">
          <template #default="{ inputProps }">
            <input
              v-bind="inputProps"
              type="text"
              :value="ariaLabelOverride"
              placeholder="Docs navigation"
              @input="onAriaLabelInput"
            />
          </template>
        </ccmFormField>

        <ccmBreadcrumb :items="accessibilityItems" :aria-label="ariaLabelOverride || undefined" />
      </div>
    </ccmSection>

    <ccmSection size="l" background-color="color-surface-subtle">
      <div class="stack" data-space="m">
        <div class="stack" data-space="4xs">
          <h2>Edge cases</h2>
          <p>Wrapped layout, external links, and single-node trails remain stable with slot overrides.</p>
        </div>

        <div class="stack" data-space="s">
          <div class="stack" data-space="3xs">
            <strong>Long labels with wrap</strong>
            <ccmBreadcrumb
              :items="wrapItems"
              variant="wrap"
              size="m"
              separator="slash"
            />
          </div>

          <div class="stack" data-space="3xs">
            <strong>External URL mix</strong>
            <ccmBreadcrumb :items="externalItems">
              <template #separator>
                <span aria-hidden="true">|</span>
              </template>
            </ccmBreadcrumb>
          </div>

          <div class="stack" data-space="3xs">
            <strong>Single current page</strong>
            <ccmBreadcrumb :items="[{ label: 'Settings' }]" />
          </div>
        </div>
      </div>
    </ccmSection>
    <ccmSection size="l">
      <div class="stack">
        <h2>Documentation</h2>
        <div v-html="documentationFragment" />
      </div>
    </ccmSection>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import ccmBreadcrumb from '~/components/ds/molecules/ccmBreadcrumb.vue'
import ccmButton from '~/components/ds/molecules/ccmButton.vue'
import ccmFormGroup from '~/components/ds/molecules/ccmFormGroup.vue'
import ccmFormField from '~/components/ds/molecules/ccmFormField.vue'
import ccmSection from '~/components/ds/organisms/ccmSection.vue'
import ccmToggleButton from '~~/_archive/ds-archive/ccmToggleButton.vue'
import documentationHtml from './_docs/ccm-breadcrumb.html?raw'

if (import.meta.client) {
  definePageMeta({
    layout: 'docs2',
    hero: {
      brow: 'Component demos',
      title: 'Breadcrumb demos',
      tagline: 'Interactive coverage of the component API',
      size: 'l'
    }
  })
}

type StructureTag = 'nav' | 'div'

interface DemoBreadcrumbItem {
  label: string
  to?: string
  href?: string
  ariaLabel?: string
}

interface StructureOption {
  id: StructureTag
  label: string
  description: string
}

interface ContentPreset {
  id: string
  label: string
  description: string
  items: DemoBreadcrumbItem[]
}

const defaultItems: DemoBreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Docs', to: '/docs' },
  { label: 'Breadcrumb' }
]

const documentationFragment = documentationHtml

const structureOptions: StructureOption[] = [
  {
    id: 'nav',
    label: 'nav',
    description: 'Semantic navigation landmark with aria-label support.'
  },
  {
    id: 'div',
    label: 'div',
    description: 'Non-landmark container when the parent already provides navigation context.'
  }
]

const structureTag = ref<StructureTag>('nav')
const structureItems = defaultItems
const structureDescription = computed(() => {
  return structureOptions.find((option) => option.id === structureTag.value)?.description ?? structureOptions[0].description
})

const contentPresets: ContentPreset[] = [
  {
    id: 'docs',
    label: 'Docs flow',
    description: 'Three-level documentation trail with the current page rendered as text.',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Docs', to: '/docs' },
      { label: 'Components', to: '/docs/components' },
      { label: 'Breadcrumb' }
    ]
  },
  {
    id: 'storefront',
    label: 'Storefront',
    description: 'Mix of category links and external brand page via href.',
    items: [
      { label: 'Store', to: '/store' },
      { label: 'Footwear', to: '/store/footwear' },
      { label: 'Trail Runners', href: 'https://example.com/trail-runners' }
    ]
  },
  {
    id: 'docs-deep',
    label: 'Deep docs',
    description: 'Demonstrates a longer chain with nested sections.',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Docs', to: '/docs' },
      { label: 'Guidelines', to: '/docs/guidelines' },
      { label: 'Navigation', to: '/docs/guidelines/navigation' },
      { label: 'Breadcrumb patterns' }
    ]
  }
]

const activeContentPresetId = ref<string>(contentPresets[0].id)

const currentContentPreset = computed(() => {
  return contentPresets.find((preset) => preset.id === activeContentPresetId.value) ?? contentPresets[0]
})

const contentItems = computed(() => {
  return currentContentPreset.value.items.map((item) => ({ ...item }))
})

const sizeOptions: Array<'s' | 'm'> = ['s', 'm']
const variantOptions: Array<'default' | 'wrap'> = ['default', 'wrap']
const separatorOptions: Array<'chevron' | 'slash' | 'custom'> = ['chevron', 'slash', 'custom']
const paddingOptions: Array<'2xs' | 'xs' | 's'> = ['2xs', 'xs', 's']
const chevronIcons = ['chevron_right', 'arrow_forward_ios', 'navigate_next']
const customSeparatorOptions: Array<'|' | '>'> = ['|', '>']

const visualSize = ref<'s' | 'm'>('s')
const visualVariant = ref<'default' | 'wrap'>('default')
const visualSeparator = ref<'chevron' | 'slash' | 'custom'>('chevron')
const visualIcon = ref('chevron_right')
const visualPadding = ref<'2xs' | 'xs' | 's'>('2xs')
const customSeparatorSymbol = ref<'|' | '>'>('|')

const isChevronSeparator = computed(() => visualSeparator.value === 'chevron')
const showCustomSeparator = computed(() => visualSeparator.value === 'custom')

const visualItems = computed<DemoBreadcrumbItem[]>(() => [
  { label: 'Home', to: '/' },
  { label: 'Components', to: '/docs/components' },
  { label: 'Navigation patterns', to: '/docs/components/navigation' },
  { label: 'Breadcrumb usage in production' }
])

const includeJsonLd = ref(true)
const baseUrl = ref('https://ccm.design')
const lastTogglePayload = ref<boolean | null>(includeJsonLd.value)

const behaviorItems = computed(() => contentItems.value)

const resolvedBaseUrl = computed(() => {
  const value = baseUrl.value.trim()
  return value.length > 0 ? value : null
})

const resolveAbsoluteUrl = (item: DemoBreadcrumbItem): string | undefined => {
  const raw = typeof item.href === 'string' ? item.href : typeof item.to === 'string' ? item.to : undefined
  if (!raw) return undefined
  if (/^https?:\/\//.test(raw)) {
    return raw
  }
  const origin = resolvedBaseUrl.value
  if (!origin) {
    return raw
  }
  const trimmedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin
  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`
  return `${trimmedOrigin}${normalizedPath}`
}

const jsonLdPreview = computed(() => {
  const items = behaviorItems.value
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: resolveAbsoluteUrl(item)
      }))
    },
    null,
    2
  )
})

const accessibilityItems: DemoBreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Account', to: '/account' },
  { label: 'Settings' }
]

const ariaLabelOverride = ref('Account settings breadcrumb trail')

const wrapItems: DemoBreadcrumbItem[] = [
  { label: 'Enterprise cloud', to: '/enterprise' },
  { label: 'Service level agreements', to: '/enterprise/sla' },
  { label: 'Region-specific terms for multinational deployments' }
]

const externalItems: DemoBreadcrumbItem[] = [
  { label: 'Marketing', to: '/marketing' },
  { label: 'Campaigns', to: '/marketing/campaigns' },
  { label: 'Winter launch', href: 'https://external.example.com/winter-launch' }
]

const handleJsonLdToggle = (state: boolean) => {
  lastTogglePayload.value = state
}

const onBaseUrlInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  baseUrl.value = target.value
}

const onAriaLabelInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  ariaLabelOverride.value = target.value
}
</script>

