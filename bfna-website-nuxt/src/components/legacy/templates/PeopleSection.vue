<template>
  <section class="people-section">
    <div class="grid grid--3-col">
      <div
        v-for="(person, index) in people"
        :key="index"
        class="modal__trigger"
        :data-id="`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`"
        @click="openModal(`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`)"
      >
        <div
          class="person-item"
          :class="`person-item--${person.name?.toLowerCase().replace(/\s+/g, '-')}`"
        >
          <figure>
            <NuxtImg
              v-if="person.image && !isExternalImage(person.image)"
              :src="person.image"
              :width="480"
              :height="480"
              loading="lazy"
              decoding="async"
              :alt="person.name"
              format="webp"
              sizes="(min-width: 64em) 240px, (min-width: 40em) 33vw, 80vw"
            />
            <img
              v-else-if="person.image"
              :src="person.image"
              loading="lazy"
              decoding="async"
              :alt="person.name"
              sizes="(min-width: 64em) 240px, (min-width: 40em) 33vw, 80vw"
            />
          </figure>
          <h3>{{ person.name }}</h3>
          <h4>{{ person.job || person.jobTitle }}</h4>
        </div>
      </div>
    </div>

    <!-- Person Modals -->
    <div
      v-for="(person, index) in people"
      :key="`modal-${index}`"
      :id="`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`"
      class="modal person-modal"
    >
      <div class="modal__overlay" @click="closeModal(`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`)"></div>
      <div class="modal__window">
        <button class="modal__close material-icons" @click="closeModal(`modal-${person.name?.toLowerCase().replace(/\s+/g, '-')}`)"></button>
        <div class="modal__content">
          <aside class="person-modal__aside">
            <div class="person-item">
              <figure>
                <NuxtImg
                  v-if="person.image && !isExternalImage(person.image)"
                  :src="person.image"
                  :width="480"
                  :height="480"
                  loading="lazy"
                  decoding="async"
                  :alt="person.name"
                  format="webp"
                />
                <img
                  v-else-if="person.image"
                  :src="person.image"
                  loading="lazy"
                  decoding="async"
                  :alt="person.name"
                />
              </figure>
              <h3>{{ person.name }}</h3>
              <h4>{{ person.job || person.jobTitle }}</h4>
            </div>
            <div v-if="person.email || person.twitter || person.linkedin" class="person-modal__links">
              <a v-if="person.email" :href="`mailto:${person.email}`" class="profile__icon email">
                <img src="/images/icon/email.svg" alt="Email" />
              </a>
              <a v-if="person.twitter" :href="person.twitter" target="_blank" class="profile__icon twitter">
                <img src="/images/icon/twitter.svg" alt="Twitter" />
              </a>
              <a v-if="person.linkedin" :href="person.linkedin" target="_blank" class="profile__icon linkedin">
                <img src="/images/icon/linkedin.svg" alt="LinkedIn" />
              </a>
            </div>
          </aside>
          <div v-if="person.bio" class="person-modal__bio prose" v-html="person.bio"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useExternalImage } from '~/composables/useExternalImage'

const { isExternalImage } = useExternalImage()

defineProps<{
  people: Array<any>
}>()

const openModal = (modalId: string) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add('modal--shown')
    document.body.classList.add('modal--shown')
  }
}

const closeModal = (modalId: string) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove('modal--shown')
    document.body.classList.remove('modal--shown')
  }
}
</script>

