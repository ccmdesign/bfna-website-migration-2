<!-- Person card: portrait 1/1 + name + role. -->
<script setup lang="ts">
import type { WfPerson } from '~/composables/useWfContent'

defineProps<{ person: WfPerson }>()
</script>

<template>
  <wf-card>
    <template #media>
      <wf-media :src="person.image" :alt="person.name" ratio="1/1" />
    </template>
    <h3>{{ person.name }}</h3>
    <p>{{ person.job_title ?? '—' }}</p>
  </wf-card>
</template>
