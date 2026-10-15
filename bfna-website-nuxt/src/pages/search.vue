<template>
  <div
    id="search__loading"
    :class="{ 'search--loading': search.isLoading.value }"
    style="min-height: calc(100vh - 72px); padding: 24px"
  >
    <div class="search-form-container">
      <form class="search-form" autocomplete="off" @submit.prevent>
        <!-- searching is driven by the debounced query watcher in useSearch -->
        <input
          v-model="search.query.value"
          type="text"
          class="search-input"
          placeholder="Search"
        />
        <!-- space is always reserved so showing the bar never shifts the layout -->
        <div class="search-progress" aria-hidden="true">
          <span class="search-progress__bar" />
        </div>
      </form>

      <p class="sr-only" role="status">
        {{ search.isLoading.value ? 'Searching…' : '' }}
      </p>

      <!-- live region so screen readers hear the count change on "Show more" -->
      <div class="result-section" aria-live="polite">
        <h2 id="search-results-count" class="search-results" tabindex="-1">
          {{ search.resultCount.value }} Result{{ search.resultCount.value === 1 ? '' : 's' }}
          <span v-if="search.hiddenCount.value" class="search-results__more">
            · {{ search.hiddenCount.value }} extra
          </span>
        </h2>
      </div>
    </div>

    <div class="wrapper">
      <div
        v-if="search.visibleResults.value.length"
        id="search-results-list"
        class="search-cards--list cards-section cards-section--updates"
        :aria-busy="search.isLoading.value"
      >
        <div
          v-for="(result, index) in search.visibleResults.value"
          :key="result.url"
          class="search-card-container"
          style="display: contents"
        >
          <p
            v-if="search.showWeaker.value && index === search.results.value.length"
            id="search-weaker-start"
            class="search-divider"
            tabindex="-1"
          >
            Less relevant results
          </p>

          <article
            :class="[
              'search-card card',
              result.theme ? `card--${result.theme}` : '',
            ]"
            :data-workstream="result.theme || ''"
          >
            <div style="width: 100%">
              <h2 class="card__heading">
                <a :href="result.url" target="_blank" rel="noopener noreferrer">{{ result.heading }}</a>
              </h2>

              <h3 class="card__subheading">
                {{ result.subheading || '&nbsp;' }}
              </h3>

              <div v-if="result.excerpt" class="card__excerpt">
                {{ result.excerpt }}
              </div>

              <footer class="card__footer">
                <div class="card__actions">
                  <a
                    :href="result.url"
                    class="button button--primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More<span class="sr-only">
                      about {{ result.heading }} (opens in a new tab)</span
                    >
                  </a>
                </div>
              </footer>

              <section
                v-if="result.related?.length"
                class="card__related"
                :aria-label="`Related to ${result.heading}`"
              >
                <h4 class="card__related-title">Related</h4>
                <ul class="card__related-list" role="list">
                  <li
                    v-for="related in result.related"
                    :key="related.url"
                    class="card__related-item"
                  >
                    <span v-if="related.type" class="card__related-type">{{ related.type }}</span>
                    <a
                      :href="related.url"
                      class="card__related-link"
                      :title="related.heading"
                      target="_blank"
                      rel="noopener noreferrer"
                    >{{ related.heading }}</a>
                    <span
                      v-if="related.reason"
                      class="card__related-reason"
                      :title="related.reason"
                    >{{ related.reason }}</span>
                  </li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </div>

      <template v-if="search.hasSearched.value && !search.isLoading.value">
        <p
          v-if="!search.results.value.length && !search.weakerResults.value.length"
          class="search-message"
        >
          No results. Try fewer or different words.
        </p>
        <p
          v-else-if="!search.results.value.length && !search.showWeaker.value"
          class="search-message"
        >
          No closely matching results.
        </p>
      </template>

      <div v-if="search.weakerResults.value.length" class="search-more">
        <button
          type="button"
          class="button button--navy button--large search-more__button"
          :aria-expanded="search.showWeaker.value"
          aria-controls="search-results-list"
          @click="toggleWeaker"
        >
          {{
            search.showWeaker.value
              ? 'Show less'
              : `Show more (${search.weakerResults.value.length})`
          }}
        </button>
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

// after expanding, move to the start of the newly shown results so the
// change is visible (they appear below the fold on long lists); after
// collapsing, go back to the top so the list isn't left mid-page
const toggleWeaker = async () => {
  const expanding = !search.showWeaker.value
  search.toggleWeaker()

  await nextTick()
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

  if (!expanding) {
    document.getElementById('search-results-count')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior })
    return
  }

  const start = document.getElementById('search-weaker-start')
  if (!start) return

  start.focus({ preventScroll: true })
  start.scrollIntoView({ behavior, block: 'start' })
}


