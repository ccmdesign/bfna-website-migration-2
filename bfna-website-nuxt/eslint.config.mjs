// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.json'],
      tsconfigRootDir: process.cwd()
    }
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/attributes-order': 'off',
    'vue/html-self-closing': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/require-default-prop': 'off',
    'no-useless-escape': 'off'
  }
})
