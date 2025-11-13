<template>
  <ccmSection>
    <div class="stack">
      <ccmFormField label="Default, auto generated" helpText="Your full legal name" />
      <ccmFormField label="Input Type Email" id="custom-id" helpText="Your full legal name">
        <input type="email" />
      </ccmFormField>
      <ccmFormField label="Input Type Email" id="custom-id" helpText="Your full legal name">
        <input type="file" />
      </ccmFormField>
    </div>
  </ccmSection>

  <ccmSection>
    <div class="stack">
      <ccmFormField label="Textarea" id="custom-id" helpText="Your full legal name">
        <textarea />
      </ccmFormField>
      <ccmFormField label="Checkbox Native Input" id="custom-id" helpText="Your full legal name">
        <label for="checkbox-native"><input type="checkbox" id="checkbox-native" />Checkbox Native</label>
      </ccmFormField>
      <ccmFormField label="Radio Buttons" id="custom-id" helpText="Your full legal name">
        <div class="cluster">
          <label for="radio-1"><ccmRadio id="radio-1" value="1" name="radio-group" />Radio 1</label>
          <label for="radio-2"><ccmRadio id="radio-2" value="2" name="radio-group" />Radio 2</label>
          <label for="radio-3"><ccmRadio id="radio-3" value="3" name="radio-group" />Radio 3</label>
          <label for="radio-4"><ccmRadio id="radio-4" value="4" name="radio-group" />Radio 4</label>
        </div>
      </ccmFormField>
      <ccmFormField label="Checkboxes" id="custom-id" helpText="Your full legal name">
        <div class="cluster">
          <label for="checkbox-1"><ccmCheckbox id="checkbox-1" value="1" name="checkbox-group" />Checkbox 1</label>
          <label for="checkbox-2"><ccmCheckbox id="checkbox-2" value="2" name="checkbox-group" />Checkbox 2</label>
          <label for="checkbox-3"><ccmCheckbox id="checkbox-3" value="3" name="checkbox-group" />Checkbox 3</label>
          <label for="checkbox-4"><ccmCheckbox id="checkbox-4" value="4" name="checkbox-group" />Checkbox 4</label>
        </div>
      </ccmFormField>
    </div>
  </ccmSection>
  <ccmSection>
    <div class="stack">
      <h2>Documentation</h2>
      <div v-html="documentationFragment" />
    </div>
  </ccmSection>
</template>

<style lang="css" scoped>

</style>

<script setup lang="ts">
import documentationHtml from './_docs/ccm-form-field.html?raw'

if (import.meta.client) {
  definePageMeta({
    layout: 'docs2',
    hero: {
      brow: 'Component demos',
      title: 'Form Field demos',
      tagline: 'Interactive coverage of the component API',
      size: 'l'
    }
  })
}

const documentationFragment = documentationHtml

</script>