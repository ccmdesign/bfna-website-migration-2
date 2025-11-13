<template>
  <footer class="ccm-footer" role="contentinfo" :size="size" :style="cssVars">
    <div class="ccm-footer-container | center">
      <h1>Footer</h1>
      <ccm-by-line />
    </div>
  </footer>
</template>

<script setup lang="ts">
/**
 * Site footer component providing a consistent bottom section for pages.
 *
 * Renders a simple, token-driven footer area with configurable padding size and
 * background color via design tokens. Uses CUBE CSS conventions and semantic
 * tokens for theming. Intended as a base footer wrapper to compose richer
 * footer content as the design system evolves.
 *
 * @component ccmFooter
 * @category organism
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmFooter />
 *
 * @example Sizes
 * <div>
 *   <ccmFooter size="s" />
 *   <ccmFooter size="m" />
 *   <ccmFooter size="l" />
 * </div>
 *
 * @example Custom Background (Design Token)
 * <ccmFooter backgroundColor="color-neutral-950" />
 */
import { computed } from 'vue'

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Visual props
  /**
   * Background color token name (without var()). When provided, the footer
   * background will use the CSS variable `--<token>` via `var(--<token>)`.
   * Examples: `color-neutral-950`, `color-primary-tint-20`.
   * Default `transparent` leaves background unchanged.
   */
  backgroundColor: {
    type: String,
    default: 'transparent'
  },
  /**
   * Vertical padding size scale applied via CSS variables.
   * Valid values: `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl`.
   */
  size: {
    type: String,
    default: 'l'
  }
})

const cssVars = computed(() => {
  const vars = {}

  if (props.backgroundColor && props.backgroundColor !== 'transparent') {
    vars['--_ccm-footer-background-color'] = `var(--${props.backgroundColor})`
  }

  return vars
})
</script>

<style scoped>
.ccm-footer {
  --_ccm-footer-padding-block: var(--space-l);
  --_ccm-footer-background-color: var(--color-primary-tint-20);
}

.ccm-footer {
  padding-block: var(--_ccm-footer-padding-block);
  background-color: var(--_ccm-footer-background-color);
}

.ccm-footer[size="xs"]  { --_ccm-footer-padding-block: var(--space-xs);  }
.ccm-footer[size="s"]   { --_ccm-footer-padding-block: var(--space-s);   }
.ccm-footer[size="m"]   { --_ccm-footer-padding-block: var(--space-m);   }
.ccm-footer[size="l"]   { --_ccm-footer-padding-block: var(--space-l);   }
.ccm-footer[size="xl"]  { --_ccm-footer-padding-block: var(--space-xl);  }
.ccm-footer[size="2xl"] { --_ccm-footer-padding-block: var(--space-2xl); }
.ccm-footer[size="3xl"] { --_ccm-footer-padding-block: var(--space-3xl); }

</style>
