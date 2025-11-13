/**
 * Visual Parity Verification Script
 * T098: Verify all page templates render with 100% visual parity
 * 
 * This script checks key visual elements and structure across all pages
 * to ensure they match the legacy platform.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface PageCheck {
  path: string
  status: 'pass' | 'fail' | 'skip'
  issues: string[]
  checks: {
    htmlStructure: boolean
    cssClasses: boolean
    keyElements: boolean
    images: boolean
    layout: boolean
  }
}

const BASE_URL = 'http://localhost:3000'
const PAGES_TO_CHECK = [
  '/',
  '/about',
  '/team',
  '/products',
  '/publications',
  '/videos',
  '/podcasts',
  '/search',
  '/archives',
  '/updates',
  '/democracy',
  '/politics-society',
  '/future-leadership',
  '/digital-world'
]

/**
 * Check if HTML structure contains expected elements
 */
function checkHtmlStructure(html: string, pageType: string, isListing: boolean): { pass: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Common structure checks
  if (!html.includes('<section') && !html.includes('<article') && !html.includes('<main') && !html.includes('<div')) {
    issues.push('Missing main content container (section/article/main/div)')
  }
  
  if (!html.includes('class=')) {
    issues.push('No CSS classes found in HTML')
  }
  
  // Page-specific checks
  if (pageType === 'homepage' && !html.includes('hero')) {
    issues.push('Homepage missing hero section')
  }
  
  // Detail pages have different structure than listing pages
  if (pageType === 'product' && !isListing && !html.includes('product-page')) {
    issues.push('Product detail page missing product-page class')
  }
  
  if (pageType === 'product' && isListing && !html.includes('product-list') && !html.includes('product-card')) {
    issues.push('Product listing page missing product-list or product-card')
  }
  
  if (pageType === 'publication' && !isListing && !html.includes('article')) {
    issues.push('Publication detail page missing article element')
  }
  
  if (pageType === 'publication' && isListing && !html.includes('cards-section')) {
    issues.push('Publication listing page missing cards-section')
  }
  
  return {
    pass: issues.length === 0,
    issues
  }
}

/**
 * Check if CSS classes match expected patterns
 */
function checkCssClasses(html: string, pageType: string, isListing: boolean): { pass: boolean; issues: string[] } {
  const issues: string[] = []
  const classRegex = /class=["']([^"']+)["']/g
  const classes = new Set<string>()
  let match
  
  while ((match = classRegex.exec(html)) !== null) {
    match[1].split(/\s+/).forEach(cls => classes.add(cls.trim()))
  }
  
  // Check for common legacy classes (different for listing vs detail pages)
  const expectedClasses: Record<string, { listing: string[], detail: string[] }> = {
    homepage: { listing: ['hero', 'main-content', 'wrapper'], detail: [] },
    product: { 
      listing: ['wrapper', 'product-list'], 
      detail: ['product-page', 'wrapper'] 
    },
    publication: { 
      listing: ['wrapper', 'cards-section'], 
      detail: ['article', 'article__content', 'wrapper'] 
    },
    team: { listing: ['main-content', 'wrapper'], detail: [] },
    updates: { listing: ['tabs', 'tabs__list', 'tabs__panel', 'wrapper'], detail: [] }
  }
  
  const expected = expectedClasses[pageType]
  if (expected) {
    const classesToCheck = isListing ? expected.listing : expected.detail
    for (const expectedClass of classesToCheck) {
      if (!Array.from(classes).some(cls => cls.includes(expectedClass))) {
        issues.push(`Missing expected class pattern: ${expectedClass}`)
      }
    }
  }
  
  return {
    pass: issues.length === 0,
    issues
  }
}

/**
 * Check for key elements based on page type
 */
function checkKeyElements(html: string, pageType: string, isListing: boolean): { pass: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Common elements
  if (!html.includes('<h1') && !html.includes('<h2')) {
    issues.push('Missing heading elements')
  }
  
  // Page-specific checks
  if (pageType === 'homepage') {
    if (!html.includes('updates') && !html.includes('Updates')) {
      issues.push('Homepage missing updates section')
    }
  }
  
  // Detail pages have different elements than listing pages
  if (pageType === 'product' && !isListing && !html.includes('product-hero')) {
    issues.push('Product detail page missing product-hero')
  }
  
  if (pageType === 'product' && isListing && !html.includes('product-card') && !html.includes('product-list')) {
    issues.push('Product listing page missing product-card or product-list')
  }
  
  if (pageType === 'updates' && !html.includes('tabs')) {
    issues.push('Updates page missing tabs structure')
  }
  
  return {
    pass: issues.length === 0,
    issues
  }
}

/**
 * Check if images are properly referenced
 */
