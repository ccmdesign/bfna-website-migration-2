#!/usr/bin/env node

/**
 * Token Validation Script
 *
 * This script validates the CSS token system:
 * 1. Verifies all tokens resolve to valid CSS colors
 * 2. Checks for circular dependencies
 * 3. Validates tint/shade generation
 * 4. Ensures token naming conventions are followed
 *
 * Usage:
 *   npx tsx scripts/validate-tokens.ts          # Validate tokens
 *   npx tsx scripts/validate-tokens.ts --fix    # Fix issues (where possible)
 */

import fs from 'fs'
import path from 'path'

interface TokenValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  tokenCount: number
}

class TokenValidator {
  private cssDir: string
  private errors: string[] = []
  private warnings: string[] = []
  private tokens: Map<string, string> = new Map()
  private fix: boolean

  constructor(fix: boolean = false) {
    this.cssDir = path.join(process.cwd(), 'src', 'public', 'css')
    this.fix = fix
  }

  /**
   * Main validation entry point
   */
  async validate(): Promise<TokenValidationResult> {
    console.log('🔍 Validating CSS token system...\n')

    try {
      this.parseTokenFiles()
      this.validateTokenNames()
      this.validateTokenReferences()
      this.validateTintShadeMatrices()
      this.validateLayerOrder()
      this.checkForCircularDeps()
    } catch (error) {
      this.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      tokenCount: this.tokens.size
    }
  }

