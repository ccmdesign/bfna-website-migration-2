<template>
  <div class="main-nav__content main-nav--top">
    <div class="main-nav__logo">
      <LegacyAtomsLogoWhite />
    </div>
    <div class="main-nav-horizontal">
      <a
        v-for="(link, index) in mainNav.main"
        :key="index"
        class="main-nav__link main-nav__link--heading"
        :href="link.link"
        target="_blank"
        :aria-label="link.name"
      >
        {{ link.name }}
      </a>
    </div>
    <div class="main-nav__social">
      <a
        v-for="(social, index) in mainNav.social"
        :key="index"
        class="main-nav__button"
        :href="social.link"
        target="_blank"
        :aria-label="social.link"
        v-html="social.image"
      ></a>
    </div>
  </div>

  <div class="main-nav__content">
    <div class="main-nav__section">
      <ul class="main-nav__links">
        <li v-for="(item, index) in mainNav.left" :key="index">
          <a
            class="main-nav__link main-nav__link--heading"
            :href="item.link"
            :aria-label="item.name"
            >{{ item.name }}</a
          >
        </li>
      </ul>
      <div class="main-nav__section main-nav__link--left">
        <a
          v-if="mainNav.privacy && mainNav.privacy.length"
          class="main-nav__link"
          aria-label="Privacy Policy"
          :href="mainNav.privacy[0].link"
          target="_blank"
          rel="noopener"
        >
          {{ mainNav.privacy[0].name }}
        </a>
      </div>
    </div>

    <div
      v-for="(column, index) in mainNav.columns"
      :key="index"
      class="main-nav__section"
    >
      <h3 class="main-nav__link--heading">{{ column.name }}</h3>
      <ul class="main-nav__links">
        <li v-for="(item, itemIndex) in column.links" :key="itemIndex">
          <a
            class="main-nav__link"
            :href="item.link"
            :aria-label="item.name"
          >
            {{ item.name }}
          </a>
        </li>
      </ul>
    </div>

    <div class="main-nav__section">
      <div class="bfna-subscribe">
        <div class="stack-l" style="--space: var(--s0)">
          <h4 class="bfna-subscribe-box__title">
            Subscribe to receive our updates & newsletters
          </h4>
          <a
            href="https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515"
            class="button button--primary bfna-subscribe__button"
            target="_blank"
            >Subscribe</a
          >
          <p class="bfna-subscribe-box__info">
            Enter your email and customize your preferences.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mainNav: {
    main?: Array<{ link: string; name: string }>
    social?: Array<{ link: string; image: string }>
    left?: Array<{ link: string; name: string }>
    privacy?: Array<{ link: string; name: string }>
    columns?: Array<{
      name: string
      links: Array<{ link: string; name: string }>
    }>
  }
}>()
</script>

