import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { parseComponentDocs } from '../src/utils/parseComponentDocs'
import type { ComponentDoc, PropDoc } from '../src/utils/parseComponentDocs'
import { getDesignSystemComponentEntries } from '../src/utils/designSystemRegistry'

async function run() {
  const root = process.cwd()
  const outDir = resolve(root, 'src/public/component-docs')
  const docsDir = resolve(root, 'src/content/docs/components')
  const legacyComponentsDir = resolve(root, '_process/docs-deprecated/components')
  const promptPath = resolve(root, 'src/content/docs/prompts/component-docs.prompt.md')
  const historyPath = resolve(root, 'src/content/docs/prompts/history.md')

  await mkdir(outDir, { recursive: true })
  await mkdir(docsDir, { recursive: true })

  const components = getDesignSystemComponentEntries({ refresh: true })

  if (!components.length) {
    console.warn('[docs:components] No design system components found')
    return
  }

  const indexItems: Array<{ name: string, displayName: string, description: string }> = []
  const manifestItems: Array<{
    componentId: string
    slug: string
    docsJson: string
    docsJsonExists: boolean
    overviewPath: string
    overviewExists: boolean
    demoPath: string
    demoExists: boolean
    guidancePath: string
    guidanceExists: boolean
  }> = []
  const generatedFiles = new Set<string>()
  const promptMeta = await loadPromptMetadata(promptPath)
  const promptRunId = `${promptMeta.promptId}-${Date.now()}`
  const historyEntries: Array<{ componentId: string, slug: string, docPath: string, dataHash: string }> = []

  for (const component of components) {
    const { name } = component
    const slug = toSlug(name)
    try {
      const meta = await parseComponentDocs(name)

      // Write per-component JSON
      const filePath = resolve(outDir, `${name}.json`)
      await writeFile(filePath, JSON.stringify(meta, null, 2), 'utf8')
      generatedFiles.add(`${name}.json`)

      indexItems.push({
        name,
        displayName: meta.displayName || name,
        description: meta.description || ''
      })

      const overviewRelPath = `src/content/docs/components/${slug}.md`
      const demoRelPath = `src/components/docs/demos/${slug}-demo.vue`
      const guidanceRelPath = `src/pages/docs/demos/_docs/${slug}.html`

      const docPath = resolve(root, overviewRelPath)
      const dataHash = hashComponentData(meta)
      const docExists = await fileExists(docPath)

      if (!docExists) {
        await writeFile(docPath, buildComponentDoc({
          componentName: name,
          slug,
          meta,
          prompt: promptMeta,
          promptRunId,
          dataHash,
          legacyComponentsDir,
          demoRelPath
        }), 'utf8')
      } else {
        const existing = await readFile(docPath, 'utf8')
        const updated = updateExistingDoc(existing, {
          prompt: promptMeta,
          promptRunId,
          dataHash,
          props: meta.props,
          componentName: name,
          demoRelPath
        })

        if (updated !== existing) {
          await writeFile(docPath, updated, 'utf8')
        }
      }

      const [overviewExists, demoExists, guidanceExists] = await Promise.all([
        fileExists(docPath),
        fileExists(resolve(root, demoRelPath)),
        fileExists(resolve(root, guidanceRelPath))
      ])

      historyEntries.push({
        componentId: name,
        slug,
        docPath: overviewRelPath,
        dataHash
      })

      manifestItems.push({
        componentId: name,
        slug,
        docsJson: `/component-docs/${name}.json`,
        docsJsonExists: true,
        overviewPath: overviewRelPath,
        overviewExists,
        demoPath: demoRelPath,
        demoExists,
        guidancePath: guidanceRelPath,
        guidanceExists
      })
    } catch (err) {
      // Still produce an index entry, but skip per-component file
      console.warn(`[docs:components] Failed to parse ${name}:`, err)
      indexItems.push({ name, displayName: name, description: '' })

      manifestItems.push({
        componentId: name,
        slug,
        docsJson: `/component-docs/${name}.json`,
        docsJsonExists: false,
        overviewPath: `src/content/docs/components/${slug}.md`,
        overviewExists: false,
        demoPath: `src/components/docs/demos/${slug}-demo.vue`,
        demoExists: await fileExists(resolve(root, `src/components/docs/demos/${slug}-demo.vue`)),
        guidancePath: `src/pages/docs/demos/_docs/${slug}.html`,
        guidanceExists: await fileExists(resolve(root, `src/pages/docs/demos/_docs/${slug}.html`))
      })
    }
  }

  // Sort and write index
  indexItems.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
  const indexPath = resolve(outDir, 'index.json')
  await writeFile(indexPath, JSON.stringify(indexItems, null, 2), 'utf8')

  const manifestPath = resolve(outDir, 'overview-manifest.json')
  const manifestPayload = {
    generatedAt: new Date().toISOString(),
    components: manifestItems
  }
  await writeFile(manifestPath, JSON.stringify(manifestPayload, null, 2), 'utf8')

  await pruneStaleFiles(outDir, generatedFiles)

  if (process.env.NODE_ENV !== 'production') {
    const missing = manifestItems.filter(item => !item.docsJsonExists || !item.overviewExists || !item.demoExists || !item.guidanceExists)
    if (missing.length > 0) {
      console.warn('[docs:components] Missing assets detected:', missing.map(item => item.componentId).join(', '))
    }
  }

  console.log(`[docs:components] Generated ${indexItems.length} entries → ${outDir}`)

  if (historyEntries.length > 0) {
    await appendPromptHistory(historyPath, promptMeta, promptRunId, historyEntries)
  }
}

