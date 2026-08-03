<template>
  <div class="wireframe">
    <a href="#wf-main" class="wf-skip-link">Skip to content</a>
    <wf-nav />
    <main id="wf-main">
      <slot />
    </main>
    <wf-footer />
  </div>
</template>

<script setup lang="ts">
// Loads the full CUBE stack + the wireframe skin. Neither is global —
// this layout is the only consumer, so production pages are unaffected.

// ccm-feedback widget (https://github.com/ccmdesign/ccm-feedback-tool):
// reviewers pin comments on real DOM elements; stored in localStorage under
// ccm-feedback:bfna-wireframes, exportable as JSON. The inline script below
// merges Claude's seed annotations (utils/wfFeedbackSeed.ts) into storage
// before the deferred widget boots — reviewer-added comments are never touched.
const seedScript = `;(function(){try{
  var k='ccm-feedback:bfna-wireframes';
  var seed=${JSON.stringify(WF_FEEDBACK_SEED)};
  var cur=[];try{cur=JSON.parse(localStorage.getItem(k)||'[]')}catch(e){cur=[]}
  if(!Array.isArray(cur))cur=[];
  var byId={};cur.forEach(function(a){byId[a.id]=a});
  var keep=cur.filter(function(a){return String(a.id).indexOf('wf-seed')!==0});
  var fresh=seed.map(function(s){return byId[s.id]?Object.assign({},s,{status:byId[s.id].status}):s});
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
    { innerHTML: `window.addEventListener('load',function(){var s=document.createElement('script');s.src='https://ccm-feedback-582.netlify.app/w.js';s.setAttribute('data-project','bfna-wireframes');document.body.appendChild(s)})` }
  ]
})
</script>
