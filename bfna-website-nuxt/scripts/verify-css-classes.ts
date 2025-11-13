/**
 * Script to verify CSS classes are preserved exactly between legacy and new platform
 * T097: Verify CSS classes are preserved exactly between legacy and new platform
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'

interface ClassMatch {
  file: string
  legacyClasses: Set<string>
  nuxtClasses: Set<string>
  missing: string[]
  extra: string[]
}

const LEGACY_DIR = join(process.cwd(), 'bfna-website-legacy/src/_includes')
const NUXT_DIR = join(process.cwd(), 'bfna-website-nuxt/src/components/legacy')
const NUXT_PAGES_DIR = join(process.cwd(), 'bfna-website-nuxt/src/pages')

/**
 * Extract CSS classes from HTML/Vue template content
 */
function extractClasses(content: string): Set<string> {
  const classRegex = /class=["']([^"']+)["']/g
  const classes = new Set<string>()
  let match

  while ((match = classRegex.exec(content)) !== null) {
    const classList = match[1].split(/\s+/).filter(Boolean)
    classList.forEach(cls => classes.add(cls.trim()))
  }

  // Also handle :class bindings in Vue
  const vueClassRegex = /:class=["'\[{]([^"'\]}]+)["'\]}]/g
  while ((match = vueClassRegex.exec(content)) !== null) {
    const classExpr = match[1]
    // Extract class names from template literals and expressions
    const templateClasses = classExpr.match(/(['"])([^'"]+)\1/g) || []
    templateClasses.forEach(tc => {
      const cls = tc.replace(/['"]/g, '').trim()
      if (cls) classes.add(cls)
    })
  }

  return classes
}

/**
 * Find corresponding Nuxt component/page for legacy template
 */
function findNuxtCounterpart(legacyPath: string): string | null {
  const fileName = legacyPath.split('/').pop()?.replace('.njk', '.vue')
  if (!fileName) return null

  // Check components first
  const componentPath = join(NUXT_DIR, fileName)
  if (statSync(componentPath, { throwIfNoEntry: false })?.isFile()) {
    return componentPath
  }

  // Check pages
  const pagePath = join(NUXT_PAGES_DIR, fileName)
  if (statSync(pagePath, { throwIfNoEntry: false })?.isFile()) {
    return pagePath
  }

  // Check subdirectories
  const subdirs = ['atoms', 'molecules', 'organisms', 'templates']
  for (const subdir of subdirs) {
    const subdirPath = join(NUXT_DIR, subdir, fileName)
    if (statSync(subdirPath, { throwIfNoEntry: false })?.isFile()) {
      return subdirPath
    }
  }

  return null
}

/**
 * Compare classes between legacy and Nuxt files
 */
function compareClasses(legacyPath: string, nuxtPath: string): ClassMatch {
  const legacyContent = readFileSync(legacyPath, 'utf-8')
  const nuxtContent = readFileSync(nuxtPath, 'utf-8')

  const legacyClasses = extractClasses(legacyContent)
  const nuxtClasses = extractClasses(nuxtContent)

  const missing = Array.from(legacyClasses).filter(cls => !nuxtClasses.has(cls))
  const extra = Array.from(nuxtClasses).filter(cls => !legacyClasses.has(cls))

  return {
    file: legacyPath,
    legacyClasses,
    nuxtClasses,
    missing,
    extra
  }
}

/**
 * Main verification function
 */
function verifyCssClasses(): void {
  console.log('🔍 Verifying CSS class preservation...\n')

  const legacyFiles = readdirSync(LEGACY_DIR, { recursive: true })
    .filter(file => typeof file === 'string' && extname(file) === '.njk')
    .map(file => join(LEGACY_DIR, file))

  const results: ClassMatch[] = []
  let matched = 0
  let unmatched = 0

  for (const legacyFile of legacyFiles) {
    const nuxtFile = findNuxtCounterpart(legacyFile)
    if (!nuxtFile) {
      console.log(`⚠️  No Nuxt counterpart found for: ${legacyFile}`)
      unmatched++
      continue
    }

    try {
      const match = compareClasses(legacyFile, nuxtFile)
      results.push(match)
      matched++

      if (match.missing.length > 0 || match.extra.length > 0) {
        console.log(`\n📄 ${legacyFile.split('/').pop()}`)
        if (match.missing.length > 0) {
          console.log(`   ❌ Missing classes: ${match.missing.join(', ')}`)
        }
        if (match.extra.length > 0) {
          console.log(`   ⚠️  Extra classes: ${match.extra.join(', ')}`)
        }
      }
    } catch (error) {
      console.error(`❌ Error comparing ${legacyFile}:`, error)
    }
  }

  const totalMissing = results.reduce((sum, r) => sum + r.missing.length, 0)
  const totalExtra = results.reduce((sum, r) => sum + r.extra.length, 0)

  console.log(`\n📊 Summary:`)
  console.log(`   Files matched: ${matched}`)
  console.log(`   Files unmatched: ${unmatched}`)
  console.log(`   Total missing classes: ${totalMissing}`)
  console.log(`   Total extra classes: ${totalExtra}`)

  if (totalMissing === 0 && totalExtra === 0) {
    console.log(`\n✅ All CSS classes preserved exactly!`)
    process.exit(0)
  } else {
    console.log(`\n⚠️  CSS class mismatches found. Review above.`)
    process.exit(1)
  }
}

// Run verification
verifyCssClasses()