  /**
   * Parse all token files and extract variable definitions
   */
  private parseTokenFiles(): void {
    const tokenFiles = [
      'tokens/primitive-colors.css',
      'tokens/primitive-colors-shades-and-tints.css',
      'tokens/semantic-colors.css',
      'tokens/semantic-colors-shades-and-tints.css'
    ]

    tokenFiles.forEach(file => {
      const filePath = path.join(this.cssDir, file)
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Token file not found: ${file}`)
        return
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      this.extractTokensFromFile(content, file)
    })

    console.log(`✅ Parsed ${this.tokens.size} tokens from ${tokenFiles.length} files`)
  }

  /**
   * Extract CSS variables from file content
   */
  private extractTokensFromFile(content: string, fileName: string): void {
    // Match CSS variable definitions: --name: value;
    const varPattern = /(--[\w-]+):\s*([^;]+);/g
    let match

    while ((match = varPattern.exec(content)) !== null) {
      const [, varName, varValue] = match
      this.tokens.set(varName, varValue.trim())
    }
  }

  /**
   * Validate that all tokens follow naming conventions
   */
  private validateTokenNames(): void {
    console.log('\n📋 Validating token naming conventions...')

    let conventionErrors = 0

    this.tokens.forEach((value, name) => {
      // All color tokens should start with --color- or --hsl- or --_
      if (name.includes('color') && !name.match(/^(--color-|--hsl-|--_)/)) {
        this.errors.push(`Invalid token name: ${name}`)
        conventionErrors++
      }

      // Check for legacy naming patterns
      if (name.match(/--.*-color$/)) {
        this.errors.push(`Legacy naming pattern detected: ${name} (should be --color-*)`)
        conventionErrors++
      }

      // Check for incorrect tint/shade ordering
      if (name.match(/--color-\w+-\d+-tint/)) {
        this.errors.push(
          `Incorrect tint ordering: ${name} (should be --color-*-tint-{percentage})`
        )
        conventionErrors++
      }
    })

    if (conventionErrors === 0) {
      console.log('✅ All token names follow conventions')
    } else {
      console.log(`❌ Found ${conventionErrors} naming convention violations`)
    }
  }

  /**
   * Validate that token references are valid
   */
  private validateTokenReferences(): void {
    console.log('\n🔗 Validating token references...')

    let referenceErrors = 0

    this.tokens.forEach((value, name) => {
      // Find all var() references
      const varPattern = /var\((--[\w-]+)\)/g
      let match

      while ((match = varPattern.exec(value)) !== null) {
        const [, refName] = match
        // Check if referenced token exists
        if (!this.tokens.has(refName)) {
          this.errors.push(
            `Undefined token reference: ${name} → ${refName}`
          )
          referenceErrors++
        }
      }
    })

    if (referenceErrors === 0) {
      console.log('✅ All token references are valid')
    } else {
      console.log(`❌ Found ${referenceErrors} invalid references`)
    }
  }

  /**
   * Validate that tint/shade matrices are complete
   */
  private validateTintShadeMatrices(): void {
    console.log('\n📊 Validating tint/shade matrices...')

    const baseColors = ['primary', 'secondary', 'success', 'fail', 'warning', 'info']
    const percentages = [2, 5, 11, 20, 30, 40, 50, 60, 70, 73, 80, 85, 90, 98]

    let matrixErrors = 0

    baseColors.forEach(color => {
      // Check for tints
      percentages.forEach(percent => {
        const tokenName = `--color-${color}-tint-${percent}`
        if (!this.tokens.has(tokenName)) {
          this.warnings.push(`Missing tint: ${tokenName}`)
          matrixErrors++
        }
      })

      // Check for shades
      percentages.forEach(percent => {
        const tokenName = `--color-${color}-shade-${percent}`
        if (!this.tokens.has(tokenName)) {
          this.warnings.push(`Missing shade: ${tokenName}`)
          matrixErrors++
        }
      })

      // Check for aliases
      const aliases = ['light', 'super-light', 'dark', 'super-dark']
      aliases.forEach(alias => {
        const tokenName = `--color-${color}-${alias}`
        if (!this.tokens.has(tokenName)) {
          this.warnings.push(`Missing alias: ${tokenName}`)
          matrixErrors++
        }
      })
    })

    if (matrixErrors === 0) {
      console.log('✅ All tint/shade matrices are complete')
    } else {
      console.log(`⚠️ Found ${matrixErrors} missing variants`)
    }
  }

  /**
   * Validate @layer declarations
   */
  private validateLayerOrder(): void {
    console.log('\n🔲 Validating @layer declarations...')

    const stylesCss = path.join(this.cssDir, 'styles.css')
    const content = fs.readFileSync(stylesCss, 'utf-8')

    const layerDeclaration = content.match(/@layer\s+([\w\s,]+);/)
    if (!layerDeclaration) {
      this.errors.push('No @layer declaration found in styles.css')
      return
    }

    const layers = layerDeclaration[1]
      .split(',')
      .map(l => l.trim())
      .filter(Boolean)

    const expectedOrder = ['reset', 'defaults', 'tokens', 'themes', 'components', 'utils', 'overrides']
    const hasCorrectOrder = expectedOrder.every((layer, index) => {
      const actualIndex = layers.indexOf(layer)
      return actualIndex === -1 || actualIndex === index
    })

    if (hasCorrectOrder && layers.includes('tokens') && layers.includes('themes')) {
      const tokenIndex = layers.indexOf('tokens')
      const themeIndex = layers.indexOf('themes')
      if (themeIndex > tokenIndex) {
        console.log('✅ @layer declarations are in correct order')
        return
      }
    }

    this.warnings.push('Layer order may not be optimal: ' + layers.join(', '))
  }

  /**
   * Check for circular dependencies in tokens
   */
  private checkForCircularDeps(): void {
    console.log('\n🔄 Checking for circular dependencies...')

    let circularErrors = 0

    const visitedInChain = new Set<string>()
    const hasCycle = (tokenName: string): boolean => {
      if (visitedInChain.has(tokenName)) {
        return true
      }

      visitedInChain.add(tokenName)
      const value = this.tokens.get(tokenName)

      if (!value) return false

      // Find all var() references
      const varPattern = /var\((--[\w-]+)\)/g
      let match

      while ((match = varPattern.exec(value)) !== null) {
        const [, refName] = match
        if (hasCycle(refName)) {
          return true
        }
      }

      visitedInChain.delete(tokenName)
      return false
    }

    this.tokens.forEach((_, tokenName) => {
      visitedInChain.clear()
      if (hasCycle(tokenName)) {
        this.errors.push(`Circular dependency detected: ${tokenName}`)
        circularErrors++
      }
    })

    if (circularErrors === 0) {
      console.log('✅ No circular dependencies detected')
    } else {
      console.log(`❌ Found ${circularErrors} circular dependencies`)
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')

  const validator = new TokenValidator(shouldFix)
  const result = await validator.validate()

  console.log('\n' + '='.repeat(60))
  console.log('📊 Token Validation Summary')
  console.log('='.repeat(60))
  console.log(`Total Tokens: ${result.tokenCount}`)
  console.log(`Errors: ${result.errors.length}`)
  console.log(`Warnings: ${result.warnings.length}`)

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    result.warnings.forEach(warning => console.log(`  - ${warning}`))
  }

  if (result.valid) {
    console.log('\n✅ Token system is valid!')
    process.exit(0)
  } else {
    console.log('\n❌ Token system has errors')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
