<template>
  <footer class="footer | main-nav">
    <div class="wrapper wrapper--padded">
      <div class="main-nav__top-actions">
        <hgroup class="field-group">
          <input v-model="searchQuery" class="search footer-search__input" type="text" placeholder="Search" @keyup.enter="handleSearch" />
          <button class="button button--primary | submit footer-search__submit" type="button" @click="handleSearch">Search</button>
        </hgroup>
      </div>
      <LegacyOrganismsMainNav />
    </div>
    <div class="main-nav__ribbon">
      <div class="wrapper">
        <p class="main-nav__copyright">
          © {{ currentYear }} Copyright Bertelsmann Foundation.
        </p>
        <p class="main-nav__by-line">
          <a href="https://ccmdesign.ca" target="_blank">by ccm.design</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import LegacyOrganismsMainNav from '~/components/legacy/organisms/MainNav.vue'

const router = useRouter()
const searchQuery = ref('')
const currentYear = new Date().getFullYear()

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim()
  if (trimmedQuery) {
    // Store search term in localStorage with key bfna-search before navigation
    if (process.client) {
      localStorage.setItem('bfna-search', trimmedQuery)
    }
    router.push('/search')
  }
}
</script>
