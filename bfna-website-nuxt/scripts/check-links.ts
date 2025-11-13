#!/usr/bin/env tsx
/**
 * Link checking script for Phase 5 - T068
 * Checks all internal links on the site to verify zero broken links (SC-003)
 * 
 * Usage:
 *   npm run check:links                    # Check links on http://localhost:3000
 *   npm run check:links -- --url http://localhost:3000
 */

import { spawn } from 'child_process'

interface CheckOptions {
  url?: string
}

const DEFAULT_URL = 'http://localhost:3000'

async function checkLinks(options: CheckOptions = {}) {
  const url = options.url || DEFAULT_URL
  
  const skipPatterns = [
    'https://www.facebook.com',
    'https://twitter.com',
    'https://www.youtube.com',
    'https://www.instagram.com',
    'https://vimeo.com',
    'https://www.linkedin.com',
    'https://transatlanticperiscope.org',
    'https://www.rangeforecasting.org',
    'https://www.transatlanticbarometer.org',
    'https://bfnadocs.org',
    'https://bfna.us20.list-manage.com',
    'https://ccmdesign.ca',
    'mailto:',
  ]

  console.log(`🔍 Checking links on ${url}...`)
  console.log(`   Skipping external domains: ${skipPatterns.join(', ')}`)
  console.log('')

  return new Promise<void>((resolve, reject) => {
    const args = [
      url,
      '--recurse',
      '--skip', skipPatterns.join(','),
    ]

    const proc = spawn('npx', ['linkinator', ...args], {
      stdio: 'inherit',
      shell: true,
    })

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('')
        console.log('✅ All links are working! Zero broken links found.')
        console.log('')
        resolve()
      } else {
        console.log('')
        console.log('❌ Broken links detected. See output above for details.')
        console.log('')
        reject(new Error(`Link check failed with exit code ${code}`))
      }
    })

    proc.on('error', (error) => {
      console.error('❌ Error running link check:', error.message)
      reject(error)
    })
  })
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: CheckOptions = {}

if (args.includes('--url')) {
  const urlIndex = args.indexOf('--url')
  options.url = args[urlIndex + 1]
}

// Run the check
checkLinks(options)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error running link check:', error.message)
    process.exit(1)
  })

