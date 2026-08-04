<!-- Base card shell (inclusive-components.design/cards/): the card is an <li>
     — every card group must be a <ul>. Heading (with its link) comes FIRST in
     the source so screen-reader heading navigation lands at the card's start;
     chips and media sit after it in the DOM and are re-ordered visually with
     CSS `order`. The heading link is stretched over the whole card via ::after
     (see wireframe.css), so no "Read more"/"Explore" CTA links are needed.
     Typed cards (wfCardInsight etc.) fill these slots; pages should not use
     wfCard directly. -->
<template>
  <li class="wf-card">
    <slot />
    <div v-if="$slots.chips" class="wf-card__chips | cluster" data-gap="xs">
      <slot name="chips" />
    </div>
    <div v-if="$slots.media" class="wf-card__media">
      <slot name="media" />
    </div>
  </li>
</template>
