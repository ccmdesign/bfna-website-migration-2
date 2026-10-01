<script setup lang="ts">
/** Contact details and a local email-draft form; no message is sent by the site. */
defineOptions({ name: 'BfContactSection' })

interface ContactErrors {
  name?: string
  email?: string
  message?: string
}

interface Props {
  email?: string
  heading?: string
  visitHeading?: string
  /** Postal lines separated by newlines. An absent address renders no placeholder. */
  address?: string
  errors?: ContactErrors
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  email: 'info@bfna.org',
  heading: 'Contact',
  visitHeading: 'Visit us',
  address: '',
  errors: () => ({}),
  status: ''
})

const nameValue = ref('')
const emailValue = ref('')
const messageValue = ref('')
const localErrors = ref<ContactErrors>({})
const draftStatus = ref('')
const fieldErrors = computed(() => ({ ...localErrors.value, ...props.errors }))
const formHeadingId = useId()
const formHintId = useId()
const addressLines = computed(() => props.address.split(/\r?\n/).filter(Boolean))
const directionsUrl = computed(() => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address.replace(/\r?\n/g, ', '))}`)

async function openEmailDraft(event: Event) {
  const form = event.currentTarget as HTMLFormElement
  const emailControl = form.elements.namedItem('email') as HTMLInputElement
  localErrors.value = {}
  draftStatus.value = ''

  if (!nameValue.value.trim()) localErrors.value.name = 'Enter your name.'
  if (!emailValue.value.trim()) localErrors.value.email = 'Enter your email address.'
  else if (!emailControl.validity.valid) localErrors.value.email = 'Enter a valid email address, such as name@example.com.'
  if (!messageValue.value.trim()) localErrors.value.message = 'Write a message before opening your draft.'

  if (Object.values(fieldErrors.value).some(Boolean)) {
    await nextTick()
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }

  const subject = encodeURIComponent(`Website inquiry from ${nameValue.value.trim()}`)
  const body = encodeURIComponent(`${messageValue.value.trim()}\n\nFrom: ${nameValue.value.trim()}\nReply to: ${emailValue.value.trim()}`)
  window.location.href = `mailto:${props.email}?subject=${subject}&body=${body}`
  draftStatus.value = 'Your email app should open with your draft. Send it there to finish. If it does not open, use the email link in our contact details.'
}
</script>

<template>
  <bfSection class="bf-contact-section" label="Contact" :heading="heading" gap="l">
    <div class="bf-contact-section__body">
      <div class="bf-contact-section__visit stack" data-gap="m">
        <div class="stack" data-gap="s">
          <h3>{{ visitHeading }}</h3>
          <address class="bf-contact-section__address">
            <strong>Bertelsmann Foundation<br>North America</strong>
            <span v-if="address" class="bf-contact-section__postal">
              <span v-for="line in addressLines" :key="line">{{ line }}</span>
            </span>
          </address>
          <p v-if="address"><a :href="directionsUrl">Get directions</a></p>
        </div>
        <p class="bf-contact-section__email"><a :href="`mailto:${email}`">{{ email }}</a></p>
      </div>

      <form
        class="bf-contact-section__form stack"
        data-gap="m"
        :aria-labelledby="formHeadingId"
        :aria-describedby="formHintId"
        novalidate
        @submit.prevent="openEmailDraft"
      >
        <div class="stack" data-gap="xs">
          <h3 :id="formHeadingId">Send a message</h3>
          <p :id="formHintId" class="bf-contact-section__hint">Your message opens in your email app, ready to send. All fields are required.</p>
        </div>

        <bfFormGroup legend="Your message" class="bf-contact-section__fields">
          <div class="bf-contact-section__details">
            <bfFormField
              v-model="nameValue"
              label="Name"
              type="text"
              name="name"
              autocomplete="name"
              required
              :error="fieldErrors.name"
              @update:model-value="localErrors.name = undefined"
            />
            <bfFormField
              v-model="emailValue"
              label="Email"
              type="email"
              name="email"
              autocomplete="email"
              required
              :error="fieldErrors.email"
              @update:model-value="localErrors.email = undefined"
            />
          </div>
          <bfFormField
            v-model="messageValue"
            label="Message"
            type="textarea"
            name="message"
            :rows="6"
            required
            :error="fieldErrors.message"
            @update:model-value="localErrors.message = undefined"
          />
        </bfFormGroup>

        <div class="bf-contact-section__actions stack" data-gap="xs">
          <div><bfButton type="submit" variant="primary" size="l">Open email draft</bfButton></div>
          <p class="bf-contact-section__status" role="status">{{ status || draftStatus }}</p>
        </div>
      </form>
    </div>
  </bfSection>
</template>

<style>
@layer components {
  .bf-contact-section__body {
    display: grid;
    gap: var(--space-xl);
  }

  .bf-contact-section__body > * {
    min-inline-size: 0;
  }

  .bf-contact-section__form {
    container-type: inline-size;
  }

  .bf-contact-section__body h3 {
    font-size: var(--size-1);
  }

  .bf-contact-section__address {
    font-style: normal;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .bf-contact-section__address strong {
    font-weight: var(--font-weight-normal);
  }

  .bf-contact-section__postal {
    display: block;
    margin-block-start: var(--space-xs);
  }

  .bf-contact-section__postal > span {
    display: block;
  }

  .bf-contact-section__visit a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-thickness: var(--border-width-thin);
    overflow-wrap: anywhere;
  }

  .bf-contact-section__visit a:hover {
    text-decoration-thickness: var(--border-width-medium);
  }

  .bf-contact-section__visit a:focus-visible {
    outline: var(--border-width-medium) solid var(--color-accent);
    outline-offset: var(--border-width-medium);
  }

  .bf-contact-section__hint,
  .bf-contact-section__status {
    max-inline-size: 55ch;
    color: var(--color-text-muted);
    font-size: max(0.875rem, var(--size--1));
    line-height: 1.5;
  }

  .bf-contact-section fieldset {
    min-inline-size: 0;
    margin-inline: 0;
    margin-block-end: 0;
    padding: 0;
    border: 0;
  }

  .bf-contact-section .bf-form-group__legend {
    position: absolute;
    overflow: hidden;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  .bf-contact-section .bf-form-group > :nth-child(2) {
    margin-block-start: 0;
  }

  .bf-contact-section__details {
    display: grid;
    gap: var(--space-s);
  }

  .bf-contact-section .bf-form-field {
    --_bf-form-field-border-color: var(--color-text-muted);
    --_bf-form-field-focus-color: var(--color-accent);

    min-inline-size: 0;
  }

  .bf-contact-section .bf-form-field__label {
    font-family: var(--font-family-body);
    font-size: max(0.875rem, var(--size--1));
    font-weight: var(--font-weight-normal);
    color: var(--color-text);
  }

  .bf-contact-section .bf-form-field__error {
    font-size: max(0.875rem, var(--size--1));
    line-height: 1.5;
  }

  .bf-contact-section .bf-form-field__control {
    min-block-size: var(--space-xl);
    padding: var(--space-xs);
    border-width: var(--border-width-thin);
    border-radius: var(--radius-s);
    background: var(--color-surface-page);
    color: var(--color-text);
    caret-color: var(--color-accent);
    font-size: max(1rem, var(--size--1));
  }

  .bf-contact-section .bf-form-field__control:hover {
    border-color: var(--color-accent);
  }

  .bf-contact-section .bf-form-field__control[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  .bf-contact-section .bf-form-field__control::selection {
    background: var(--color-accent);
    color: var(--color-text-inverse);
  }

  .bf-contact-section__status {
    margin-block: 0;
  }

  @container (width >= 30rem) {
    .bf-contact-section__details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width >= 48rem) {
    .bf-contact-section__body {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    }
  }
}
</style>
