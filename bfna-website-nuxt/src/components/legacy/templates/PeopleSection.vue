<template>
  <section class="people-section">
    <div class="grid grid--3-col">
      <div
        v-for="(person, index) in people"
        :key="index"
        class="modal__trigger"
        :data-id="`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`"
      >
        <div
          class="person-item"
          :class="`person-item--${person.name?.toLowerCase().replace(/\s+/g, '-')}`"
        >
          <figure>
            <NuxtImg
              v-if="person.image"
              :src="person.image"
              :width="480"
              :height="480"
              loading="lazy"
              decoding="async"
              :alt="person.name"
              format="webp"
              sizes="(min-width: 64em) 240px, (min-width: 40em) 33vw, 80vw"
            />
          </figure>
          <h3>{{ person.name }}</h3>
          <h4>{{ person.job || person.job_title }}</h4>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  people: Array<{
    name?: string
    job?: string
    job_title?: string
    image?: string
  }>
}>()
</script>

