<template>
  <header
    class="ccm-hero"
    role="banner"
    :variant="variant"
    :hide-top="hideTop"
    :hide-bottom="hideBottom"
    :style="cssVars"
  >
    <!-- Top section with dedicated topbar slot -->
    <div class="ccm-hero__top | center">
      <!-- Dedicated topbar slot -->
      <slot name="top-bar">
        <ccm-topbar />
      </slot>

      <!-- Generic top slot for navigation, breadcrumbs, back links, etc. -->
      <slot name="top" />
    </div>

    <!-- Main content slot: heading, tagline, etc. -->
    <div class="ccm-hero__main | center">
      <slot>
        <hgroup>
          <h4 v-if="brow">{{ brow }}</h4>
          <h1 v-if="title">{{ title }}</h1>
          <h3 v-if="tagline">{{ tagline }}</h3>
        </hgroup>
      </slot>
    </div>

    <!-- Bottom slot: metadata, bylines, CTAs, etc. -->
    <div v-if="!hideBottom" class="ccm-hero__bottom | center">
      <slot name="bottom" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Hero section component for page headers and landing sections.
 *
 * A flexible banner component that provides structured slots for top navigation, main content,
 * and bottom metadata. Supports multiple layout variants (default, minimal, full-screen) and
 * size-based spacing. Uses semantic HTML with role="banner" for accessibility.
 *
 * Default variant uses 16:7 aspect ratio. Minimal removes aspect ratio constraints.
 * Full-screen variant stretches to 100vh for immersive landing experiences.
 *
 * @component ccmHero
 * @category organism
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmHero
 *   brow="Welcome"
 *   title="Hero Title"
 *   tagline="A compelling tagline that captures attention"
 * />
 *
 * @example With Slots
 * <ccmHero>
 *   <template #top-bar>
 *     <ccm-topbar />
 *   </template>
 *   <template #top>
 *     <nav>Breadcrumbs</nav>
 *   </template>
 *   <h1>Custom Heading</h1>
 *   <template #bottom>
 *     <ccm-byline author="John Doe" date="2025-01-01" />
 *   </template>
 * </ccmHero>
 *
 * @example Variants
 * <ccmHero variant="default" title="Default Hero" />
 * <ccmHero variant="minimal" title="Minimal Hero" />
 * <ccmHero variant="full-screen" title="Full Screen Hero" />
 *
 * @example Custom Background
 * <ccmHero
 *   title="Custom Background"
 *   backgroundColor="color-secondary"
 * />
 *
 * @example Size Variations
 * <ccmHero size="s" title="Small Padding" />
 * <ccmHero size="m" title="Medium Padding" />
 * <ccmHero size="l" title="Large Padding" />
 *
 * @example Hidden Sections
 * <ccmHero hide-top title="No Top Section" />
 * <ccmHero hide-bottom title="No Bottom Section" />
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Content props
  /** Optional eyebrow text displayed above the main title. Renders as h4 when provided. */
  brow: {
    type: String,
    default: ''
  },
  /** Main hero heading text. Renders as h1 when provided. Falls back to default slot if not provided. */
  title: {
    type: String,
    default: ''
  },
  /** Supporting tagline text displayed below the title. Renders as h3 when provided. */
  tagline: {
    type: String,
    default: ''
  },

  // Visual props
  /** Custom background color using CSS custom property name (without -- prefix). Overrides default background. */
  backgroundColor: {
    type: String,
    default: ''
  },
  /** Padding size following the s/m/l/xl scale. Controls vertical padding via --space-{size} token. Valid values: s, m, l, xl */
  size: {
    type: String,
    default: 'l'
  },
  /** Layout variant affecting aspect ratio and height. Valid values: default (16:7 aspect), minimal (auto height), full-screen (100vh) */
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'minimal', 'full-screen'].includes(value)
  },

  // Behavior props
  /** Hide the top section (top-bar and top slots). When true, top navigation and related content is hidden. */
  hideTop: {
    type: Boolean,
    default: false
  },
  /** Hide the bottom section (bottom slot). When true, bottom metadata and CTAs are hidden. Defaults to true. */
  hideBottom: {
    type: Boolean,
    default: true
  }
})

const cssVars = computed(() => {
  const vars = {}

  // Background color
  if (props.backgroundColor) {
    vars['--_ccm-hero-background-color'] = `var(--${props.backgroundColor})`
  }

  // Size-based padding
  vars['--_ccm-hero-padding-block'] = `var(--space-${props.size})`

  return vars
})
</script>

<style scoped>
/* ============================================
   CSS VARIABLES - DEFAULT VALUES
   ============================================ */
.ccm-hero {
  /* Layout */
  --_ccm-hero-aspect-ratio: 16 / 7;
  --_ccm-hero-padding-block: var(--space-l);
  --_ccm-hero-gap: var(--space-xs);

  /* Colors */
  --_ccm-hero-background-color: var(--color-primary-tint-20);
  --_ccm-hero-link-color: var(--link-color);
  --_ccm-hero-link-color-visited: var(--link-color-visited);

  /* Typography */
  --_ccm-hero-heading-font-family: inherit;
  --_ccm-hero-heading-font-weight: inherit;
  --_ccm-hero-heading-margin-block: initial;
  --_ccm-hero-link-font-size: var(--step-0);
}

/* ============================================
   BASE LAYOUT
   ============================================ */
.ccm-hero {
  background-color: var(--_ccm-hero-background-color);
  aspect-ratio: var(--_ccm-hero-aspect-ratio);
  display: flex;
  flex-direction: column;
}

.ccm-hero__top {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--_ccm-hero-gap);
}

.ccm-hero__main {
  width: 100%;
  display: flex;
  padding-block: var(--_ccm-hero-padding-block);
  align-items: center;
  flex: 1;
  text-wrap: balance;
}

.ccm-hero__bottom {
  padding-bottom: var(--_ccm-hero-padding-block);
}

/* Heading typography control */
.ccm-hero h1,
.ccm-hero h3,
.ccm-hero h4 {
  font-family: var(--_ccm-hero-heading-font-family);
  font-weight: var(--_ccm-hero-heading-font-weight);
  margin-block: var(--_ccm-hero-heading-margin-block);
}

/* Generic link styling for slotted content */
.ccm-hero a {
  color: var(--_ccm-hero-link-color);
  text-decoration: none;
  font-size: var(--_ccm-hero-link-font-size);
}

.ccm-hero a:hover {
  text-decoration: underline;
}

.ccm-hero a:visited {
  color: var(--_ccm-hero-link-color-visited);
}

/* ============================================
   VARIANT: MINIMAL
   ============================================ */
.ccm-hero[variant="minimal"] {
  --_ccm-hero-aspect-ratio: auto;
}

/* ============================================
   VARIANT: FULL-SCREEN
   ============================================ */
.ccm-hero[variant="full-screen"] {
  --_ccm-hero-aspect-ratio: auto;

  min-height: 100svh;
}

/* ============================================
   CONDITIONAL DISPLAY
   ============================================ */
.ccm-hero[hide-top="true"] .ccm-hero__top {
  display: none;
}

.ccm-hero[hide-bottom="true"] .ccm-hero__bottom {
  display: none;
}
</style>