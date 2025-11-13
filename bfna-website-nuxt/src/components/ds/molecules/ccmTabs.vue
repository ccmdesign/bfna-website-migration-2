<template>
  <div class="ccm-tabs" :style="cssVars">
    <!-- Tab navigation -->
    <div
      ref="tablistRef"
      role="tablist"
      class="ccm-tabs__tablist"
      :aria-label="ariaLabel"
      @keydown="handleKeydown"
    >
      <ul class="ccm-tabs__navigation">
        <!-- Priority 1: JSON tabs prop -->
        <template v-if="tabs">
          <li
              v-for="(tab, index) in tabs"
              :key="tab.id || index"
              role="tab"
              :aria-selected="index === activeIndex"
              :aria-disabled="tab.disabled"
              :tabindex="index === activeIndex ? 0 : -1">
            <ccmButton 
              variant="link" 
              :disabled="tab.disabled"
              @click="selectTab(index)">
              {{ tab.label }}
            </ccmButton>
          </li>
        </template>
        
        <!-- Priority 2: User-provided navigation slot -->
        <!-- Custom navigation slot. Should contain <li> elements with <ccmButton> or other interactive elements. -->
        <template v-else-if="hasNavigationSlot">
          <slot name="navigation" />
        </template>
        
        <!-- Priority 3: Auto-generated fallback navigation -->
        <template v-else>
          <li
              v-for="(section, index) in contentSections"
              :key="getSectionId(section, index)"
              role="tab"
              :aria-selected="index === activeIndex"
              :tabindex="index === activeIndex ? 0 : -1">
            <ccmButton 
              variant="link"
              @click="selectTab(index)">
              {{ getSectionLabel(section, index) }}
            </ccmButton>
          </li>
        </template>
      </ul>
    </div>

    <!-- Tab content -->
    <div class="ccm-tabs__content">
      <!-- JSON tabs content -->
      <template v-if="tabs">
        <section
                 v-for="(tab, index) in tabs"
                 :key="tab.id || index"
                 role="tabpanel"
                 :hidden="index !== activeIndex"
                 v-html="/* eslint-disable vue/no-v-html */ tab.content">
        </section>
      </template>
      
      <!-- Slot content -->
      <!-- Custom content slot. Should contain <section> elements, one per tab. Sections can have data-label, id, or name attributes for auto-generated navigation labels. -->
      <template v-else>
        <slot name="content" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, useSlots } from 'vue'
import type { PropType } from 'vue'

/**
 * Tabs component following all 10 Component Standards.
 *
 * A flexible tabs component that supports three configuration modes: JSON tabs prop,
 * custom navigation/content slots, or auto-generated fallback navigation from content sections.
 * Provides full keyboard navigation (Arrow keys, Home, End, Enter/Space) and comprehensive
 * ARIA attributes for accessibility.
 *
 * Supports disabled tabs, external link detection, and programmatic tab selection.
 * Style-agnostic design relies on CSS variables for visual customization.
 *
 * @component ccmTabs
 * @category molecule
 * @standards all-10
 *
 * @example JSON Tabs
 * <ccmTabs
 *   :tabs="[
 *     { label: 'Tab 1', content: '<p>Content 1</p>' },
 *     { label: 'Tab 2', content: '<p>Content 2</p>' },
 *     { label: 'Tab 3', content: '<p>Content 3</p>' }
 *   ]"
 * />
 *
 * @example With Slots
 * <ccmTabs>
 *   <template #navigation>
 *     <li><ccmButton variant="link">Tab 1</ccmButton></li>
 *     <li><ccmButton variant="link">Tab 2</ccmButton></li>
 *   </template>
 *   <template #content>
 *     <section>Content 1</section>
 *     <section>Content 2</section>
 *   </template>
 * </ccmTabs>
 *
 * @example Auto-Generated Navigation
 * <ccmTabs>
 *   <template #content>
 *     <section data-label="First Tab">Content 1</section>
 *     <section id="second-tab">Content 2</section>
 *     <section>Content 3</section>
 *   </template>
 * </ccmTabs>
 *
 * @example With Default Tab
 * <ccmTabs
 *   :tabs="tabs"
 *   :defaultTab="1"
 * />
 *
 * @example Disabled Tab
 * <ccmTabs
 *   :tabs="[
 *     { label: 'Tab 1', content: '<p>Content 1</p>' },
 *     { label: 'Tab 2', content: '<p>Content 2</p>', disabled: true },
 *     { label: 'Tab 3', content: '<p>Content 3</p>' }
 *   ]"
 * />
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

// Tab data interface
interface TabData {
  id?: string
  label: string
  content: string
  name?: string
  disabled?: boolean
}

const props = defineProps({
  // Structural props
  /** Index of the initially active tab (0-based). Defaults to 0 (first tab). */
  defaultTab: { type: Number, default: 0 },

  // Accessibility props
  /** ARIA label for the tablist element. Provides accessible name for screen readers. Defaults to 'Tabs'. */
  ariaLabel: { type: String, default: 'Tabs' },

  // Content props
  /**
   * Array of tab objects for JSON-based configuration. Each tab object: { id?: string, label: string, content: string, name?: string, disabled?: boolean }.
   * When provided, automatically generates navigation and content panels. Takes priority over slots.
   * If null, component uses navigation/content slots or auto-generates navigation from content sections.
   */
  tabs: { type: Array as PropType<TabData[]>, default: null }
})

