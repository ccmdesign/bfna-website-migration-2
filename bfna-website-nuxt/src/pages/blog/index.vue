<template>
  <ccm-section>
    <div class="stack">
      <h2>Insights on Design, Data, and Social Impact</h2>
      <p>Welcome to our thinking space. Here, we share our expertise on the craft of designing for policy and research, creating effective knowledge products, and the nuances of ethical technology. Our goal is to provide value upfront, sharing what we've learned from our work with leading global organizations.</p>
      
      <field-group>
        <label for="blog-filter">Filter by Topic:</label>
        <select id="blog-filter" v-model="selectedFilter">
          <option value="" selected>All Topics</option>
          <option value="Designing for Policy & Research">Designing for Policy & Research</option>
          <option value="The Craft of Knowledge Products">The Craft of Knowledge Products</option>
          <option value="Ethical Technology & Social Impact">Ethical Technology & Social Impact</option>
        </select>
      </field-group>
    </div>
  </ccm-section>

  <ccm-section>
    <div class="grid" data-gap="s" data-min-width="l">
      <ccm-card v-for="post in blogPosts" :key="post.path" :to="post.path">
          <h4>{{ post.meta.brow }}</h4>
          <h3>{{ post.title || post.path }}</h3>
          <p>{{ post.meta.tagline }}</p>
        </ccm-card>
    </div>
  </ccm-section>
  
  <ccm-section>
    <h2>Subscribe to Our Insights</h2>
    <p>Get the latest analysis and design thinking from our team, delivered straight to your inbox. We share practical advice for organizations looking to increase their impact.</p> 
    <field-group>
      <input type="email" label="Email" placeholder="Email" />
      <input type="submit" label="Subscribe" />
    </field-group>
  </ccm-section>
</template>

<script setup>
definePageMeta({
  hero: {
    brow: 'Blog',
    title: 'Insights',
    tagline: 'Insights on Design, Data, and Social Impact',
    size: 'l',
    hideTopbar: false
  }
})

const { data: blogPosts } = await useAsyncData('blog-posts', () => {
  return queryCollection('blog').all()
})
const selectedFilter = ref('')
</script>

<style scoped>

</style>
