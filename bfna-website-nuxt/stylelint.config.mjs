export default {
  extends: [
    'stylelint-config-standard-scss'
  ],
  rules: {
    // Add Vue-specific rules
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    // Allow our component-specific CSS variable naming pattern
    'custom-property-pattern': null,
    // Allow vendor prefixes for compatibility
    'property-no-vendor-prefix': null,
    // Allow single-line declaration blocks for utility classes
    'declaration-block-single-line-max-declarations': null,
    // Allow duplicate selectors for component variations
    'no-duplicate-selectors': null,
    // Allow unknown pseudo-classes for Vue deep selector
    'selector-pseudo-class-no-unknown': null,
    // Allow media feature range notation as-is
    'media-feature-range-notation': null,
    // Allow font family quotes as-is
    'font-family-name-quotes': null,
    // Allow missing generic font family for custom fonts
    'font-family-no-missing-generic-family-keyword': null,
    // Allow pseudo-element colon notation as-is
    'selector-pseudo-element-colon-notation': null,
    // Allow empty line before rules as-is
    'rule-empty-line-before': null,
    // Allow at-rule empty line before as-is
    'at-rule-empty-line-before': null,
    // Allow shorthand property redundant values
    'shorthand-property-no-redundant-values': null,
    // Allow legacy color function notation
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'alpha-value-notation': null,
    // Allow empty blocks and sources
    'block-no-empty': null,
    'no-empty-source': null,
    // Allow function URL quotes as-is
    'function-url-quotes': null,
    // Allow comment empty lines as-is
    'comment-empty-line-before': null,
    // Allow deprecated media types
    'media-type-no-deprecated': null,
    // Allow duplicate custom properties
    'declaration-block-no-duplicate-custom-properties': null,
    // Allow deprecated CSS properties
    'property-no-deprecated': null
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html'
    }
  ]
}
