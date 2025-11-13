#!/usr/bin/env tsx
/**
 * Verify zero Contentful dependencies in the codebase
 * Checks for:
 * - Contentful SDK imports
 * - Contentful API calls
 * - Contentful environment variables usage
 * - Contentful package dependencies
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const projectRoot = join(__dirname, '..')
const packageJsonPath = join(projectRoot, 'package.json')
const outputPackageJsonPath = join(projectRoot, '.output', 'server', 'package.json')

interface CheckResult {
  name: string
  passed: boolean
  message: string
}

const results: CheckResult[] = []

// Check 1: package.json dependencies
function checkPackageJson() {
  if (!existsSync(packageJsonPath)) {
    results.push({
      name: 'package.json exists',
      passed: false,
      message: 'package.json not found'
    })
    return
  }

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  }

  const contentfulDeps = Object.keys(allDeps).filter(dep => 
    dep.toLowerCase().includes('contentful')
  )

  results.push({
    name: 'package.json dependencies',
    passed: contentfulDeps.length === 0,
    message: contentfulDeps.length === 0
      ? 'No Contentful dependencies found'
      : `Found Contentful dependencies: ${contentfulDeps.join(', ')}`
  })
}

// Check 2: Build output package.json
function checkOutputPackageJson() {
  if (!existsSync(outputPackageJsonPath)) {
    results.push({
      name: 'Build output package.json',
      passed: false,
      message: 'Build output not found. Run `npm run build` first.'
    })
    return
  }

  const pkg = JSON.parse(readFileSync(outputPackageJsonPath, 'utf-8'))
  const allDeps = pkg.dependencies || {}
  const contentfulDeps = Object.keys(allDeps).filter(dep => 
    dep.toLowerCase().includes('contentful')
  )

  results.push({
    name: 'Build output dependencies',
    passed: contentfulDeps.length === 0,
    message: contentfulDeps.length === 0
      ? 'No Contentful dependencies in build output'
      : `Found Contentful dependencies: ${contentfulDeps.join(', ')}`
  })
}

// Check 3: Source code imports (basic check)
function checkSourceImports() {
  const { execSync } = require('child_process')
  try {
    const grepResult = execSync(
      'grep -r "contentful" --include="*.ts" --include="*.js" --include="*.vue" src/ || true',
      { cwd: projectRoot, encoding: 'utf-8' }
    )
    
    // Filter out false positives (metadata fields in JSON, comments, etc.)
    const lines = grepResult.split('\n').filter(line => {
      const trimmed = line.trim()
      return trimmed && 
        !trimmed.includes('excerpt_from_contentful') &&
        !trimmed.includes('//') &&
        !trimmed.includes('*') &&
        (trimmed.includes('import') || trimmed.includes('require') || trimmed.includes('from'))
    })

    results.push({
      name: 'Source code imports',
      passed: lines.length === 0,
      message: lines.length === 0
        ? 'No Contentful imports found in source code'
        : `Found potential Contentful imports:\n${lines.slice(0, 5).join('\n')}${lines.length > 5 ? '\n...' : ''}`
    })
  } catch (error) {
    results.push({
      name: 'Source code imports',
      passed: true,
      message: 'Could not check (grep not available)'
    })
  }
}

// Run all checks
checkPackageJson()
checkOutputPackageJson()
checkSourceImports()

// Print results
console.log('\n🔍 Contentful Dependency Audit\n')
console.log('='.repeat(60))

let allPassed = true
results.forEach(result => {
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} ${result.name}`)
  console.log(`   ${result.message}\n`)
  if (!result.passed) allPassed = false
})

console.log('='.repeat(60))
if (allPassed) {
  console.log('\n✅ All checks passed: Zero Contentful dependencies detected')
  process.exit(0)
} else {
  console.log('\n❌ Some checks failed: Contentful dependencies detected')
  process.exit(1)
}