/**
 * Emitted when the active tab changes. Provides the new tab index (0-based).
 */
const emit = defineEmits(['change'])

// Get slots for checking content
const slots = useSlots()

// State
const tablistRef = ref(null)
const activeIndex = ref(props.defaultTab)
const tabItems = ref([])
const contentPanels = ref([])
const fallbackSections = ref([])

// CSS variables (minimal for functionality)
const cssVars = computed(() => ({
  // No visual styling variables - component is style-agnostic
}))

// Check if navigation slot has content
const hasNavigationSlot = computed(() => {
  return !!(slots.navigation && slots.navigation())
})

// Extract content sections for fallback navigation
const contentSections = computed(() => {
  if (props.tabs) return []
  
  // Return sections collected for fallback navigation
  return fallbackSections.value
})

// Helper methods for fallback navigation
const getSectionLabel = (section, index) => {
  // Priority 1: data-label attribute
  if (section.dataset && section.dataset.label) {
    return section.dataset.label
  }
  
  // Priority 2: id attribute (humanized)
  if (section.id) {
    return humanizeId(section.id)
  }
  
  // Priority 3: name attribute
  if (section.hasAttribute && section.hasAttribute('name')) {
    return section.getAttribute('name')
  }
  
  // Fallback: Tab {index}
  return `Tab ${index + 1}`
}

const getSectionId = (section, index) => {
  // Use existing id or generate one
  return section.id || `ccm-tabs-panel-${Date.now()}-${index}`
}

const humanizeId = (id) => {
  // Convert kebab-case to Title Case
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/(^|\s)\S/g, l => l.toUpperCase())
    .trim()
}

// Initialize tab mapping
const initializeTabs = async () => {
  await nextTick()
  
  if (!tablistRef.value) return

  // If using JSON tabs, no need to map DOM elements
  if (props.tabs) {
    // JSON tabs handle their own setup in template
    return
  }

  // Get all li elements in navigation
  const navItems = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li')
  const contentSections = tablistRef.value.parentElement.querySelectorAll('.ccm-tabs__content section')

  // Check if we need fallback navigation (no navigation slot content)
  if (!hasNavigationSlot.value && contentSections.length > 0) {
    // Store sections for fallback navigation
    fallbackSections.value = Array.from(contentSections)
    
    // Set up fallback navigation attributes
    setupFallbackTabAttributes()
    return
  }

  // Filter out external links (li elements that contain anchor tags with href)
  tabItems.value = Array.from(navItems).filter((li, _index) => {
    const anchor = li.querySelector('a[href]')
    if (anchor && anchor.getAttribute('href').startsWith('http')) {
      // This is an external link, mark it and exclude from tab functionality
      li.setAttribute('data-external-link', 'true')
      return false
    }
    return true
  })

  // Map content panels
  contentPanels.value = Array.from(contentSections)

  // Set up IDs and ARIA attributes
  setupTabAttributes()
}

