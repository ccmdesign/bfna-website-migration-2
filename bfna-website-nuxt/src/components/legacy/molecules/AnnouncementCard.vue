<script setup>
import { useAnnouncement } from '~/composables/data/useAnnouncements';

const announcement = useAnnouncement();
console.log(34, announcement);

</script>
<template>
  <div :class="['announcement', announcement.workstream, `announcement--${ announcement.workstream.slug }`]">
  <div class="wrapper">
    <a class="announcement__content" :href="announcement.url" target="_blank" rel="noopener noreferrer">
        {{ announcement.message }}
    </a>
  </div>
</div>

</template>