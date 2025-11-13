<template>
  <div class="video-section wrapper">
    <figure class="video-section__frame">
      <iframe
        v-if="video.url"
        class="iframe-video"
        :src="video.url"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </figure>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  video: {
    url: string
  }
}>()
</script>

