<template>
  <ccm-section full-width>
  <div class="blog-post | prose-layout | prose">
    <ContentRenderer v-if="post" :value="post" class="post-main-content | prose" />
    <div v-else>
      <h1>Post not found</h1>
        <NuxtLink to="/blog">← Back to Blog</NuxtLink>
      </div>
    </div>
  </ccm-section>
</template>

<script setup>
import { watch } from 'vue'

definePageMeta({
  layout: 'article-layout'
})

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
const post = contentOne('blog', { slug })

// Set page title reactively
useHead({
  title: () => post.value?.title || 'Blog Post',
  meta: [
    { name: 'description', content: () => post.value?.description || 'Blog post description' }
  ]
})

// Provide hero data from content front-matter (if present) to layout via shared state
const heroState = useState('hero', () => null)

watch(post, (p) => {
  if (!p) {
    heroState.value = null
    return
  }
  if (p.hero) {
    heroState.value = {
      brow: p.hero.brow || 'Blog Post',
      title: p.hero.title || p.title,
      tagline: p.hero.tagline || p.description,
      backgroundColor: p.hero.backgroundColor || 'transparent',
      size: p.hero.size || 'l',
    }
  } else {
    // Default hero from content basics
    heroState.value = {
      brow: 'Blog',
      title: p.title,
      tagline: p.description,
      backgroundColor: 'transparent',
      size: 'l'
    }
  }
}, { immediate: true })
</script>

<style>

</style>