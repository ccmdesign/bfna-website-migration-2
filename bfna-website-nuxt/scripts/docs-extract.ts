import { promises as fs } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const srcDir = resolve(projectRoot, 'src')
const componentsDir = resolve(srcDir, 'components', 'ds')
const docsOutputDir = resolve(srcDir, 'pages', 'docs', 'demos', '_docs')

export function getDocsFragmentPath(componentPath: string): string {
  const baseName = basenameWithoutExtension(componentPath)
  const slug = camelToKebab(baseName)
  return resolve(docsOutputDir, `${slug}.html`)
}

type ExtractOptions = {
  files?: string[]
  all?: boolean
  quiet?: boolean
}

type CommentBlock = {
  title: string
  description: string[]
  meta: Array<{ label: string; value: string }>
}

type ParsedComment = {
  description: string[]
  meta: Array<{ label: string; value: string }>
  tags: Record<string, string[]>
}

export async function extractDocs(options: ExtractOptions) {
  const targets = new Set<string>()

  if (options.all) {
    const all = await listComponentFiles(componentsDir)
    all.forEach(file => targets.add(file))
  }

  for (const file of options.files ?? []) {
    const resolved = await resolveComponentIdentifier(file)
    if (resolved) targets.add(resolved)
  }

  if (targets.size === 0) {
    if (!options.quiet) {
      console.warn('[docs-extract] No component files to process')
    }
    return
  }

  await fs.mkdir(docsOutputDir, { recursive: true })

  for (const filePath of targets) {
    try {
      const source = await fs.readFile(filePath, 'utf8')
      const blocks = collectCommentBlocks(source)
      if (blocks.length === 0) {
        if (!options.quiet) {
          console.warn(`[docs-extract] No JSDoc blocks found in ${relativeToRoot(filePath)}`)
        }
        continue
      }

      const outFile = await writeFragment(filePath, blocks)
      if (!options.quiet) {
        console.log(`[docs-extract] Generated ${relativeToRoot(outFile)}`)
      }
    } catch (error) {
      console.error(`[docs-extract] Failed to process ${relativeToRoot(filePath)}:`)
      console.error(error)
    }
  }
}

function collectCommentBlocks(source: string): CommentBlock[] {
  const blocks: CommentBlock[] = []
  const regex = /\/\*\*[\s\S]*?\*\//g
  let match: RegExpExecArray | null

  while ((match = regex.exec(source))) {
    const comment = match[0]
    const parsed = parseCommentBlock(comment)
    if (!parsed) continue

    const context = extractContextLine(source, match.index + comment.length)
    const title = determineTitle(parsed, context)

    blocks.push({
      title,
      description: parsed.description,
      meta: parsed.meta
    })
  }

  return blocks
}

function parseCommentBlock(comment: string): ParsedComment | null {
  const body = comment
    .replace(/^\/\*\*/u, '')
    .replace(/\*\/$/u, '')

  const rawLines = body
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*\*\s?/, '').trimEnd())

  const description: string[] = []
  const meta: Array<{ label: string; value: string }> = []
  const tags: Record<string, string[]> = {}

  let paragraphBuffer: string[] = []
  let currentTag: { key: string; index: number } | null = null
  let currentMetaEntry: { label: string; value: string } | null = null
  let skippingExample = false

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return
    const text = paragraphBuffer.join('\n').trim()
    if (text) {
      description.push(text)
    }
    paragraphBuffer = []
  }

  const pushTagValue = (label: string, value: string) => {
    if (!tags[label]) {
      tags[label] = []
    }
    tags[label].push(value)
    return tags[label].length - 1
  }

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushParagraph()
      currentTag = null
      currentMetaEntry = null
      if (skippingExample) {
        skippingExample = false
      }
      continue
    }

    if (skippingExample) {
      continue
    }

    if (trimmed.startsWith('@')) {
      flushParagraph()

      const spaceIndex = trimmed.indexOf(' ')
      const label = spaceIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIndex)
      const rest = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim()

      if (label === 'example') {
        skippingExample = true
        currentTag = null
        currentMetaEntry = null
        continue
      }

      const tagIndex = pushTagValue(label, rest)
      const shouldExpose = label !== 'component'

      currentMetaEntry = shouldExpose ? { label, value: rest } : null
      if (currentMetaEntry) {
        meta.push(currentMetaEntry)
      }

      currentTag = { key: label, index: tagIndex }
      continue
    }

    if (currentTag) {
      const { key, index } = currentTag
      const existing = tags[key][index]
      tags[key][index] = existing ? `${existing}\n${rawLine}` : rawLine

      if (currentMetaEntry) {
        currentMetaEntry.value = currentMetaEntry.value
          ? `${currentMetaEntry.value}\n${rawLine}`
          : rawLine
      }
      continue
    }

    paragraphBuffer.push(rawLine)
  }

  flushParagraph()

  if (description.length === 0 && meta.length === 0) {
    return null
  }

  meta.forEach(entry => {
    entry.value = entry.value.trim()
  })

  for (const key of Object.keys(tags)) {
    tags[key] = tags[key].map(value => value.trim()).filter(Boolean)
    if (tags[key].length === 0) {
      delete tags[key]
    }
  }

  return { description, meta, tags }
}

function extractContextLine(source: string, index: number): string {
  const remainder = source.slice(index)
  const lines = remainder.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (trimmed.startsWith('*')) continue
    return trimmed
  }
  return ''
}

