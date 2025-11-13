<template>
  <component
    :is="componentTag"
    class="ccm-breadcrumb"
    :variant="variant"
    :style="cssVars"
    :aria-label="ariaLabel || 'Breadcrumbs'"
    role="navigation"
  >
    <ol class="cluster">
      <li v-for="(item, index) in items" :key="index">
        <template v-if="index < items.length - 1">
          <nuxt-link
            :to="item.to"
            :aria-label="item.ariaLabel || item.label"
          >
            {{ item.label }}
          </nuxt-link>

          <span aria-hidden="true">
            <!-- Slot: separator — Separator between items. Use chevron/slash via prop or provide custom content. -->
            <slot name="separator">
              <span v-if="separator === 'chevron'" class="icon">{{ iconName }}</span>
              <span v-else-if="separator === 'slash'">/</span>
            </slot>
          </span>

        </template>

        <template v-else>
          <span class="ccm-breadcrumb__current" aria-current="page">
            {{ item.label }}
          </span>
        </template>
      </li>
    </ol>
  </component>
  
</template>

<script setup lang="ts">
/**
 * Breadcrumb navigation component communicating the user's location within the site hierarchy.
 *
 * Overview:
 * - Provides contextual navigation between parent routes without repeating the page title.
 * - Intended for layout headers and hero regions where consistent wayfinding is required.
 *
 * Usage:
 * - Do render before the primary `<h1>` to maintain sequential headings.
 * - Do hide breadcrumbs when a hierarchy has only one level to avoid noise.
 * - Don't combine with tertiary navigations (tabs, pills) in the same cluster.
 *
 * Anatomy:
 * - Wrapper `<component>` defaults to a `<nav>` landmark with `aria-label`.
 * - Ordered list `.cluster` spaces links via `--_ccm-breadcrumb-gap` (see `src/content/docs/guidelines/tokens.md`).
 * - The optional `#separator` slot renders an icon or slash and should align with `.icon` utility guidance.
 *
 * Accessibility:
 * - `aria-label` communicates the navigation purpose; the last item sets `aria-current="page"`.
 * - Separators are marked `aria-hidden="true"` so screen readers focus on the links.
 * - Optional JSON-LD `BreadcrumbList` improves SEO without affecting assistive tech behaviour.
 *
 * Content:
 * - Keep labels concise (≤4 words) and title case; mirror IA language from content governance docs.
 * - Avoid emojis or punctuation that would read awkwardly in assistive technologies.
 * - For icon separators, align with tone guidance in `src/content/docs/guidelines/documentation-governance.md`.
 *
 * Demo Variants:
 * - `variant="default"`, `size="s"`, chevron separator (baseline path).
 * - `variant="wrap"` with long labels to demonstrate multi-line wrapping behaviour.
 * - Custom separator slot example using `.icon` utility to show bespoke glyphs.
 *
 * @component ccmBreadcrumb
 * @category navigation
 * @standards all-10
 * @usage Pair with page headers and align spacing tokens via CUBE CSS utilities (`src/content/docs/guidelines/cube-css.md`).
 * @example Basic
 * <ccmBreadcrumb :items="[
 *   { label: 'Home', to: '/' },
 *   { label: 'Docs', to: '/docs' },
 *   { label: 'Components' }
 * ]" />
 *
 * @example Custom Separator
 * <ccmBreadcrumb
 *   separator="custom"
 *   :items="[
 *     { label: 'Home', to: '/' },
 *     { label: 'Library', to: '/library' },
 *     { label: 'Breadcrumb' }
 *   ]"
 * >
 *   <template #separator>
 *     <span class="icon">arrow_right_alt</span>
 *   </template>
 * </ccmBreadcrumb>
 */
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import ccmButton from '~/components/ds/molecules/ccmButton.vue'

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

/**
 * Shape for each breadcrumb trail entry consumed by the `items` prop.
 * Prefer `to` for internal Nuxt navigation and `href` for absolute destinations.
 */
interface BreadcrumbItem {
  label: string
  to?: string | RouteLocationRaw
  href?: string
  ariaLabel?: string
}

