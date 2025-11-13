<template>
  <div class="enhanced-hybrid-layout">
    <!-- Dynamic Hero Section -->
    <slot name="hero">
      <ccmHero
        :background-color="heroAttrs.backgroundColor"
        :size="heroAttrs.size"
        :hide-topbar="heroAttrs.hideTopbar"
      >
        <hgroup>
          <p v-if="heroAttrs.brow" class="brow">{{ heroAttrs.brow }}</p>
          <h1>{{ heroAttrs.title }}</h1>
          <p v-if="heroAttrs.tagline" class="tagline">{{ heroAttrs.tagline }}</p>
        </hgroup>

        <template #bottom>
          <!-- Hero Actions Slot -->
          <slot name="hero-actions">
            <div class="hero-actions">
              <ccmButton 
                v-if="docsPath" 
                :to="docsPath" 
                variant="ghost" 
                size="s"
              >
                📖 View Documentation
              </ccmButton>
              <ccmButton 
                v-if="demoPath" 
                :to="demoPath" 
                variant="ghost" 
                size="s"
              >
                🎨 Try Interactive Demo
              </ccmButton>
            </div>
          </slot>

          <!-- Status Chips -->
          <div v-if="showStatusChips" class="hero-chips">
            <ccmChip 
              v-if="chipAttrs.status" 
              :label="chipAttrs.status" 
              :color="getStatusColor(chipAttrs.status)" 
              size="s" 
            />
            <ccmChip 
              v-if="chipAttrs.priority" 
              :label="chipAttrs.priority" 
              :color="getPriorityColor(chipAttrs.priority)" 
              size="s" 
            />
            <ccmChip 
              v-if="chipAttrs.category" 
              :label="chipAttrs.category" 
              :color="getCategoryColor(chipAttrs.category)" 
              size="s" 
            />
          </div>
        </template>
      </ccmHero>
    </slot>

    <!-- Main Content Area -->
    <div class="layout-content">
      <!-- Sidebar Navigation -->
      <aside v-if="showSidebar" class="layout-sidebar">
        <nav class="sidebar-nav">
          <div class="stack">
            <!-- Navigation Sections -->
            <slot name="sidebar-nav">
              <!-- Component Navigation -->
              <div v-if="components.length" class="nav-section">
                <h3>Components</h3>
                <ul class="stack">
                  <li v-for="component in components" :key="component.path">
                    <ccmButton 
                      :to="component.path" 
                      variant="link" 
                      size="s"
                      :class="{ 'nav-active': isActive(component.path) }"
                    >
                      {{ component.title || component.path.split('/').pop() }}
                    </ccmButton>
                  </li>
                </ul>
              </div>

              <!-- Page Navigation -->
              <div v-if="pageSections.length" class="nav-section">
                <h3>On This Page</h3>
                <ul class="stack">
                  <li v-for="section in pageSections" :key="section.id">
                    <ccmButton 
                      :to="`#${section.id}`" 
                      variant="link" 
                      size="s"
                    >
                      {{ section.title }}
                    </ccmButton>
                  </li>
                </ul>
              </div>
            </slot>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="layout-main" :class="{ 'full-width': !showSidebar }">
        <div class="main-content">
          <!-- Demo Section -->
          <ccm-section v-if="hasDemoSlot" class="demo-section">
            <slot name="demo">
              <div class="stack">
                <h2>Interactive Demo</h2>
                <p class="description">Try the component interactively</p>
                <slot />
              </div>
            </slot>
          </ccm-section>

          <!-- Documentation Section -->
          <ccm-section v-if="currentDoc" class="documentation-section prose">
            <slot name="documentation">
              <div class="stack">
                <h2>Documentation</h2>
                <ContentRenderer :value="currentDoc" />
              </div>
            </slot>
          </ccm-section>

          <!-- Additional Content Sections -->
          <ccm-section v-if="hasAdditionalContent" class="additional-content">
            <slot name="additional" />
          </ccm-section>

          <!-- Fallback -->
          <ccm-section v-if="!hasDemoSlot && !currentDoc && !hasAdditionalContent" class="fallback-content">
            <div class="stack">
              <h2>No Content Available</h2>
              <p>This page doesn't have any demo or documentation content yet.</p>
              <ccmButton to="/docs" variant="primary">Back to Documentation</ccmButton>
            </div>
          </ccm-section>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <ccmFooter class="layout-footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

// Props for layout configuration
const props = defineProps({
  // Hero configuration
  heroTitle: { type: String, default: '' },
  heroDescription: { type: String, default: '' },
  heroBrow: { type: String, default: '' },
  heroBackgroundColor: { type: String, default: 'color-primary-tint-20' },
  heroSize: { type: String, default: 'l' },
  heroHideTopbar: { type: Boolean, default: false },
  
  // Content configuration
  docsPath: { type: String, default: null },
  demoPath: { type: String, default: null },
  showSidebar: { type: Boolean, default: true },
  showStatusChips: { type: Boolean, default: true },
  
  // Content fetching
  contentSlug: { type: String, default: null },
  contentType: { type: String, default: 'docs' }
})

