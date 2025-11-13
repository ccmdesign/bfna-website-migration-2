<template>
  <div class="main-nav__content main-nav--top">
    <div class="main-nav__logo">
      <LegacyAtomsLogoWhite />
    </div>
    <div class="main-nav-horizontal">
      <NuxtLink
        v-for="link in primaryLinks"
        :key="link.name"
        class="main-nav__link main-nav__link--heading"
        :to="link.link"
        :target="link.link.startsWith('http') ? '_blank' : undefined"
        :aria-label="link.name"
      >
        {{ link.name }}
      </NuxtLink>
    </div>
    <div class="main-nav__social">
      <a
        v-for="social in socialLinks"
        :key="social.link"
        class="main-nav__button"
        :href="social.link"
        target="_blank"
        :aria-label="social.link"
        v-html="social.image"
      />
    </div>
  </div>

  <div class="main-nav__content">
    <div class="main-nav__section">
      <ul class="main-nav__links">
        <li v-for="item in legacyLinks" :key="item.name">
          <NuxtLink
            class="main-nav__link main-nav__link--heading"
            :to="item.link"
            :target="item.link.startsWith('http') ? '_blank' : undefined"
            :aria-label="item.name"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>
      <div v-if="privacyLink" class="main-nav__section main-nav__link--left">
        <NuxtLink
          class="main-nav__link"
          aria-label="Privacy Policy"
          :to="privacyLink.link"
          target="_blank"
          rel="noopener"
        >
          {{ privacyLink.name }}
        </NuxtLink>
      </div>
    </div>

    <div v-for="column in columns" :key="column.name" class="main-nav__section">
      <h3 class="main-nav__link--heading">{{ column.name }}</h3>
      <ul class="main-nav__links">
        <li v-for="item in column.links" :key="item.name">
          <NuxtLink
            class="main-nav__link"
            :to="item.link"
            :aria-label="item.name"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="main-nav__section">
      <div class="bfna-subscribe">
        <div class="stack-l" style="--space: var(--s0);">
          <h4 class="bfna-subscribe-box__title">Subscribe to receive our updates & newsletters</h4>
          <a
            href="https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515"
            class="button button--primary | bfna-subscribe__button"
            target="_blank"
          >
            Subscribe
          </a>
          <p class="bfna-subscribe-box__info">Enter your email and customize your preferences.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LegacyAtomsLogoWhite from '~/components/legacy/atoms/LogoWhite.vue'
import { useWorkstreamNavigation } from '~/composables/data/useWorkstreamNavigation'

const { items: workstreamNavItems } = useWorkstreamNavigation()

const socialLinks = [
  {
    link: 'https://www.facebook.com/BertelsmannFoundation/',
    image: '<svg role="img" fill="white" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M445 643h-90V419h-75v-87h75v-64c0-75 45-115 112-115 37 0 67 3 67 3v78h-46c-36 0-43 18-43 43v55h86l-11 87h-75v224z"/></svg>'
  },
  {
    link: 'https://twitter.com/BertelsmannFdn',
    image: '<svg role="img" fill="white" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M679 239s-21 34-55 57c7 156-107 329-314 329-103 0-169-50-169-50s81 17 163-45c-83-5-103-77-103-77s23 6 50-2c-93-23-89-110-89-110s23 14 50 14c-84-65-34-148-34-148s76 107 228 116c-22-121 117-177 188-101 37-6 71-27 71-27s-12 41-49 61c30-2 63-17 63-17z"/></svg>'
  },
  {
    link: 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
    image: '<svg role="img" fill="white" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M400 224c144 0 201 2 224 25 17 17 26 52.125 26 151s-9 134-26 151c-23 23-80 25-224 25s-201-2-224-25c-17-17-26-52.125-26-151s9-134 26-151c23-23 80-25 224-25zm-52 100v141l135-70z"/></svg>'
  },
  {
    link: 'https://www.instagram.com/bertelsmannfoundation/',
    image: '<svg role="img" fill="white" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M400 309c-51 0-92 41-92 90s41 90 92 90 93-41 93-90-42-90-93-90zm178 56h-40c27 97-50 178-138 178s-164-82-137-178h-42v194c0 10 8 18 18 18h321c10 0 18-8 18-18V365zm-73-144c-11 0-21 10-21 21v49c0 11 10 21 21 21h52c11 0 21-10 21-21v-49c0-11-10-21-21-21h-52zm-276-51h342c32 0 59 27 59 59v342c0 32-27 59-59 59H229c-32 0-59-27-59-59V229c0-32 27-59 59-59z"/></svg>'
  }
]

const primaryLinks = [
  { name: 'About', link: '/about' },
  { name: 'Board of Directors', link: '/team#board_of_directors' },
  { name: 'Team', link: '/team' },
  { name: 'Bertelsmann Stiftung', link: '/bertelsmann-stiftung' }
]

const legacyLinks = [
  { name: 'Transatlantic Periscope', link: 'https://transatlanticperiscope.org/' },
  { name: 'RANGE Forecasting', link: 'https://www.rangeforecasting.org/' },
  { name: 'Transatlantic Barometer', link: 'https://www.transatlanticbarometer.org/' },
  { name: 'BFNA Documentaries', link: 'https://bfnadocs.org/' },
  { name: 'Transponder Magazine', link: '/politics-society/transponder-magazine/' },
  { name: 'Podcasts', link: '/podcasts/' }
]

const privacyLink = { name: 'Privacy Policy', link: '/files/Privacy-Policy.pdf' }

const updatesLinks = [
  { name: 'Publications', link: '/updates' },
  { name: 'Infographics', link: '/updates#infographics' },
  { name: 'Videos', link: '/updates#videos' },
  { name: 'Archives', link: '/archives/' },
  { name: 'Contact', link: 'mailto:info@bfna.org' }
]

const topicLinks = computed(() => {
  const items = workstreamNavItems.value
  if (!Array.isArray(items)) {
    return []
  }
  return items.map(item => ({
    name: item.name,
    link: item.link,
    cssClass: item.cssClass,
  }))
})

const columns = computed(() => [
  {
    name: 'Topics',
    links: topicLinks.value
  },
  {
    name: 'Updates',
    links: updatesLinks
  }
])
</script>
