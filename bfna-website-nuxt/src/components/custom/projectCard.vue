<!--
  projectCard - Domain wrapper for ccmCard

  Purpose: Transforms project data structure into card content format
  and adds project-specific visual treatments.

  When to use this wrapper instead of ccmCard directly:
  - ✅ You need to customize internal CSS variables (--_ccm-card-*)
  - ✅ You need to transform object structure (project data → card content)
  - ✅ You need to inject custom markup via slots
  - ❌ Simple token changes (size, variant) - use ccmCard directly
  - ❌ Simple content conditionals - ccmCard handles these
-->

<template>
  <ccmCard
    :to="computedLink"
    :size="size"
    :variant="computedVariant"
    :backgroundColor="backgroundColor"
    :aria-label="content.title"
    :style="projectVars"
  >
    <!-- Override image slot for project-specific thumbnail treatment -->
    <template #image>
      <div class="project-card__thumbnail">
        <img
          v-if="content.thumbnail"
          :src="content.thumbnail"
          :alt="content.title"
        />
        <div v-else class="project-card__thumbnail-placeholder">
          {{ content.title?.charAt(0) || 'P' }}
        </div>

        <!-- Featured badge -->
        <span v-if="content.featured" class="project-card__badge">
          Featured
        </span>
      </div>
    </template>

    <!-- Use default slot for card text content -->
    <template #default>
      <div
class="stack" style="

--stack-gap: var(--space-xs)">
        <h3 class="project-card__title">{{ content.title }}</h3>

        <!-- Truncated description -->
        <p class="project-card__description">
          {{ truncatedDescription }}
        </p>

        <!-- Tech stack badges -->
        <div
          v-if="content.tech_stack?.length"
          class="cluster project-card__stack"
          style="

--cluster-gap: var(--space-2xs)"
        >
          <span
            v-for="tech in content.tech_stack.slice(0, 3)"
            :key="tech"
            class="project-card__tech-badge"
          >
            {{ tech }}
          </span>
          <span v-if="content.tech_stack.length > 3" class="project-card__tech-badge">
            +{{ content.tech_stack.length - 3 }}
          </span>
        </div>
      </div>
    </template>

    <!-- Override action slot for project-specific CTA -->
    <template #action>
      <div
class="cluster" style="

--cluster-gap: var(--space-s)">
        <span class="project-card__action-text">View Project</span>

        <!-- External link indicators -->
        <div
class="cluster" style="

--cluster-gap: var(--space-2xs)">
          <span v-if="content.github_url" class="project-card__link-icon" title="GitHub">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </span>
          <span v-if="content.live_url" class="project-card__link-icon" title="Live Demo">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM5.78 8.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm2.44 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm2.5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
            </svg>
          </span>
        </div>
      </div>
    </template>
  </ccmCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTruncate } from '~/composables/useTruncate'
import { useSlugify } from '~/composables/useSlugify'
import ccmCard from '~/components/ds/organisms/ccmCard.vue'

/**
 * Project data structure
 * This is the domain-specific interface for project data
 */
interface ProjectData {
  title: string
  description?: string
  thumbnail?: string
  slug?: string
  github_url?: string
  live_url?: string
  tech_stack?: string[]
  featured?: boolean
}

const props = defineProps({
  // Domain content (required)
  content: {
    type: Object as PropType<ProjectData>,
    required: true,
    validator: (value: ProjectData) => {
      // Minimum validation: must have a title
      return !!value.title
    }
  },

  // Design props (forwarded to ccmCard)
  size: {
    type: String as PropType<'s' | 'm' | 'l' | 'xl'>,
    default: 'l'
  },
  variant: {
    type: String as PropType<'default' | 'minimal' | 'featured'>,
    default: null // Computed based on content.featured
  },
  backgroundColor: {
    type: String,
    default: 'color-primary-tint-20'
  }
})

// ============================================================
// Secondary Layer: Data transformation & business logic
// ============================================================

/**
 * Truncate description with composable
 * Example of acceptable in-component data massage
 */
const truncatedDescription = computed(() => {
  const description = props.content.description || 'No description available'
  return useTruncate(description, 120)
})

/**
 * Generate fallback link if slug is missing
 * Example of composable-based fallback
 */
const { slugify } = useSlugify()
const computedLink = computed(() => {
  return props.content.slug || `/projects/${slugify(props.content.title)}`
})

/**
 * Auto-detect variant based on featured status
 * Business logic: featured projects get visual distinction
 */
const computedVariant = computed(() => {
  if (props.variant) return props.variant
  return props.content.featured ? 'featured' : 'default'
})

/**
 * Project-specific CSS variables
 * This is why we use a wrapper: custom internal variable manipulation
 */
const projectVars = computed(() => ({
  // Override ccmCard internal variables for project-specific styling
  '--_ccm-card-border-color': props.content.featured
    ? 'var(--color-accent)'
    : 'var(--color-primary-tint-40)',
  '--_ccm-card-border-width': props.content.featured ? '3px' : '2px',

  // Additional project-specific variables
  '--_project-card-accent': props.content.featured
    ? 'var(--color-accent)'
    : 'transparent'
}))
</script>

<style scoped>
/*
  Project-specific styles
  These extend ccmCard without recreating its base structure
*/

.project-card__thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--color-primary-tint-10);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.project-card__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card__thumbnail-placeholder {
  font-size: var(--size-4);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-tint-60);
}

.project-card__badge {
  position: absolute;
  top: var(--space-s);
  right: var(--space-s);
  background-color: var(--color-accent);
  color: var(--color-white);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--border-radius-s);
  font-size: var(--size--1);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-card__title {
  font-size: var(--size-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0;
}

.project-card__description {
  font-size: var(--size-0);
  color: var(--color-base-tint-60);
  margin: 0;
  line-height: 1.5;
}

.project-card__stack {
  margin-top: var(--space-xs);
}

.project-card__tech-badge {
  display: inline-block;
  padding: var(--space-3xs) var(--space-2xs);
  background-color: var(--color-primary-tint-10);
  color: var(--color-primary);
  border-radius: var(--border-radius-s);
  font-size: var(--size--1);
  font-weight: var(--font-weight-medium);
}

.project-card__action-text {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.project-card__link-icon {
  display: inline-flex;
  color: var(--color-primary-tint-60);
  transition: color 0.2s ease;
}

.project-card__link-icon:hover {
  color: var(--color-primary);
}
</style>
