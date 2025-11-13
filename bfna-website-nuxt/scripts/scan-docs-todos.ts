import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const targetDir = resolve(root, 'src/content/docs/components')

const criticalSections = [
  'TL;DR',
  'Overview',
  'When to use',
  'When not to use',
  'Anatomy',
  'Variants',
  'States',
  'API',
  'Accessibility',
  'Content guidance',
  'Implementation notes',
  'Demo',
  'Cross-links',
  'Validation checklist',
  'Changelog'
]

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(entryPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath)
    }
  }

  return files
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractSection(content: string, heading: string): string | null {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*\n([\\s\\S]*?)(?=^##\\s+|$)`, 'm')
  const match = content.match(pattern)
  if (!match) return null
  return match[1]?.trim() ?? ''
}

async function main() {
  try {
    const stats = await stat(targetDir)
    if (!stats.isDirectory()) {
      console.warn('[docs:scan-todos] Components docs directory not found, skipping')
      return
    }
  } catch (error) {
    console.warn('[docs:scan-todos] Components docs directory not found, skipping')
    return
  }

  const files = await collectMarkdownFiles(targetDir)
  const failures: Array<{ file: string, message: string }> = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')

    if (/-\s*TODO\b/i.test(content)) {
      failures.push({ file, message: 'Contains TODO placeholder(s)' })
    }

    for (const heading of criticalSections) {
      const sectionBody = extractSection(content, heading)
      if (sectionBody === null) {
        continue
      }
      if (sectionBody.trim().length === 0) {
        failures.push({ file, message: `Section "${heading}" is empty` })
      }
    }
  }

  if (failures.length > 0) {
    console.error('[docs:scan-todos] Issues detected:')
    for (const failure of failures) {
      console.error(`- ${failure.file.replace(root + '/', '')}: ${failure.message}`)
    }
    process.exitCode = 1
    return
  }

  console.log('[docs:scan-todos] No TODO placeholders or empty sections detected.')
}

main().catch(error => {
  console.error('[docs:scan-todos] Unexpected error')
  console.error(error)
  process.exitCode = 1
})

