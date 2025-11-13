<script setup lang="ts">
import type { PropDoc } from '~/utils/parseComponentDocs'

defineOptions({
  name: 'DocsPropsTable'
})

const props = defineProps({
  props: {
    type: Array as PropType<PropDoc[]>,
    required: true
  }
})

// Group props by category for better organization
const groupedProps = computed(() => {
  const groups = {
    structural: [] as PropDoc[],
    content: [] as PropDoc[],
    visual: [] as PropDoc[],
    accessibility: [] as PropDoc[],
    behavior: [] as PropDoc[],
    other: [] as PropDoc[]
  }

  props.props.forEach(prop => {
    const name = prop.name.toLowerCase()

    if (['is', 'to', 'href'].includes(name)) {
      groups.structural.push(prop)
    } else if (['label'].includes(name)) {
      groups.content.push(prop)
    } else if (['size', 'color', 'backgroundcolor', 'variant'].includes(name)) {
      groups.visual.push(prop)
    } else if (['arialabel', 'ispressed', 'isexpanded'].includes(name)) {
      groups.accessibility.push(prop)
    } else if (['disabled'].includes(name)) {
      groups.behavior.push(prop)
    } else {
      groups.other.push(prop)
    }
  })

  return groups
})

const hasGroupedProps = computed(() => {
  return Object.values(groupedProps.value).some(group => group.length > 0)
})

function formatGroupName(name: string): string {
  const names: Record<string, string> = {
    structural: 'Structural Props',
    content: 'Content Props',
    visual: 'Visual Props',
    accessibility: 'Accessibility Props',
    behavior: 'Behavior Props',
    other: 'Other Props'
  }
  return names[name] || name.charAt(0).toUpperCase() + name.slice(1)
}
</script>

<template>
  <div class="props-table">
    <!-- Grouped display -->
    <div v-if="hasGroupedProps" class="grouped-props">
      <div v-for="(group, groupName) in groupedProps" :key="groupName" class="prop-group">
        <div v-if="group.length > 0" class="group-section">
          <h3 class="group-title">{{ formatGroupName(groupName) }}</h3>
          <table class="props-table-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prop in group" :key="prop.name" class="prop-row">
                <td class="prop-name">
                  <code>{{ prop.name }}</code>
                </td>
                <td class="prop-type">
                  <code class="type-badge">{{ prop.type }}</code>
                </td>
                <td class="prop-default">
                  <code v-if="prop.defaultValue !== undefined" class="default-value">
                    {{ prop.defaultValue }}
                  </code>
                  <span v-else class="no-default">—</span>
                </td>
                <td class="prop-description">{{ prop.description }}</td>
                <td class="prop-required">
                  <span v-if="prop.required" class="required-badge">Yes</span>
                  <span v-else class="optional-badge">No</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Simple table display (fallback) -->
    <table v-else class="props-table-table">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prop in props.props" :key="prop.name" class="prop-row">
          <td class="prop-name">
            <code>{{ prop.name }}</code>
          </td>
          <td class="prop-type">
            <code class="type-badge">{{ prop.type }}</code>
          </td>
          <td class="prop-default">
            <code v-if="prop.defaultValue !== undefined" class="default-value">
              {{ prop.defaultValue }}
            </code>
            <span v-else class="no-default">—</span>
          </td>
          <td class="prop-description">{{ prop.description }}</td>
          <td class="prop-required">
            <span v-if="prop.required" class="required-badge">Yes</span>
            <span v-else class="optional-badge">No</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>

table {
  border-width: var(--border-width-thin);
  border-style: solid;
  border-color: var(--color-base-tint-10);
  border-radius: var(--radius-m);
  border-collapse: collapse;
  overflow: hidden;
}

th, td {
  border-bottom: 1px solid var(--color-base-tint-10);
  padding: var(--space-xs) var(--space-s);
}

.grouped-props {
  display: grid;
  gap: var(--space-l);
}

.group-section {
  display: grid;
  gap: var(--space-m);
}

.group-title {
  font-size: var(--size-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.props-table-table th {
  background-color: var(--color-base-tint-05);
  text-align: left;
  font-weight: var(--font-weight-bold);
  font-size: var(--size--1);
  color: var(--color-primary);
}

.prop-row {

}

.prop-row:last-child {
  border-bottom: none;
}

.prop-row td {
  padding: var(--space-s) var(--space-m);
  vertical-align: top;
}

.prop-name {
  font-family: var(--font-family-mono);
  width: 15%;
}

.prop-name code {
  background-color: var(--color-background);
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--1);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.prop-type {
  width: 15%;
}

.type-badge {
  background-color: var(--color-secondary);
  color: var(--color-white);
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--2);
  font-weight: var(--font-weight-medium);
}

.prop-default {
  width: 15%;
  font-family: var(--font-family-mono);
}

.default-value {
  background-color: var(--color-background);
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--1);
  color: var(--color-secondary);
}

.no-default {
  color: var(--color-base);
  font-style: italic;
}

.prop-description {
  width: 35%;
  line-height: 1.5;
  color: var(--color-secondary);
}

.prop-required {
  width: 10%;
  text-align: center;
}

.required-badge {
  background-color: var(--color-fail);
  color: var(--color-white);
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--2);
  font-weight: var(--font-weight-medium);
}

.optional-badge {
  background-color: var(--color-success);
  color: var(--color-white);
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--size--2);
  font-weight: var(--font-weight-medium);
}

/* Responsive design */
@media (max-width: 768px) {
  .props-table-table {
    font-size: var(--size--1);
  }

  .props-table-table th,
  .prop-row td {
    padding: var(--space-2xs) var(--space-s);
  }

  .prop-name,
  .prop-type,
  .prop-default,
  .prop-description,
  .prop-required {
    width: auto;
    display: block;
  }

  .prop-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-2xs);
    padding: var(--space-s);
  }

  .prop-row td {
    padding: 0;
    border-bottom: none;
  }

  .prop-row td::before {
    content: attr(data-label) ": ";
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
  }
}
</style>

