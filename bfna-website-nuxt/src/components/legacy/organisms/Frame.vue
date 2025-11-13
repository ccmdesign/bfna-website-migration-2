<template>
  <div class="frame">
    <div class="frame__left">
      <div class="frame__back">
        <button class="frame-button" @click="goBack">arrow_back</button>
      </div>
      <nav class="frame__left-nav">
        <NuxtLink class="frame-nav" to="/updates" aria-label="Updates">Updates</NuxtLink>
        <NuxtLink class="frame-nav" to="/about" aria-label="About Us">About Us</NuxtLink>
        <NuxtLink class="frame-nav" to="/politics-society/transponder-magazine/" aria-label="Transponder">Transponder</NuxtLink>
      </nav>
      <div class="frame__social">
        <a class="frame-button" href="https://www.facebook.com/BertelsmannFoundation/" target="_blank" aria-label="Facebook">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M445 643h-90V419h-75v-87h75v-64c0-75 45-115 112-115 37 0 67 3 67 3v78h-46c-36 0-43 18-43 43v55h86l-11 87h-75v224z"/></svg>
        </a>
        <a class="frame-button" href="https://twitter.com/BertelsmannFdn" target="_blank" aria-label="Twitter">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M679 239s-21 34-55 57c7 156-107 329-314 329-103 0-169-50-169-50s81 17 163-45c-83-5-103-77-103-77s23 6 50-2c-93-23-89-110-89-110s23 14 50 14c-84-65-34-148-34-148s76 107 228 116c-22-121 117-177 188-101 37-6 71-27 71-27s-12 41-49 61c30-2 63-17 63-17z"/></svg>
        </a>
        <a class="frame-button" href="https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg" target="_blank" aria-label="YouTube">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M400 224c144 0 201 2 224 25 17 17 26 52.125 26 151s-9 134-26 151c-23 23-80 25-224 25s-201-2-224-25c-17-17-26-52.125-26-151s9-134 26-151c23-23 80-25 224-25zm-52 100v141l135-70z"/></svg>
        </a>
        <a class="frame-button" href="https://www.instagram.com/bertelsmannfoundation/" target="_blank" aria-label="Instagram">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M400 309c-51 0-92 41-92 90s41 90 92 90 93-41 93-90-42-90-93-90zm178 56h-40c27 97-50 178-138 178s-164-82-137-178h-42v194c0 10 8 18 18 18h321c10 0 18-8 18-18V365zm-73-144c-11 0-21 10-21 21v49c0 11 10 21 21 21h52c11 0 21-10 21-21v-49c0-11-10-21-21-21h-52zm-276-51h342c32 0 59 27 59 59v342c0 32-27 59-59 59H229c-32 0-59-27-59-59V229c0-32 27-59 59-59z"/></svg>
        </a>
        <a class="frame-button" href="https://vimeo.com/bfna" target="_blank" aria-label="Vimeo">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M 404.00,298.00 405.51,288.24 414.18,267.17 418.75,258.00 426.47,242.53 436.78,226.29 449.04,214.04 474.66,188.41 508.59,178.59 544.00,179.00 567.25,179.28 591.19,187.76 604.30,208.00 618.93,230.58 618.30,257.27 618.00,283.00 617.64,313.26 597.15,357.83 582.28,384.00 561.90,419.85 538.74,452.51 513.42,485.00 491.27,513.43 467.93,541.12 441.00,565.16 420.57,583.41 398.29,600.31 372.00,609.00 357.54,613.78 341.75,616.09 327.00,611.25 303.39,603.50 285.32,572.74 276.00,551.00 276.00,551.00 269.08,534.00 269.08,534.00 269.08,534.00 257.58,492.00 257.58,492.00 257.58,492.00 237.15,417.00 237.15,417.00 237.15,417.00 224.33,371.00 224.33,371.00 218.79,354.01 212.93,335.98 203.00,321.00 198.94,314.87 192.35,306.77 185.00,304.65 176.55,302.21 160.03,315.31 153.00,320.00 150.27,321.82 144.31,326.73 141.04,325.70 137.95,324.74 129.77,313.12 127.35,310.00 125.54,307.66 120.30,301.33 119.36,299.00 117.32,293.96 122.75,290.88 126.00,287.93 126.00,287.93 152.00,264.84 152.00,264.84 175.59,243.77 198.64,220.94 225.00,203.33 238.72,194.17 254.00,185.18 271.00,185.00 301.70,184.69 318.97,203.78 328.95,231.00 335.99,250.22 340.20,281.13 343.27,302.00 347.52,330.81 353.11,359.58 359.42,388.00 363.38,405.82 368.46,423.69 376.76,440.00 379.82,446.03 385.70,455.44 393.00,456.52 398.02,457.26 403.34,453.13 407.00,450.19 416.13,442.86 427.64,426.97 434.33,417.00 445.78,399.93 459.42,377.01 467.00,358.00 471.41,346.95 475.26,335.03 474.99,323.00 474.53,303.15 463.27,290.24 443.00,290.00 423.60,289.78 420.78,293.48 404.00,298.00 Z" /></svg>
        </a>
        <a class="frame-button" href="https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc." target="_blank" aria-label="LinkedIn">
          <svg role="img" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M268 629h-97V319h97v310zm157 0h-97V319h93v42h1c13-24 44-50 91-50 98 0 116 64 116 148v170h-96V478c0-36-2-82-51-82-50 0-57 39-57 79v154zM220 164c31 0 55 25 55 56s-24 56-55 56-56-25-56-56 25-56 56-56z"/></svg>
        </a>
      </div>
    </div>

    <div class="frame__top">
      <div class="frame__menu">
        <button class="frame-button frame__menu-trigger" @click="toggleMenu">menu</button>
      </div>
      <NuxtLink to="/" class="frame__logo is-hidden" aria-label="logo">
        <LegacyAtomsLogo />
      </NuxtLink>
      <nav class="frame__top-nav">
        <NuxtLink class="frame-nav frame-nav--democracy" to="/democracy" aria-label="Democracy">Democracy</NuxtLink>
        <NuxtLink class="frame-nav frame-nav--politics-society" to="/politics-society" aria-label="Politics & Society">Politics & Society</NuxtLink>
        <NuxtLink class="frame-nav frame-nav--future-leadership" to="/future-leadership" aria-label="Future Leadership">Future Leadership</NuxtLink>
        <NuxtLink class="frame-nav frame-nav--digital-world" to="/digital-world" aria-label="Digital World">Digital World</NuxtLink>
      </nav>

      <div class="frame__search" :class="{ 'frame--expanded': isSearchExpanded }">
        <form action="/search" class="frame-search" autocomplete="off" @submit.prevent="handleSearch">
          <button 
            v-if="route.path !== '/search'" 
            class="frame-search__button frame-button frame-search__trigger" 
            type="button" 
            @click="toggleSearch"
          >
            search
          </button>
          <input 
            v-model="searchQuery" 
            class="frame-search__field" 
            type="text" 
            placeholder="Search..." 
            @keyup.enter="handleSearch"
          />
          <input class="frame-search__submit" type="submit" value="Search" @click="handleSearch">
        </form>
      </div>
    </div>
  </div>

  <LegacyOrganismsOffCanvas v-model="isMenuOpen" />
</template>

<script setup lang="ts">
import LegacyAtomsLogo from '~/components/legacy/atoms/Logo.vue'
import LegacyOrganismsOffCanvas from '~/components/legacy/organisms/OffCanvas.vue'

const router = useRouter()
const route = useRoute()

const isMenuOpen = ref(false)
const isSearchExpanded = ref(false)
const searchQuery = ref('')

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleSearch = () => {
  isSearchExpanded.value = !isSearchExpanded.value
}

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

