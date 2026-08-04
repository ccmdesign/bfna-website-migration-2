<!-- Person card: name + role + portrait 1/1. No link (people have no detail
     pages in the wireframe). Portrait is decorative — the heading names them. -->
<script setup lang="ts">
import type { WfPerson } from '~/composables/useWfContent'

defineProps<{ person: WfPerson }>()
</script>

<template>
  <wf-card>
    <h3>{{ person.name }}</h3>
    <p>{{ person.job_title ?? '—' }}</p>
    <template #media>
      <wf-media :src="person.image" alt="" ratio="1/1" />
    </template>
  </wf-card>
</template>
