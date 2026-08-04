<!-- Contact section: contact form only — the subscribe band is global (base
     layout renders it on every page), so it no longer lives here. -->
<template>
  <wf-section label="Contact" layout="switcher" gap="l">
    <form class="stack" data-gap="s" @submit.prevent>
      <h2>Contact</h2>
      <p><a href="mailto:info@bfna.org">info@bfna.org</a></p>
      <label class="stack" data-gap="2xs">Name<input type="text"></label>
      <label class="stack" data-gap="2xs">Email<input type="email"></label>
      <label class="stack" data-gap="2xs">Message<textarea rows="4" /></label>
      <div><button type="submit" class="wf-button" data-variant="primary">Send message</button></div>
    </form>
    <div class="stack" data-gap="s">
      <h2>Visit us</h2>
      <p>Bertelsmann Foundation North America</p>
      <p>[street address — Directus contact singleton]</p>
    </div>
  </wf-section>
</template>