run().catch(err => {
  console.error('[docs:components] Unhandled error:', err)
  process.exit(1)
})

async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    return stats.isFile()
  } catch {
    return false
  }
}

async function pruneStaleFiles(outDir: string, keep: Set<string>) {
  const reserved = new Set(['index.json', 'overview-manifest.json'])
  try {
    const entries = await readdir(outDir)
    const stale = entries.filter(entry => entry.endsWith('.json') && !reserved.has(entry) && !keep.has(entry))
    await Promise.all(stale.map(entry => unlink(resolve(outDir, entry))))
  } catch (error) {
    console.warn('[docs:components] Failed to prune stale files:', error)
  }
}

function toSlug(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

interface PromptMetadata {
  promptId: string
  version: string
  updatedAt?: string
  content: string
}

async function loadPromptMetadata(promptPath: string): Promise<PromptMetadata> {
  const raw = await readFile(promptPath, 'utf8')
  const match = raw.match(/^---\s*([\s\S]+?)\s*---\s*([\s\S]*)$/)
  if (!match) {
    throw new Error(`Prompt frontmatter missing in ${promptPath}`)
  }

  const [, frontmatter, content] = match
  const promptId = extractFrontmatterValue(frontmatter, 'promptId') || 'component-docs'
  const version = extractFrontmatterValue(frontmatter, 'version') || '0.0.0'
  const updatedAt = extractFrontmatterValue(frontmatter, 'updatedAt')

  return {
    promptId,
    version,
    updatedAt,
    content: content.trim()
  }
}

function extractFrontmatterValue(source: string, key: string): string | undefined {
  const regex = new RegExp(`^${key}:\\s*([^\\n]+)`, 'm')
  const match = source.match(regex)
  if (match) {
    return match[1]?.trim().replace(/^['"]|['"]$/g, '')
  }
  return undefined
}

function hashComponentData(meta: unknown): string {
  return createHash('sha256').update(JSON.stringify(meta)).digest('hex')
}

interface BuildComponentDocOptions {
  componentName: string
  slug: string
  meta: ComponentDoc
  prompt: PromptMetadata
  promptRunId: string
  dataHash: string
  legacyComponentsDir: string
  demoRelPath: string
}

function buildComponentDoc(options: BuildComponentDocOptions): string {
  const {
    componentName,
    slug,
    meta,
    prompt,
    promptRunId,
    dataHash,
    legacyComponentsDir,
    demoRelPath
  } = options

  const lastPromptRun = new Date().toISOString()
  const demoComponent = demoRelPath
  const legacyFile = resolveLegacySource(legacyComponentsDir, slug)
  const description = meta.description || `Documentation scaffold for ${meta.displayName}`

  const frontmatter = [
    '---',
    `title: ${escapeFrontmatter(meta.displayName || componentName, false)}`,
    `description: ${escapeFrontmatter(description, true)}`,
    'status: draft',
    `promptId: ${prompt.promptId}`,
    `promptVersion: ${prompt.version}`,
    `promptRunId: ${promptRunId}`,
    `lastPromptRun: ${lastPromptRun}`,
    'componentVersion: 0.0.0',
    `componentId: ${componentName}`,
    `demoComponent: ${demoComponent}`,
    legacyFile ? `legacySource: ${legacyFile}` : 'legacySource: null',
    `dataHash: ${dataHash}`,
    '---',
    ''
  ].join('\n')

  return [
    frontmatter,
    '## TL;DR',
    '- TODO: Summarize key actions once prompt is executed.',
    '',
    '## Overview',
    meta.description ? meta.description : '- TODO: Provide overview narrative.',
    '',
    '## When to use',
    '- TODO: Capture recommended scenarios.',
    '',
    '## When not to use',
    '- TODO: Capture anti-patterns.',
    '',
    '## Anatomy',
    '- TODO: Describe structural regions and layout tokens.',
    '',
    '## Variants',
    '- TODO: Document variants once defined in component metadata.',
    '',
    '## States',
    formatList(meta.tags?.standards ? [`Standard compliance: ${meta.tags.standards}`] : []),
    '',
    buildPropsSection(meta.props),
    '',
    '## Accessibility',
    '- TODO: Record keyboard interactions, ARIA attributes, and announcements.',
    '',
    '## Content guidance',
    '- TODO: Provide tone, copy, and localization guidance.',
    '',
    '## Implementation notes',
    formatImplementationNotes(meta, componentName),
    '',
    '## Demo',
    `- Demo component reference: \`${demoComponent}\``,
    '',
    '## Cross-links',
    '- TODO: List related components, patterns, or guidelines.',
    '',
    '## Validation checklist',
    '- TODO: List automated commands and manual QA steps.',
    '',
    '## Changelog',
    `- ${new Date().toISOString()}: Generated scaffold via \`${prompt.promptId}\` v${prompt.version}.`
  ].join('\n')
}

function escapeFrontmatter(value: string, forceQuotes = false): string {
  if (!value) return ''
  const compact = value.replace(/\s+/g, ' ').trim()
  if (forceQuotes || /[:#?{}\[\],&*]|^-/.test(compact)) {
    return `"${compact.replace(/"/g, '\\"')}"`
  }
  return compact
}

function resolveLegacySource(baseDir: string, slug: string): string | null {
  const candidate = resolve(baseDir, `${slug}.md`)
  if (!existsSync(candidate)) {
    return null
  }
  return relativeFromContent(candidate)
}

function relativeFromContent(absPath: string): string | null {
  if (!absPath) return null
  const normalized = absPath.replace(/\\/g, '/')
  const idx = normalized.indexOf('_process/')
  if (idx === -1) {
    return null
  }
  return `../../../../${normalized.slice(idx)}`
}

function buildPropsSection(props: PropDoc[] = []) {
  if (!props.length) {
    return [
      '## API',
      '| Name | Type | Default | Description | Required |',
      '|------|------|---------|-------------|----------|',
      '| _TBD_ | `unknown` | `-` | Populate after running prompts. | No |'
    ].join('\n')
  }

  const rows = props.map(prop => `| \`${prop.name}\` | \`${prop.type || 'unknown'}\` | \`${prop.defaultValue || '-'}\` | ${prop.description || '_Add description_'} | ${prop.required ? 'Yes' : 'No'} |`)
  return [
    '## API',
    '| Name | Type | Default | Description | Required |',
    '|------|------|---------|-------------|----------|',
    ...rows
  ].join('\n')
}

function formatImplementationNotes(meta: ComponentDoc, componentName: string): string {
  const tagsInfo = []
  if (meta.tags?.component) {
    tagsInfo.push(`Primary tag: \`${meta.tags.component}\``)
  }
  if (meta.tags?.category) {
    tagsInfo.push(`Category: \`${meta.tags.category}\``)
  }
  const importPath = findComponentImportPath(componentName)
  const notes = [
    importPath ? `- Component source: \`${importPath}\`` : '- TODO: Link to component source.',
    ...tagsInfo.map(info => `- ${info}`),
    '- TODO: Document shared composables or utilities.'
  ]
  return notes.join('\n')
}

function findComponentImportPath(componentName: string): string | null {
  try {
    const designSystemRoot = resolve(process.cwd(), 'src/components/ds')
    const entries = getDesignSystemComponentEntries()
    const match = entries.find(entry => entry.name === componentName)
    if (!match) {
      return null
    }
    return `src/components/ds/${match.relativePath}`
  } catch {
    return null
  }
}

function updateExistingDoc(
  source: string,
  options: {
    prompt: PromptMetadata
    promptRunId: string
    dataHash: string
    props: PropDoc[]
    componentName: string
    demoRelPath: string
  }
): string {
  const { prompt, promptRunId, dataHash, props, componentName, demoRelPath } = options
  let output = source

  output = replaceSection(output, 'API', buildPropsSection(props))

  output = upsertFrontmatter(output, {
    promptId: prompt.promptId,
    promptVersion: prompt.version,
    promptRunId,
    lastPromptRun: new Date().toISOString(),
    dataHash,
    componentId: componentName,
    demoComponent: demoRelPath
  })

  return output
}

function replaceSection(doc: string, heading: string, replacement: string): string {
  const headingRegex = new RegExp(`^##\\s+${escapeRegExp(heading)}\s*$`, 'm')
  const match = headingRegex.exec(doc)
  if (!match) {
    return `${doc.trim()}\n\n${replacement}\n`
  }

  const startIndex = match.index
  const afterHeadingIndex = startIndex + match[0].length
  const rest = doc.slice(afterHeadingIndex)
  const nextHeadingRegex = /^##\s+/m
  const nextMatch = nextHeadingRegex.exec(rest)
  const endIndex = nextMatch ? afterHeadingIndex + nextMatch.index : doc.length

  const before = doc.slice(0, startIndex)
  const after = doc.slice(endIndex)
  const separator = before.endsWith('\n') ? '' : '\n'

  return `${before}${separator}${replacement}\n${after.startsWith('\n') ? after.slice(1) : after}`
}

function upsertFrontmatter(doc: string, fields: Record<string, string>): string {
  const match = doc.match(/^---[\s\S]*?---/)
  const normalized = Object.entries(fields).map(([key, value]) => [key, escapeFrontmatter(value, false)] as const)

  if (!match) {
    const block = ['---', ...normalized.map(([key, value]) => `${key}: ${value}`), '---', ''].join('\n')
    return `${block}${doc}`
  }

  const frontmatter = match[0]
  const lines = frontmatter.split(/\r?\n/).slice(1, -1)
  const map = new Map<string, string>()

  for (const line of lines) {
    const index = line.indexOf(':')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    map.set(key, value)
  }

  for (const [key, value] of normalized) {
    map.set(key, value)
  }

  const next = ['---', ...Array.from(map.entries()).map(([key, value]) => `${key}: ${value}`), '---'].join('\n')
  return doc.replace(frontmatter, next)
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function appendPromptHistory(
  historyPath: string,
  prompt: PromptMetadata,
  promptRunId: string,
  entries: Array<{ componentId: string, slug: string, docPath: string, dataHash: string }>
) {
  await mkdir(dirname(historyPath), { recursive: true })

  let existing = ''
  try {
    existing = await readFile(historyPath, 'utf8')
  } catch {
    existing = '# Prompt History\n\n'
  }

  const timestamp = new Date().toISOString()
  const header = `## ${timestamp} · ${prompt.promptId} v${prompt.version}`
  const lines = entries.map(item => `- ${item.componentId} (${item.slug}) → \`${item.docPath}\` · dataHash: \`${item.dataHash.slice(0, 12)}\``)

  const payload = `${header}\n- promptRunId: \`${promptRunId}\`\n${lines.join('\n')}\n\n`

  await writeFile(historyPath, existing + payload, 'utf8')
}

function formatList(items: string[]): string {
  if (!items.length) return '- TODO: Document states and their behaviors.'
  return items.map(item => `- ${item}`).join('\n')
}

function relative(path: string): string {
  return path.replace(process.cwd(), '').replace(/^\/+/, '')
}
