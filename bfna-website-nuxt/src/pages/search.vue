<template>
  <div
    id="search__loading"
    class=""
    style="min-height: calc(100vh - 72px); padding: 24px"
  >
    <div class="search-form-container">
      <form class="search-form" autocomplete="off" @submit.prevent>
        <input
          v-model="search.query"
          type="text"
          class="search-input"
          placeholder="Search"
        />
      </form>

      <div class="result-section">
        <h2 class="search-results">{{ search.resultCount }} Results</h2>
      </div>
    </div>

    <div class="wrapper">
      <div class="search-cards--list cards-section cards-section--updates">
        <div
          v-for="(result, index) in search.results"
          :key="index"
          class="search-card-container"
          style="display: contents"
        >
          <article
            :class="[
              'search-card card',
              result.theme ? `card--${result.theme}` : '',
            ]"
            :data-workstream="result.theme || ''"
          >
            <div style="width: 100%">
              <h2 class="card__heading">
                <a :href="result.url">{{ result.heading }}</a>
              </h2>

              <h3 class="card__subheading">
                {{ result.subheading || '&nbsp;' }}
              </h3>

              <div v-if="result.excerpt" class="card__excerpt">
                {{ result.excerpt }}
              </div>

              <footer class="card__footer">
                <div class="card__actions">
                  <a :href="result.url" class="button button--primary">
                    Learn More<span class="sr-only">
                      about {{ result.heading }}</span
                    >
                  </a>
                </div>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearch } from '~/composables/legacy/useSearch'

definePageMeta({
  layout: 'legacy-base',
})

const search = useSearch()

onMounted(() => {
  search.initializeFromStorage()
})

useHead({
  title: 'Search | Bertelsmann Foundation',
})
</script>

