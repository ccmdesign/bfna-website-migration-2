<template>
  <div class="simple-filters">
    <div class="simple-filters__wrapper">
      <input
        v-for="filter in filters"
        :id="`filter-${filter.value}`"
        :key="filter.value"
        v-model="checkedFilters"
        type="checkbox"
        :value="filter.value"
        :data-filter-value="filter.value"
        @change="handleCheckboxChange(filter.value)"
      />
      <label
        v-for="filter in filters"
        :key="`label-${filter.value}`"
        :data-filter-workstream="filter.value"
        :class="['simple-filters__item', `filter--${filter.value}`]"
        :for="`filter-${filter.value}`"
        >{{ filter.label }}</label
      >
    </div>

    <form class="form">
      <div class="select simple-filters__mobile">
        <select v-model="selectedMobileFilter" @change="handleMobileChange">
          <option
            v-for="filter in filters"
            :key="filter.value"
            :data-filter-workstream="filter.value"
            :value="`filter-${filter.value}`"
            >{{ filter.label }}</option
          >
        </select>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useCardFilters } from '~/composables/legacy/useCardFilters'
import { useUpdatesFilters } from '~/composables/legacy/useUpdatesFilters'

const props = defineProps<{
  filters: Array<{ value: string; label: string }>
  contentType?: 'publications' | 'videos' | 'infographics' | 'podcasts'
}>()

const emit = defineEmits<{
  filterChange: [filters: string[]]
}>()

const cardFilters = useCardFilters()
const updatesFilters = props.contentType ? useUpdatesFilters() : null
const checkedFilters = ref<string[]>([])
const selectedMobileFilter = ref<string>('')

const handleCheckboxChange = (filterValue: string) => {
  const allCheckboxes = document.querySelectorAll(
    `[id^=filter-${filterValue}]`
  ) as NodeListOf<HTMLInputElement>

  if (checkedFilters.value.includes(filterValue)) {
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = true
    })
    if (updatesFilters && props.contentType) {
      updatesFilters.setFilter(props.contentType, filterValue)
    } else {
      cardFilters.addFilter(filterValue)
    }
  } else {
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
    if (updatesFilters && props.contentType) {
      updatesFilters.clearFilter(props.contentType, filterValue)
    } else {
      cardFilters.removeFilter(filterValue)
    }
  }

  const activeFiltersArray = updatesFilters && props.contentType
    ? updatesFilters.activeFilters.value[props.contentType] || []
    : [...cardFilters.activeFilters.value]
  emit('filterChange', activeFiltersArray)
}

const handleMobileChange = () => {
  const selects = document.querySelectorAll(
    '.simple-filters__mobile select'
  ) as NodeListOf<HTMLSelectElement>

  selects.forEach((select) => {
    select.value = selectedMobileFilter.value
  })

  const selectedOption = document.querySelector(
    `option[value="${selectedMobileFilter.value}"]`
  ) as HTMLOptionElement | null

  if (selectedOption) {
    const workstream = selectedOption.getAttribute('data-filter-workstream')
    if (workstream) {
      if (updatesFilters && props.contentType) {
        updatesFilters.clearAllFilters()
        updatesFilters.setFilter(props.contentType, workstream)
        checkedFilters.value = [workstream]
        emit('filterChange', [workstream])
      } else {
        cardFilters.cleanFilters()
        cardFilters.addFilter(workstream)
        checkedFilters.value = [workstream]
        emit('filterChange', [...cardFilters.activeFilters.value])
      }
    }
  }
}

onMounted(() => {
  if (updatesFilters && props.contentType) {
    updatesFilters.initializeFilters()
    const activeFiltersArray = updatesFilters.activeFilters.value[props.contentType] || []
    checkedFilters.value = activeFiltersArray

    activeFiltersArray.forEach((item) => {
      const checkboxes = document.querySelectorAll(
        `[id^=filter-${item}]`
      ) as NodeListOf<HTMLInputElement>
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true
      })

      const selects = document.querySelectorAll(
        '.simple-filters__mobile select'
      ) as NodeListOf<HTMLSelectElement>
      selects.forEach((select) => {
        select.value = `filter-${item}`
      })
      selectedMobileFilter.value = `filter-${item}`
    })
  } else {
    cardFilters.initializeFilters()
    checkedFilters.value = [...cardFilters.activeFilters.value]

    const activeFiltersArray = [...cardFilters.activeFilters.value]
    activeFiltersArray.forEach((item) => {
      const checkboxes = document.querySelectorAll(
        `[id^=filter-${item}]`
      ) as NodeListOf<HTMLInputElement>
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true
      })

      const selects = document.querySelectorAll(
        '.simple-filters__mobile select'
      ) as NodeListOf<HTMLSelectElement>
      selects.forEach((select) => {
        select.value = `filter-${item}`
      })
      selectedMobileFilter.value = `filter-${item}`
    })
  }
})
</script>

