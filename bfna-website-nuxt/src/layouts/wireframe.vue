<!-- Base layout shell: top-bar → hero slot → body (default slot) → footer.
     Pages fill #hero (wfHero / wfPageHeader) and the body. Use via
     <NuxtLayout name="wireframe"> + definePageMeta({ layout: false }). -->
<template>
  <div class="wireframe">
    <a href="#wf-main" class="wf-skip-link">Skip to content</a>
    <wf-nav />
    <main id="wf-main" class="stack" data-gap="xl">
      <slot name="hero" />
      <slot />
      <!-- The global Subscribe band was removed here: BFNA runs no newsletter,
           so the signup has no purpose (Irene, Aug 5 widget comments #47 and the
           About-page twin; confirmed by Claudio Sep 1). The nav's Subscribe
           button went with it — it anchored to this section. -->
    </main>
    <wf-footer />
  </div>
</template>

<script setup lang="ts">
// Loads the full CUBE stack + the wireframe skin. Neither is global —
// this layout is the only consumer, so production pages are unaffected.

// ccm-feedback widget (https://github.com/ccmdesign/ccm-feedback-tool):
// reviewers pin comments on real DOM elements; synced to Supabase (cloud
// mode) so all reviewers see each other's comments, exportable as JSON.
// Comments left while the widget ran in localStorage-only mode (under
// ccm-feedback:bfna-wireframes) are migrated up on init. The inline script below
// merges Claude's seed annotations (utils/wfFeedbackSeed.ts) into storage
// before the deferred widget boots — reviewer-added comments are never touched.
const seedScript = `;(function(){try{
  var k='ccm-feedback:bfna-wireframes';
  var seed=${JSON.stringify(WF_FEEDBACK_SEED)};
  var cur=[];try{cur=JSON.parse(localStorage.getItem(k)||'[]')}catch(e){cur=[]}
  if(!Array.isArray(cur))cur=[];
  var byId={};cur.forEach(function(a){byId[a.id]=a});
  var keep=cur.filter(function(a){return String(a.id).indexOf('wf-seed')!==0});
  var fresh=seed.map(function(s){return byId[s.id]&&s.status!=='done'?Object.assign({},s,{status:byId[s.id].status}):s});
  localStorage.setItem(k,JSON.stringify(keep.concat(fresh)));
}catch(e){}})()`

useHead({
  htmlAttrs: { lang: 'en' },
  title: 'BFNA Wireframes',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'robots', content: 'noindex' }
  ],
  link: [
    { rel: 'stylesheet', href: '/css/styles.css' },
    { rel: 'stylesheet', href: '/css/wireframe.css' }
  ],
  script: [
    { innerHTML: seedScript },
    // Boot the widget only after window load: with `defer` it measures marker
    // positions before the CSS @import chain finishes and anchors them against
    // the unstyled (much taller) layout.
    // data-supabase-* enables cloud mode (shared comments across reviewers).
    // The key is the Supabase ANON key — browser-safe by design (same value
    // the widget's own demo page publishes). On init the widget migrates any
    // pre-existing localStorage comments (minus the userAgent:"seed" rows
    // from the bootstrap above) up to Supabase, idempotently.
    { innerHTML: `window.addEventListener('load',function(){var s=document.createElement('script');s.src='https://ccm-feedback-582.netlify.app/w.js';s.setAttribute('data-project','bfna-wireframes');s.setAttribute('data-supabase-url','https://qnkvkumtssihbjmocbtv.supabase.co');s.setAttribute('data-supabase-key','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFua3ZrdW10c3NpaGJqbW9jYnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Nzc0OTcsImV4cCI6MjA5MjI1MzQ5N30._lmyjRjITwD9m-ov0QTzzRNmqpwtbYoXM_HLF2rzfSk');document.body.appendChild(s)})` }
  ]
})
</script>
