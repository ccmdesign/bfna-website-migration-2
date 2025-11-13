<template>
  <div>
    <LegacyMoleculesHero
      v-if="heroData"
      :hero="heroData"
      theme="team"
    />

    <div class="tabs">
      <ul class="tabs__list">
        <li class="tabs__label">
          <a class="tabs__item" href="#team">team</a>
        </li>
        <li class="tabs__label">
          <a class="tabs__item" href="#board_of_directors">board of directors</a>
        </li>
      </ul>

      <div class="tabs__bar"></div>

      <section id="team" class="tabs__panel">
        <div style="max-width: 1920px; padding: 9vw">
          <LegacyTemplatesPeopleSection
            v-if="peopleData?.team_list"
            :people="peopleData.team_list"
          />
        </div>
      </section>

      <section id="board_of_directors" class="tabs__panel">
        <div style="max-width: 1920px; padding: 9vw">
          <LegacyTemplatesPeopleSection
            v-if="peopleData?.board_list"
            :people="peopleData.board_list"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePeople } from '~/composables/data/usePeople'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyTemplatesPeopleSection from '~/components/legacy/templates/PeopleSection.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: peopleData } = usePeople()

useHead({
  title: 'About Team | The Bertelsmann Foundation',
  meta: [
    {
      property: 'og:image',
      content: '/images/hero/team.jpg',
    },
    {
      name: 'description',
      content: peopleData.value?.subheading || '',
    },
  ],
})

const heroData = computed(() => {
  if (!peopleData.value) return null
  return {
    heading: peopleData.value.heading,
    subheading: peopleData.value.subheading,
  }
})
</script>