// Setup accessibility attributes
const setupTabAttributes = () => {
  tabItems.value.forEach((tab, index) => {
    const tabId = `ccm-tabs-${Date.now()}-${index}`
    const panelId = `ccm-tabs-panel-${Date.now()}-${index}`

    // Set tab attributes
    tab.setAttribute('role', 'tab')
    tab.setAttribute('id', tabId)
    tab.setAttribute('aria-controls', panelId)
    tab.setAttribute('aria-selected', index === activeIndex.value ? 'true' : 'false')
    tab.setAttribute('tabindex', index === activeIndex.value ? '0' : '-1')

    // Make tab focusable and clickable
    if (!tab.hasAttribute('data-external-link')) {
      tab.style.cursor = 'pointer'
      tab.addEventListener('click', () => selectTab(index))
    }

    // Set corresponding panel attributes
    if (contentPanels.value[index]) {
      const panel = contentPanels.value[index]
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('id', panelId)
      panel.setAttribute('aria-labelledby', tabId)
      panel.setAttribute('tabindex', index === activeIndex.value ? '0' : '-1')
      panel.hidden = index !== activeIndex.value
    }
  })
}

// Setup accessibility attributes for fallback navigation
const setupFallbackTabAttributes = () => {
  // Set up section attributes for fallback navigation
  fallbackSections.value.forEach((section, index) => {
    const panelId = getSectionId(section, index)

    // Set section (panel) attributes
    section.setAttribute('role', 'tabpanel')
    section.setAttribute('id', panelId)
    section.setAttribute('tabindex', index === activeIndex.value ? '0' : '-1')
    section.hidden = index !== activeIndex.value
  })
}

// Select a tab
const selectTab = (index) => {
  // Check bounds based on current mode
  const maxTabs = props.tabs ? props.tabs.length : 
                 (fallbackSections.value.length > 0 ? fallbackSections.value.length : tabItems.value.length)
  
  if (index < 0 || index >= maxTabs) return

  // Update previous state
  if (props.tabs) {
    // JSON tabs - update DOM directly
    const prevPanels = tablistRef.value.parentElement.querySelectorAll('.ccm-tabs__content section[role="tabpanel"]')
    const newPanels = tablistRef.value.parentElement.querySelectorAll('.ccm-tabs__content section[role="tabpanel"]')
    
    if (prevPanels[activeIndex.value]) {
      prevPanels[activeIndex.value].hidden = true
      prevPanels[activeIndex.value].setAttribute('tabindex', '-1')
    }
    
    if (newPanels[index]) {
      newPanels[index].hidden = false
      newPanels[index].setAttribute('tabindex', '0')
    }
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation
    const prevSection = fallbackSections.value[activeIndex.value]
    const newSection = fallbackSections.value[index]
    
    if (prevSection) {
      prevSection.hidden = true
      prevSection.setAttribute('tabindex', '-1')
    }
    
    if (newSection) {
      newSection.hidden = false
      newSection.setAttribute('tabindex', '0')
    }
  } else {
    // Traditional slot-based navigation
    const prevTab = tabItems.value[activeIndex.value]
    const prevPanel = contentPanels.value[activeIndex.value]
    
    if (prevTab) {
      prevTab.setAttribute('aria-selected', 'false')
      prevTab.setAttribute('tabindex', '-1')
    }
    
    if (prevPanel) {
      prevPanel.hidden = true
      prevPanel.setAttribute('tabindex', '-1')
    }
  }

  // Update active index
  activeIndex.value = index

  // Update new state and focus
  if (props.tabs) {
    // JSON tabs - focus the button
    const newTabButton = tablistRef.value.querySelector(`.ccm-tabs__navigation li:nth-child(${index + 1}) ccm-button`)
    if (newTabButton) {
      newTabButton.focus()
    }
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation - focus the button
    const newTabButton = tablistRef.value.querySelector(`.ccm-tabs__navigation li:nth-child(${index + 1}) ccm-button`)
    if (newTabButton) {
      newTabButton.focus()
    }
  } else {
    // Traditional navigation
    const newTab = tabItems.value[index]
    if (newTab) {
      newTab.setAttribute('aria-selected', 'true')
      newTab.setAttribute('tabindex', '0')
      newTab.focus()
    }
  }

  emit('change', index)
}

// Keyboard navigation
const handleKeydown = (event) => {
  const target = event.target
  
  // Find current index based on mode
  let currentIndex = -1
  
  if (props.tabs) {
    // JSON tabs mode
    const tabButtons = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')
    currentIndex = Array.from(tabButtons).findIndex(button => button === target)
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation mode
    const tabButtons = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')
    currentIndex = Array.from(tabButtons).findIndex(button => button === target)
  } else {
    // Traditional slot-based navigation
    currentIndex = tabItems.value.findIndex(tab => tab === target)
  }

  if (currentIndex === -1) return

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      focusNextTab(currentIndex)
      break

    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousTab(currentIndex)
      break

    case 'Home':
      event.preventDefault()
      focusFirstTab()
      break

    case 'End':
      event.preventDefault()
      focusLastTab()
      break

    case 'Enter':
    case ' ':
      event.preventDefault()
      selectTab(currentIndex)
      break
  }
}

