<template>
  <div v-if="modelValue" class="off-canvas" style="z-index: 5;">
    <div class="menu-nav | main-nav">
      <div class="main-nav__top-actions">
        <button class="off-canvas__close" @click="close">
          <i class="material-icons">close</i>
        </button>
        <hgroup class="field-group">
          <input v-model="searchQuery" class="search menu-search__input" type="text" placeholder="Search" @keyup.enter="handleSearch" />
          <button class="button button--primary | submit menu-search__submit" type="button" @click="handleSearch">Search</button>
        </hgroup>
      </div>
      <LegacyOrganismsMainNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import LegacyOrganismsMainNav from '~/components/legacy/organisms/MainNav.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const searchQuery = ref('')

const close = () => {
  emit('update:modelValue', false)
}

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim()
  if (trimmedQuery) {
    // Store search term in localStorage with key bfna-search before navigation
    if (process.client) {
      localStorage.setItem('bfna-search', trimmedQuery)
    }
    router.push('/search')
    close()
  }
}
</script>