onMounted(() => {
  search.initializeFromStorage()
})

useHead({
  title: 'Search | Bertelsmann Foundation',
})
</script>

<style scoped>
/* Loading feedback: thin indeterminate bar under the input and dimmed
   results. Both wait 200ms before appearing so fast responses don't flash. */
.search-progress {
  /* the legacy .search-input is 50% wide plus its padding and 1px borders
     (content-box), so add those to line the bar up with the input edges */
  width: calc(50% + var(--s3) + var(--s0) + 2px);
  height: 3px;
  margin-top: var(--s-2);
  overflow: hidden;
  border-radius: 2px;
  background-color: hsl(var(--navy-hsl), 0.1);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.search-progress__bar {
  display: block;
  width: 40%;
  height: 100%;
  border-radius: inherit;
  background-color: var(--color-navy);
  transform: translateX(-100%);
}

.search--loading .search-progress {
  opacity: 1;
  transition-delay: 0.2s;
}

.search--loading .search-progress__bar {
  animation: search-progress 1.2s ease-in-out infinite;
}

@keyframes search-progress {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(250%);
  }
}

.search-cards--list {
  transition: opacity 0.2s ease;
}

.search--loading .search-cards--list {
  opacity: 0.5;
  transition-delay: 0.2s;
}

/* no sliding motion: show a full-width bar that gently pulses instead */
@media (prefers-reduced-motion: reduce) {
  .search-progress__bar {
    width: 100%;
    transform: none;
  }

  .search--loading .search-progress__bar {
    animation: search-progress-pulse 1.6s ease-in-out infinite;
  }

  @keyframes search-progress-pulse {
    50% {
      opacity: 0.4;
    }
  }
}

.search-results__more {
  font-weight: normal;
  color: var(--color-gray-70);
}

/* separates relevant results from the less relevant ones once expanded */
.search-divider {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--s0);
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-70);
  scroll-margin-top: var(--s3);
}

.search-divider::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--color-gray-20);
}

/* match .search-card, which spans two grid columns on wider screens */
@media screen and (min-width: 40em) {
  .search-divider {
    grid-column: span 2;
  }
}

.search-results:focus,
.search-divider:focus {
  outline: none;
}

.search-message {
  margin: var(--s2) 0 0;
  text-align: center;
  color: var(--color-gray-70);
}

.search-more {
  display: flex;
  justify-content: center;
  margin-block: var(--s2) var(--s3);
}

/* outlined so it stays secondary to the filled "Learn More" buttons,
   but heavier than a default button so it's easy to spot */
.search-more__button {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  font-weight: 600;
  /* the later pill .button rule sets border: none, so restate the full border */
  border: 2px solid hsl(var(--button-hsl), 1);
}

.search-more__button:hover,
.search-more__button:focus {
  background-image: linear-gradient(hsl(var(--button-hsl), 0.1), hsl(var(--button-hsl), 0.1));
}

/* chevron: down to expand, up to collapse */
.search-more__button::after {
  content: "";
  width: 0.5em;
  height: 0.5em;
  border-right: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  transform: translateY(-25%) rotate(45deg);
  transition: transform 0.2s ease;
}

.search-more__button[aria-expanded="true"]::after {
  transform: translateY(25%) rotate(-135deg);
}

@media (prefers-reduced-motion: reduce) {
  .search-more__button::after {
    transition: none;
  }
}

.search-card .card__footer {
  display: flex;
  justify-content: flex-start;
}

/* Related content returned by the search API for each result */
.card__related {
  margin-top: var(--s1);
  padding-top: var(--s0);
  border-top: 1px solid var(--color-gray-10);
}

.card__related-title {
  margin: 0 0 var(--s-1);
  font-size: calc(var(--text-base-size) * 0.75);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-70);
}

.card__related-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.card__related-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2) var(--s-1);
}

.card__related-item + .card__related-item {
  margin-top: var(--s-1);
}

.card__related-type {
  font-size: calc(var(--text-base-size) * 0.75);
  font-weight: 600;
  text-transform: uppercase;
  color: hsl(var(--theme-hsl), 1);
}

/* keep long related headings on one line; full text is in the title attribute */
.card__related-link {
  display: block;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-default);
}

.card__related-reason {
  font-size: calc(var(--text-base-size) * 0.875);
  font-style: italic;
  color: var(--color-gray-70);
}

/* wide screens: type, link and reason share one line */
@media screen and (min-width: 40em) {
  .card__related-item {
    flex-wrap: nowrap;
  }

  .card__related-type {
    flex: none;
    white-space: nowrap;
  }

  .card__related-link {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }

  .card__related-reason {
    flex: 0 1 auto;
    max-width: 40%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>