function determineTitle(parsed: ParsedComment, contextLine: string): string {
  const componentTag = parsed.tags.component?.[0]
  if (componentTag) {
    return `Component: ${componentTag}`
  }

  const slotTag = parsed.tags.slot?.[0]
  if (slotTag) {
    return `Slot: ${slotTag}`
  }

  const events = parsed.tags.event ?? []
  if (events.length === 1) {
    return `Event: ${events[0]}`
  }
  if (events.length > 1) {
    return 'Events'
  }

  const propTag = parsed.tags.prop?.[0]
  if (propTag) {
    return `Prop: ${propTag}`
  }

  const contextPropMatch = contextLine.match(/^['"]?([A-Za-z0-9_$-]+)['"]?\s*[:(=]/)
  if (contextPropMatch) {
    return `Prop: ${contextPropMatch[1]}`
  }

  if (parsed.description.length > 0) {
    const firstParagraph = parsed.description[0]
    const sentenceMatch = firstParagraph.match(/^([^.!?]+[.!?]?)/)
    if (sentenceMatch) {
      const sentence = sentenceMatch[1].trim()
      if (sentence) {
        return sentence
      }
    }
  }

  if (parsed.meta.length > 0) {
    return formatMetaLabel(parsed.meta[0].label)
  }

  return 'Documentation'
}

async function writeFragment(componentPath: string, blocks: CommentBlock[]): Promise<string> {
  const outputPath = getDocsFragmentPath(componentPath)

  const parts: string[] = []
  parts.push('<div class="stack" data-space="xs">')

  for (const block of blocks) {
    parts.push('  <article class="stack" data-space="2xs">')
    parts.push(`    <h3>${escapeHtml(block.title)}</h3>`)

    for (const paragraph of block.description) {
      parts.push(`    <p>${escapeHtmlWithBreaks(paragraph)}</p>`)
    }

    if (block.meta.length > 0) {
      parts.push('    <dl class="stack" data-space="4xs">')
      for (const entry of block.meta) {
        const label = formatMetaLabel(entry.label)
        const value = escapeHtmlWithBreaks(entry.value)
        parts.push(`      <dt>${escapeHtml(label)}</dt>`)
        parts.push(`      <dd>${value}</dd>`)
      }
      parts.push('    </dl>')
    }

    parts.push('  </article>')
  }

  parts.push('</div>')
  parts.push('')

  await fs.writeFile(outputPath, parts.join('\n'), 'utf8')
  return outputPath
}

async function listComponentFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      const nested = await listComponentFiles(entryPath)
      files.push(...nested)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(entryPath)
    }
  }

  return files
}

async function resolveComponentIdentifier(identifier: string): Promise<string | null> {
  const normalized = identifier.replace(/^['"]|['"]$/g, '')
  const candidatePaths = [
    resolve(projectRoot, normalized),
    resolve(srcDir, normalized),
    resolve(componentsDir, normalized)
  ]

  for (const candidate of candidatePaths) {
    if (await fileExists(candidate)) {
      return candidate
    }
  }

  const fileName = buildComponentFileName(normalized)
  if (fileName) {
    const direct = resolve(componentsDir, fileName)
    if (await fileExists(direct)) {
      return direct
    }
  }

  console.error(`[docs-extract] Unable to resolve component for "${identifier}"`)
  return null
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path)
    return stat.isFile()
  } catch {
    return false
  }
}

function buildComponentFileName(input: string): string | null {
  let name = input.replace(/\.vue$/i, '')
  if (name.includes(sep)) {
    return null
  }

  if (!name.startsWith('ccm')) {
    name = `ccm${name.charAt(0).toUpperCase()}${name.slice(1)}`
  }

  if (name.includes('-')) {
    const segments = name.split('-')
    name = segments.shift() ?? ''
    name += segments.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('')
  }

  if (!name) return null
  return `${name}.vue`
}

function basenameWithoutExtension(filePath: string): string {
  const base = filePath.split(sep).pop() ?? filePath
  return base.replace(/\.vue$/i, '')
}

function camelToKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlWithBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function formatMetaLabel(label: string): string {
  const lower = label.toLowerCase()
  const special: Record<string, string> = {
    component: 'Component',
    prop: 'Prop',
    event: 'Event',
    slot: 'Slot',
    category: 'Category',
    standards: 'Standards'
  }

  if (special[lower]) {
    return special[lower]
  }

  return lower
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function relativeToRoot(path: string): string {
  if (path.startsWith(projectRoot + sep)) {
    return path.slice(projectRoot.length + 1).split(sep).join('/')
  }
  return path.split(sep).join('/')
}

function parseArguments(argv: string[]): ExtractOptions {
  const options: ExtractOptions = { files: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--all') {
      options.all = true
      continue
    }
    if (arg === '--changed') {
      const next = argv[i + 1]
      if (next) {
        options.files?.push(next)
        i += 1
      }
      continue
    }
    if (arg === '--quiet') {
      options.quiet = true
      continue
    }
    if (arg.startsWith('--')) {
      continue
    }
    options.files?.push(arg)
  }
  return options
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options.all && (options.files?.length ?? 0) === 0) {
    console.error('[docs-extract] Usage: docs-extract.ts [--all] [--changed <path>] [component ...]')
    process.exitCode = 1
    return
  }
  await extractDocs(options)
}

const isCli = (() => {
  try {
    return resolve(process.argv[1] ?? '') === __filename
  } catch {
    return false
  }
})()

if (isCli) {
  main().catch(error => {
    console.error('[docs-extract] Unexpected error')
    console.error(error)
    process.exitCode = 1
  })
}

