import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cardExcerpt } from '../src/utils/cardExcerpt.ts'

test('keeps missing and complete excerpts without inventing copy', () => {
  assert.equal(cardExcerpt(null), '')
  assert.equal(cardExcerpt(' A complete\n summary. '), 'A complete summary.')
})

test('counts the ellipsis in the budget and keeps whole words', () => {
  assert.equal(cardExcerpt('One two three four', 10), 'One two…')
  assert.equal(cardExcerpt('One two three four', 8), 'One two…')
  assert.equal(cardExcerpt('One two three four', 7), 'One…')
  assert.equal(cardExcerpt('One, two three', 6), 'One…')
})

test('bounds a single long token without returning just an ellipsis', () => {
  assert.equal(cardExcerpt('abcdefghijk', 6), 'abcde…')
})
