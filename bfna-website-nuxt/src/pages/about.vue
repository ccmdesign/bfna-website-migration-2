<template>
  <div>
    <LegacyMoleculesHero
      v-if="aboutData?.hero"
      :hero="aboutData.hero"
      theme="about"
    />

    <LegacyMoleculesVideoSection v-if="aboutData?.video" :video="aboutData.video" />

    <section class="about" style="display: flex; justify-content: center; margin-bottom: 3rem; margin-top: 2rem">
      <div class="about__content" style="max-width: 850px;">
        <p class="about__intro" style="font-size: 2rem; letter-spacing: 0.48px; line-height: 1.5">
          The Bertelsmann Foundation (North America), Inc., established in 2008, was created to promote and strengthen the transatlantic relationship. Through research, analysis, forums, and audiovisual and multimedia content, we seek to educate and engage our audience on the most pressing economic, political, and social challenges facing the United States and Europe.
        </p>

        <p class="spacer">
          <a href="/bertelsmann-stiftung/" class="button button--primary">About the Bertelsmann Stiftung</a>
        </p>

        <p>
          At a time when many are asking what people from all parts of the U.S. and Europe think about global issues, our aim is to bring our work to audiences outside Washington and Brussels. Through discussion forums, documentary film screenings, and other events, we present our materials to diverse audiences of students, educators, community organizers, journalists, and policymakers. Our goal is learning together how the transatlantic relationship affects us all, and how we can shape it in the future.
        </p>
        <div class="card" style="padding: 2.5rem 3rem; margin-bottom: 2rem">
          <p>We strive to lead a constructive and informed conversation on the transatlantic relationship.</p>
        </div>
        <div class="card" style="padding: 2.5rem 3rem; margin-bottom: 2rem">
          <p>We create innovative informational materials on topics that are key to understanding the future of the transatlantic relationship.</p>
        </div>
        <div class="card" style="padding: 2.5rem 3rem; margin-bottom: 2rem">
          <p>We maintain the first fellowship exchange program for U.S. legislative, German Bundestag, European Parliament staffers, and entrepreneurs to advance understanding of policy priorities and processes on both sides of the Atlantic.</p>
        </div>
        <div class="card" style="padding: 2.5rem 3rem; margin-bottom: 2rem">
          <p>We produce in-house animated videos and full-length documentaries to bring stories about the transatlantic relationship to life.</p>
        </div>
        <div class="card" style="padding: 2.5rem 3rem; margin-bottom: 2rem">
          <p>We host discussion events and film screenings in the heart of Washington, DC and across the country.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesVideoSection from '~/components/legacy/molecules/VideoSection.vue'

definePageMeta({
  layout: 'legacy-base',
})

useHead({
  title: 'About Us | Bertelsmann Foundation',
  meta: [
    {
      property: 'og:image',
      content: '/images/hero/about.jpg',
    },
  ],
})

// About page data - placeholder structure
const aboutData = computed(() => {
  return {
    hero: {
      heading: 'About Us',
      subheading: 'The Bertelsmann Foundation (North America), Inc., established in 2008, was created to promote and strengthen the transatlantic relationship.',
    },
    video: {
      url: '', // TODO: Add video URL from data
    },
  }
})
</script>

