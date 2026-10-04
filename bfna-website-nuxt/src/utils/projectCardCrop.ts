/** Legacy artwork contains a browser mockup at (60, 118), sized 1280 × 704.
 * Key by exact source so future CMS replacements never inherit these crops.
 * This changes only the card viewport, preserving the original artwork.
 */
const browserFrameImages = new Set([
  'https://bfna.simplyas.com/assets/26e31f94-1250-45e4-a7dd-ca9c7d9d2102',
  'https://bfna.simplyas.com/assets/87879ef0-ba3c-4258-8235-08e6c62a6aa8',
  'https://bfna.simplyas.com/assets/8e338dbf-a9be-49b8-a36f-017e3f865db2',
  'https://bfna.simplyas.com/assets/87e8dea1-8bfe-49fc-8403-8cd8479ac0ee',
  'https://bfna.simplyas.com/assets/1c917539-163e-46cc-97d3-4ac740f79562',
  'https://bfna.simplyas.com/assets/2281adbb-4cc7-4fe6-b0f1-a6c790f125e3',
])

export const projectCardCrop = (src?: string | null) =>
  src && browserFrameImages.has(src)
    ? { viewBox: '60 118 1280 704', width: 1400, height: 897 }
    : undefined