const props = defineProps({
  // Structural
  /**
   * Root element tag rendered by `<component>`. Defaults to `nav` for landmark semantics; switch to `div`
   * when placing the breadcrumb inside an existing `nav` or header.
   */
  is: { type: String, default: 'nav' },

  // Content
  /**
   * Ordered set of breadcrumb items. The final entry is surfaced as the current page (`aria-current`).
   * Provide `ariaLabel` when the visual label would be ambiguous or truncated.
   */
  items: { type: Array as PropType<BreadcrumbItem[]>, default: () => [] },

  // Visual
  /**
   * Link size forwarded to `ccmButton` (link variant). `s` keeps breadcrumbs compact; `m` aligns with hero headers
   * and increases spacing tokens applied to the `.cluster` wrapper.
   */
  size: { type: String as PropType<'s' | 'm'>, default: 's' },
  /**
   * Layout variant controlling line wrapping. Use `default` to keep all items on one line; use `wrap` to allow
   * multi-line breadcrumbs for deep IA while keeping tokens intact.
   */
  variant: { type: String as PropType<'default' | 'wrap'>, default: 'default' },
  /**
   * Separator presentation. `chevron` uses an icon glyph, `slash` renders `/`, and `custom` defers entirely to the
   * `#separator` slot. Custom separators should follow iconography rules from the design system.
   */
  separator: { type: String as PropType<'chevron' | 'slash' | 'custom'>, default: 'chevron' },
  /**
   * Icon glyph used when `separator` is `chevron`. Must map to a material/icon font name recognised by the `.icon` utility.
   */
  iconName: { type: String, default: 'chevron_right' },
  /**
   * Space token applied to inline padding on link items (`var(--space-{token})`). Reference semantic keys in
   * the tokens guideline to ensure consistency across navigation components.
   */
  itemPaddingInline: { type: String, default: '2xs' },

  // Accessibility
  /**
   * Aria-label describing the breadcrumb navigation. Override when multiple breadcrumb regions exist on a page
   * (e.g., admin + marketing shells) to keep landmarks unique.
   */
  ariaLabel: { type: String, default: 'Breadcrumbs' },

  // Behavior/SEO
  /**
   * Toggles schema.org `BreadcrumbList` JSON-LD injection via `useHead`. Disable when another breadcrumb script
   * already exists to avoid duplicate structured data in the document head.
   */
  includeJsonLd: { type: Boolean, default: true },
  /**
   * Absolute site origin used to convert relative `to`/`href` values into canonical URLs inside the JSON-LD payload.
   * Provide `null` to leave relative paths untouched (search engines may warn if they remain relative).
   */
  baseUrl: { type: String as PropType<string | null>, default: null }
})

const componentTag = computed(() => props.is || 'nav')

const cssVars = computed(() => ({
  '--_ccm-breadcrumb-gap': `var(--space-${props.size === 's' ? '2xs' : 'xs'})`,
  '--_ccm-breadcrumb-separator-color': 'var(--color-base-tint-40)',
  '--_ccm-breadcrumb-item-padding-inline': `var(--space-${props.itemPaddingInline})`
}))

const absoluteUrl = (it: BreadcrumbItem): string | undefined => {
  const raw = typeof it.href === 'string' ? it.href : typeof it.to === 'string' ? it.to : undefined
  if (!raw) return undefined
  if (/^https?:\/\//.test(raw)) return raw
  if (props.baseUrl) {
    try {
      const base = props.baseUrl.endsWith('/') ? props.baseUrl.slice(0, -1) : props.baseUrl
      const path = raw.startsWith('/') ? raw : `/${raw}`
      return `${base}${path}`
    } catch {
      return raw
    }
  }
  return raw
}

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: props.items.map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: it.label,
    item: absoluteUrl(it)
  }))
}))

// Inject JSON-LD into head reactively (unconditional composable call)
useHead(() => ({
  script: props.includeJsonLd
    ? [
        {
          key: 'ccm-breadcrumb-jsonld',
          type: 'application/ld+json',
          children: JSON.stringify(jsonLd.value)
        }
      ]
    : []
}))
</script>

<style scoped>
.ccm-breadcrumb {
  display: block;
  color: var(--color-primary);
  padding-top: var(--space-2xs);
}

.cluster { 
  --_cluster-space: 0; 
  align-items: baseline !important;
}

.icon {
  vertical-align: middle;
  opacity: 0.5;
  transform: translateY(-2px);
}


li > a {
  text-decoration: none;
  &:hover { text-decoration: underline; }
  &:visited { color: var(--color-primary); }
}

.ccm-breadcrumb__current {
  font-weight: var(--font-weight-bold);
}
</style>