// Get current route
const route = useRoute()
const slots = useSlots()

// State for hero configuration
const heroState = useState('hero', () => null)

// Fetch content based on props or route
const { data: currentDoc } = await useAsyncData(`enhanced-hybrid-${props.contentSlug || route.path}`, () => {
  if (props.contentSlug) {
    return queryCollection(props.contentType).path(`/${props.contentType}/${props.contentSlug}`).first()
  }
  // Try to fetch based on current route
  const path = route.path.startsWith('/') ? route.path.slice(1) : route.path
  return queryCollection('docs').path(`/${path}`).first()
})

// Fetch all docs for navigation
const { data: allDocs } = await useAsyncData('enhanced-hybrid-docs', () => {
  return queryCollection('docs').all()
})

// Computed properties
const components = computed(() => {
  // Filter docs that have component implementations
  return allDocs.value?.filter(doc => doc.hasComponent === true) || []
})

const heroAttrs = computed(() => {
  const doc = currentDoc.value as any
  
  // Use props first, then doc frontmatter, then route meta, then state
  return {
    brow: props.heroBrow || doc?.hero?.brow || route.meta.hero?.brow || heroState.value?.brow || 'Documentation',
    title: props.heroTitle || doc?.hero?.title || doc?.title || route.meta.hero?.title || heroState.value?.title || 'Documentation',
    tagline: props.heroDescription || doc?.hero?.tagline || doc?.description || route.meta.hero?.tagline || heroState.value?.tagline || '',
    backgroundColor: props.heroBackgroundColor || doc?.hero?.backgroundColor || 'color-primary-tint-20',
    size: props.heroSize || doc?.hero?.size || 'l',
    hideTopbar: props.heroHideTopbar || doc?.hero?.hideTopbar || false
  }
})

const chipAttrs = computed(() => {
  const doc = currentDoc.value as any
  return {
    status: doc?.status || 'Unknown',
    priority: doc?.priority || 'Normal',
    category: doc?.category || 'General',
    hasDocs: doc?.hasDocs !== undefined ? doc.hasDocs : true,
    published: doc?.published !== undefined ? doc.published : true
  }
})

// Check if slots have content
const hasDemoSlot = computed(() => !!slots.demo || !!slots.default)
const hasAdditionalContent = computed(() => !!slots.additional)

// Page sections for navigation (extracted from headings)
const pageSections = computed(() => {
  // This would be implemented to extract headings from the content
  // For now, return empty array
  return []
})

// Helper functions
const isActive = (path: string) => {
  return route.path === path
}

const getStatusColor = (status: string) => {
  const colors = {
    'To Do': 'warning',
    'Draft': 'neutral', 
    'MVP': 'info',
    'Ready': 'success',
    'Implemented': 'success'
  }
  return colors[status] || 'neutral'
}

const getPriorityColor = (priority: string) => {
  const colors = {
    'High': 'error',
    'Normal': 'warning',
    'Low': 'info'
  }
  return colors[priority] || 'neutral'
}

const getCategoryColor = (category: string) => {
  const colors = {
    'Content Display': 'info',
    'Navigation': 'primary',
    'Forms': 'warning',
    'Layout': 'neutral',
    'Interactive': 'success',
    'General': 'neutral'
  }
  return colors[category] || 'neutral'
}

// Set page meta
useHead({
  title: `${heroAttrs.value.title} - Documentation`,
  meta: [
    { name: 'description', content: heroAttrs.value.tagline }
  ]
})
</script>

<style scoped>
.enhanced-hybrid-layout {
  min-height: 100svh;
  display: grid;
  grid-template: "hero" auto "content" 1fr "footer" auto / 1fr;
}

.layout-content {
  grid-area: content;
  display: flex;
  gap: var(--space-l);
  padding: var(--space-l);
}

.layout-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.layout-main {
  flex: 1;
  min-width: 0;
}

.layout-main.full-width {
  flex: 1;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.hero-actions {
  display: flex;
  gap: var(--space-s);
  margin-bottom: var(--space-m);
}

.hero-chips {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.nav-section {
  margin-bottom: var(--space-l);
}

.nav-section h3 {
  font-size: var(--size-0);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-s);
  color: var(--color-base-tint-20);
}

.nav-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.demo-section,
.documentation-section,
.additional-content,
.fallback-content {
  padding: var(--space-l);
  background: var(--color-white);
  border-radius: var(--radius-m);
}

.demo-section h2,
.documentation-section h2,
.additional-content h2,
.fallback-content h2 {
  margin-bottom: var(--space-m);
}

.description {
  color: var(--color-base-tint-30);
  margin-bottom: var(--space-l);
}

.prose {
  /* Prose styles would be inherited from global CSS */
}

@media (max-width: 768px) {
  .layout-content {
    flex-direction: column;
    padding: var(--space-m);
  }
  
  .layout-sidebar {
    width: 100%;
    order: 2;
  }
  
  .layout-main {
    order: 1;
  }
}
</style>
