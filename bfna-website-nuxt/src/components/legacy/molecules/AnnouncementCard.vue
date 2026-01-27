<script setup>
defineProps({
  announcement: {
    type: Object,
    required: true
  }
})

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