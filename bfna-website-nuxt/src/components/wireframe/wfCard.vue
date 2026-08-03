<!-- Base card shell: shared anatomy sockets. Typed cards (wfCardInsight etc.)
     fill these via props; pages should not use wfCard directly. -->
<template>
  <article class="wf-card">
    <slot name="media" />
    <div v-if="$slots.chips" class="cluster" data-gap="xs">
      <slot name="chips" />
    </div>
    <slot />
  </article>
</template>