// Focus management
const focusNextTab = (currentIndex) => {
  let nextIndex, targetElement
  
  if (props.tabs) {
    // JSON tabs mode
    nextIndex = (currentIndex + 1) % props.tabs.length
    targetElement = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')[nextIndex]
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation mode
    nextIndex = (currentIndex + 1) % fallbackSections.value.length
    targetElement = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')[nextIndex]
  } else {
    // Traditional slot-based navigation
    nextIndex = (currentIndex + 1) % tabItems.value.length
    targetElement = tabItems.value[nextIndex]
  }
  
  if (targetElement) {
    targetElement.focus()
  }
}

const focusPreviousTab = (currentIndex) => {
  let prevIndex, targetElement
  
  if (props.tabs) {
    // JSON tabs mode
    prevIndex = currentIndex === 0 ? props.tabs.length - 1 : currentIndex - 1
    targetElement = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')[prevIndex]
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation mode
    prevIndex = currentIndex === 0 ? fallbackSections.value.length - 1 : currentIndex - 1
    targetElement = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')[prevIndex]
  } else {
    // Traditional slot-based navigation
    prevIndex = currentIndex === 0 ? tabItems.value.length - 1 : currentIndex - 1
    targetElement = tabItems.value[prevIndex]
  }
  
  if (targetElement) {
    targetElement.focus()
  }
}

const focusFirstTab = () => {
  let targetElement
  
  if (props.tabs) {
    // JSON tabs mode
    targetElement = tablistRef.value.querySelector('.ccm-tabs__navigation li ccm-button')
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation mode
    targetElement = tablistRef.value.querySelector('.ccm-tabs__navigation li ccm-button')
  } else {
    // Traditional slot-based navigation
    if (tabItems.value.length > 0) {
      targetElement = tabItems.value[0]
    }
  }
  
  if (targetElement) {
    targetElement.focus()
  }
}

const focusLastTab = () => {
  let targetElement
  
  if (props.tabs) {
    // JSON tabs mode
    const buttons = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')
    targetElement = buttons[buttons.length - 1]
  } else if (fallbackSections.value.length > 0) {
    // Fallback navigation mode
    const buttons = tablistRef.value.querySelectorAll('.ccm-tabs__navigation li ccm-button')
    targetElement = buttons[buttons.length - 1]
  } else {
    // Traditional slot-based navigation
    if (tabItems.value.length > 0) {
      targetElement = tabItems.value[tabItems.value.length - 1]
    }
  }
  
  if (targetElement) {
    targetElement.focus()
  }
}

// Watch for defaultTab changes
watch(() => props.defaultTab, (newValue) => {
  if (newValue !== activeIndex.value) {
    selectTab(newValue)
  }
})

// Initialize on mount
onMounted(() => {
  initializeTabs()
})

// Expose methods
defineExpose({
  selectTab,
  activeIndex: computed(() => activeIndex.value)
})
</script>

<style scoped>
/* Style-agnostic component - only essential styles for functionality */
.ccm-tabs {
  /* No visual styling - component is style-agnostic */
}

.ccm-tabs__tablist {
  /* No visual styling - only semantic structure */
}

.ccm-tabs__navigation {
  /* Reset list styles for proper tab functionality */
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
}

.ccm-tabs__navigation li {
  /* Make tabs focusable and interactive */
  position: relative;
}

.ccm-tabs__navigation li[role='tab'] {
  /* Ensure tabs are properly positioned for focus styles */
  outline: none;
}

.ccm-tabs__navigation li:focus-visible {
  /* Minimal focus indicator for accessibility */
  outline: 2px solid Highlight;
  outline-offset: 2px;
}

.ccm-tabs__navigation li[data-external-link='true'] {
  /* External links maintain default link behavior */
  cursor: pointer;
}

.ccm-tabs__navigation li[data-external-link='true'] a {
  /* Ensure external links are properly styled */
  text-decoration: underline;
  color: inherit;
}

.ccm-tabs__content {
  /* No visual styling - only semantic structure */
}

.ccm-tabs__content section[role='tabpanel'] {
  /* No visual styling - panels are shown/hidden via hidden attribute */
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  /* Remove any potential transitions */
}
</style>