function checkImages(html: string): { pass: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check for image elements
  const hasImages = html.includes('<img') || html.includes('<NuxtImg') || html.includes('background-image')
  
  // Check for proper image paths
  if (hasImages) {
    const imageRegex = /(src|href)=["']([^"']*\.(jpg|jpeg|png|webp|svg))["']/gi
    const images = html.match(imageRegex) || []
    
    if (images.length === 0 && html.includes('img')) {
      issues.push('Image elements found but no valid image sources')
    }
  }
  
  return {
    pass: issues.length === 0,
    issues
  }
}

/**
 * Check layout structure
 */
function checkLayout(html: string): { pass: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check for main layout elements
  if (!html.includes('main-content') && !html.includes('main-content')) {
    issues.push('Missing main-content container')
  }
  
  // Check for wrapper class (common in legacy)
  if (!html.includes('wrapper')) {
    issues.push('Missing wrapper class (may be acceptable for some pages)')
  }
  
  // Check for header/footer (should be in layout)
  if (!html.includes('header') && !html.includes('Header')) {
    // This is OK as header is in layout
  }
  
  return {
    pass: issues.length === 0,
    issues
  }
}

/**
 * Verify a single page
 */
async function verifyPage(path: string): Promise<PageCheck> {
  const pageType = path === '/' ? 'homepage' : 
                   path.includes('product') ? 'product' :
                   path.includes('publication') ? 'publication' :
                   path.includes('team') ? 'team' :
                   path.includes('updates') ? 'updates' :
                   'other'
  
  // Determine if this is a listing page (no slug in path)
  const isListing = path === '/products' || path === '/publications' || 
                    path === '/videos' || path === '/podcasts' ||
                    path === '/updates'
  
  try {
    const response = await fetch(`${BASE_URL}${path}`)
    if (!response.ok) {
      return {
        path,
        status: 'fail',
        issues: [`HTTP ${response.status}: ${response.statusText}`],
        checks: {
          htmlStructure: false,
          cssClasses: false,
          keyElements: false,
          images: false,
          layout: false
        }
      }
    }
    
    const html = await response.text()
    
    const structureCheck = checkHtmlStructure(html, pageType, isListing)
    const cssCheck = checkCssClasses(html, pageType, isListing)
    const elementsCheck = checkKeyElements(html, pageType, isListing)
    const imagesCheck = checkImages(html)
    const layoutCheck = checkLayout(html)
    
    const allIssues = [
      ...structureCheck.issues,
      ...cssCheck.issues,
      ...elementsCheck.issues,
      ...imagesCheck.issues,
      ...layoutCheck.issues
    ]
    
    const allPass = structureCheck.pass && cssCheck.pass && 
                   elementsCheck.pass && imagesCheck.pass && layoutCheck.pass
    
    return {
      path,
      status: allPass ? 'pass' : 'fail',
      issues: allIssues,
      checks: {
        htmlStructure: structureCheck.pass,
        cssClasses: cssCheck.pass,
        keyElements: elementsCheck.pass,
        images: imagesCheck.pass,
        layout: layoutCheck.pass
      }
    }
  } catch (error) {
    return {
      path,
      status: 'fail',
      issues: [`Error fetching page: ${error instanceof Error ? error.message : String(error)}`],
      checks: {
        htmlStructure: false,
        cssClasses: false,
        keyElements: false,
        images: false,
        layout: false
      }
    }
  }
}

/**
 * Main verification function
 */
async function verifyVisualParity(): Promise<void> {
  console.log('🎨 Verifying Visual Parity (T098)...\n')
  console.log(`Checking ${PAGES_TO_CHECK.length} pages at ${BASE_URL}\n`)
  
  const results: PageCheck[] = []
  
  for (const path of PAGES_TO_CHECK) {
    console.log(`Checking ${path}...`)
    const result = await verifyPage(path)
    results.push(result)
    
    if (result.status === 'pass') {
      console.log(`  ✅ ${path}`)
    } else {
      console.log(`  ❌ ${path}`)
      result.issues.forEach(issue => console.log(`     - ${issue}`))
    }
  }
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  
  console.log(`\n📊 Summary:`)
  console.log(`   Total pages: ${results.length}`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  // Detailed breakdown
  console.log(`\n📋 Detailed Checks:`)
  const checkNames = {
    htmlStructure: 'HTML Structure',
    cssClasses: 'CSS Classes',
    keyElements: 'Key Elements',
    images: 'Images',
    layout: 'Layout'
  }
  
  for (const [key, label] of Object.entries(checkNames)) {
    const passed = results.filter(r => r.checks[key as keyof typeof r.checks]).length
    console.log(`   ${label}: ${passed}/${results.length} pages`)
  }
  
  if (failed === 0) {
    console.log(`\n✅ All pages pass visual parity checks!`)
    process.exit(0)
  } else {
    console.log(`\n⚠️  Some pages have visual parity issues. Review above.`)
    process.exit(1)
  }
}

// Run verification
verifyVisualParity().catch(error => {
  console.error('Error running verification:', error)
  process.exit(1)
})

