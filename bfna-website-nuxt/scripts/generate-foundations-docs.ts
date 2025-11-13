import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'

interface PromptMetadata {
  promptId: string
  version: string
  updatedAt?: string
}

interface TokenRecord {
  name: string
  value: string
  file: string
}

interface LayerRecord {
  layer: string
  files: string[]
}

async function run() {
  const root = process.cwd()
  const outputDir = resolve(root, 'scripts/output')
  const tokensOutputPath = resolve(outputDir, 'tokens.json')
  const layersOutputPath = resolve(outputDir, 'layers.json')
  const promptPath = resolve(root, 'src/content/docs/prompts/foundations.prompt.md')
  const historyPath = resolve(root, 'src/content/docs/prompts/history.md')
  const guidelinesDir = resolve(root, 'src/content/docs/guidelines')

  await mkdir(outputDir, { recursive: true })
  await mkdir(guidelinesDir, { recursive: true })

  const prompt = await loadPromptMetadata(promptPath)
  const tokens = await collectTokens(resolve(root, 'src/public/css/tokens'))
  const layers = await collectLayers(resolve(root, 'src/public/css'))

  await writeFile(tokensOutputPath, JSON.stringify(tokens, null, 2), 'utf8')
  await writeFile(layersOutputPath, JSON.stringify(layers, null, 2), 'utf8')

  const promptRunId = `${prompt.promptId}-${Date.now()}`

  const tokensDocPath = resolve(guidelinesDir, 'tokens.md')
  const cubeCssDocPath = resolve(guidelinesDir, 'cube-css.md')
  const utilitiesDocPath = resolve(guidelinesDir, 'utilities.md')

  const tokensHash = hashData(tokens)
  const layersHash = hashData(layers)

  const now = new Date().toISOString()

  await writeFile(tokensDocPath, buildTokensDoc({
    prompt,
    promptRunId,
    lastPromptRun: now,
    dataHash: tokensHash,
    tokenRecords: tokens,
    dataSource: relativeFromContent(tokensOutputPath),
    legacySources: [
      '../../../../../_process/docs-deprecated/guidelines/tokens.md',
      '../../../../../_process/docs-deprecated/guidelines/tokens-governance.md'
    ]
  }), 'utf8')

  await writeFile(cubeCssDocPath, buildCubeCssDoc({
    prompt,
    promptRunId,
    lastPromptRun: now,
    dataHash: layersHash,
    layerRecords: layers,
    dataSource: relativeFromContent(layersOutputPath),
    legacySources: [
      '../../../../../_process/docs-deprecated/guidelines/cube-css.md',
      '../../../../../_process/docs-deprecated/guidelines/styling-cube-css.md'
    ]
  }), 'utf8')

  await writeFile(utilitiesDocPath, buildUtilitiesDoc({
    prompt,
    promptRunId,
    lastPromptRun: now,
    dataHash: layersHash,
    legacySources: [
      '../../../../../_process/docs-deprecated/guidelines/utilities.md'
    ]
  }), 'utf8')

  await appendPromptHistory(historyPath, prompt, promptRunId, [
    { title: 'tokens', path: relativeFromContent(tokensDocPath), dataHash: tokensHash },
    { title: 'cube-css', path: relativeFromContent(cubeCssDocPath), dataHash: layersHash },
    { title: 'utilities', path: relativeFromContent(utilitiesDocPath), dataHash: layersHash }
  ])

  console.log('[docs:foundations] Generated foundations scaffolding')
}

run().catch(error => {
  console.error('[docs:foundations] Unhandled error:', error)
  process.exit(1)
})

async function loadPromptMetadata(promptPath: string): Promise<PromptMetadata> {
  const raw = await readFile(promptPath, 'utf8')
  const match = raw.match(/^---\s*([\s\S]+?)\s*---/m)
  if (!match) {
    throw new Error(`Prompt frontmatter missing in ${promptPath}`)
  }
  const frontmatter = match[1]
  const promptId = extractFrontmatterValue(frontmatter, 'promptId') || 'foundations-docs'
  const version = extractFrontmatterValue(frontmatter, 'version') || '0.0.0'
  const updatedAt = extractFrontmatterValue(frontmatter, 'updatedAt')
  return { promptId, version, updatedAt }
}

function extractFrontmatterValue(source: string, key: string): string | undefined {
  const regex = new RegExp(`^${key}:\\s*([^\\n]+)`, 'm')
  const match = source.match(regex)
  if (match) {
    return match[1]?.trim().replace(/^['"]|['"]$/g, '')
  }
  return undefined
}

async function collectTokens(tokensDir: string): Promise<TokenRecord[]> {
  const results: TokenRecord[] = []
  if (!existsSync(tokensDir)) {
    return results
  }

  const entries = await readdir(tokensDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue
    const filePath = resolve(tokensDir, entry.name)
    const content = await readFile(filePath, 'utf8')
    const matches = content.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)
    for (const match of matches) {
      const [, name, value] = match
      results.push({
        name,
        value: value.trim(),
        file: relativeFromContent(filePath)
      })
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

async function collectLayers(cssDir: string): Promise<LayerRecord[]> {
  const layerMap = new Map<string, Set<string>>()
  if (!existsSync(cssDir)) {
    return []
  }
  const stack = [cssDir]

  while (stack.length) {
    const current = stack.pop()!
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = resolve(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(entryPath)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith('.css')) continue
      const content = await readFile(entryPath, 'utf8')
      const matches = content.matchAll(/@layer\s+([\w.-]+)/g)
      for (const match of matches) {
        const layerName = match[1]
        if (!layerMap.has(layerName)) {
          layerMap.set(layerName, new Set())
        }
        layerMap.get(layerName)!.add(relativeFromContent(entryPath))
      }
    }
  }

  return Array.from(layerMap.entries())
    .map(([layer, files]) => ({
      layer,
      files: Array.from(files).sort()
    }))
    .sort((a, b) => a.layer.localeCompare(b.layer))
}

function buildTokensDoc(options: {
  prompt: PromptMetadata
  promptRunId: string
  lastPromptRun: string
  dataHash: string
  tokenRecords: TokenRecord[]
  dataSource: string
  legacySources: string[]
}): string {
  const {
    prompt,
    promptRunId,
    lastPromptRun,
    dataHash,
    tokenRecords,
    dataSource,
    legacySources
  } = options

  const head = [
    '---',
    'title: Token Foundations',
    'description: Auto-generated summary of design tokens.',
    'status: draft',
    `promptId: ${prompt.promptId}`,
    `promptVersion: ${prompt.version}`,
    `promptRunId: ${promptRunId}`,
    `lastPromptRun: ${lastPromptRun}`,
    'tokenSet: tokens/all',
    `dataSource: ${dataSource}`,
    legacySources.length ? `legacySource:\n${legacySources.map(src => `  - ${src}`).join('\n')}` : 'legacySource: []',
    `dataHash: ${dataHash}`,
    '---',
    ''
  ].join('\n')

  const preview = tokenRecords.slice(0, 20).map(token => `| \`${token.name}\` | \`${token.value}\` | ${token.file} |`).join('\n') || '| _TBD_ | _TBD_ | _TBD_ |'

  return [
    head,
    '## Scope',
    '- Token data extracted from `src/public/css/tokens/*`.',
    '',
    '## Principles',
    '- TODO: Align with semantic token guidelines.',
    '',
    '## Token Map',
    '| Token | Value | Source |',
    '|-------|-------|--------|',
    preview,
    '',
    '_See JSON source for full token export._',
    '',
    '## Layer Breakdown',
    '- TODO: Describe how tokens participate in CUBE layers.',
    '',
    '## Usage Patterns',
    '- TODO: Provide examples of token application.',
    '',
    '## Authoring Checklist',
    '- TODO: Add validation checklist for token updates.',
    '',
    '## References',
    legacySources.map(src => `- ${src}`).join('\n') || '- TODO: Link references.'
  ].join('\n')
}

function buildCubeCssDoc(options: {
  prompt: PromptMetadata
  promptRunId: string
  lastPromptRun: string
  dataHash: string
  layerRecords: LayerRecord[]
  dataSource: string
  legacySources: string[]
}): string {
  const {
    prompt,
    promptRunId,
    lastPromptRun,
    dataHash,
    layerRecords,
    dataSource,
    legacySources
  } = options

  const head = [
    '---',
    'title: CUBE CSS Overview',
    'description: Snapshot of current CUBE CSS layers in the design system.',
    'status: draft',
    `promptId: ${prompt.promptId}`,
    `promptVersion: ${prompt.version}`,
    `promptRunId: ${promptRunId}`,
    `lastPromptRun: ${lastPromptRun}`,
    `dataSource: ${dataSource}`,
    legacySources.length ? `legacySource:\n${legacySources.map(src => `  - ${src}`).join('\n')}` : 'legacySource: []',
    `dataHash: ${dataHash}`,
    '---',
    ''
  ].join('\n')

  const table = layerRecords.length
    ? layerRecords.map(layer => `| \`${layer.layer}\` | ${layer.files.join('<br />')} |`).join('\n')
    : '| _TBD_ | _TBD_ |'

  return [
    head,
    '## TL;DR',
    '- TODO: Summarize the CUBE CSS approach.',
    '',
    '## Layer Responsibilities',
    '| Layer | Source |',
    '|-------|--------|',
    table,
    '',
    '## CSS Imports',
    '- TODO: Document import order and entry points.',
    '',
    '## Utilities Table',
    '- TODO: Merge with utilities reference once prompts run.',
    '',
    '## Checklist',
    '- TODO: Add verification steps for CSS changes.',
    '',
    '## Appendices',
    legacySources.map(src => `- ${src}`).join('\n') || '- TODO: Attach supporting references.'
  ].join('\n')
}

function buildUtilitiesDoc(options: {
  prompt: PromptMetadata
  promptRunId: string
  lastPromptRun: string
  dataHash: string
  legacySources: string[]
}): string {
  const {
    prompt,
    promptRunId,
    lastPromptRun,
    dataHash,
    legacySources
  } = options

  const head = [
    '---',
    'title: Utilities Reference',
    'description: Guidance for utility classes and extension patterns.',
    'status: draft',
    `promptId: ${prompt.promptId}`,
    `promptVersion: ${prompt.version}`,
    `promptRunId: ${promptRunId}`,
    `lastPromptRun: ${lastPromptRun}`,
    `dataHash: ${dataHash}`,
    legacySources.length ? `legacySource:\n${legacySources.map(src => `  - ${src}`).join('\n')}` : 'legacySource: []',
    '---',
    ''
  ].join('\n')

  return [
    head,
    '## Purpose',
    '- TODO: Summarize utility philosophy.',
    '',
    '## Utility Table',
    '| Class | Layer | Description | Responsive | Notes |',
    '|-------|-------|-------------|------------|-------|',
    '| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |',
    '',
    '## Best Practices',
    '- TODO: Capture best practices once prompts are executed.',
    '',
    '## Extension Process',
    '- TODO: Document extension workflow.',
    '',
    '## Checklist',
    '- TODO: Provide pre-merge validation steps.',
    '',
    '## References',
    legacySources.map(src => `- ${src}`).join('\n') || '- TODO: Link references.'
  ].join('\n')
}

function hashData(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

async function appendPromptHistory(
  historyPath: string,
  prompt: PromptMetadata,
  promptRunId: string,
  entries: Array<{ title: string, path: string, dataHash: string }>
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
  const lines = entries.map(item => `- ${item.title} → \`${item.path}\` · dataHash: \`${item.dataHash.slice(0, 12)}\``)

  const payload = `${header}\n- promptRunId: \`${promptRunId}\`\n${lines.join('\n')}\n\n`

  await writeFile(historyPath, existing + payload, 'utf8')
}

function relativeFromContent(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/')
  const index = normalized.indexOf('src/')
  if (index !== -1) {
    return normalized.slice(index)
  }
  const processIndex = normalized.indexOf('_process/')
  if (processIndex !== -1) {
    return normalized.slice(processIndex)
  }
  const scriptsIndex = normalized.indexOf('scripts/')
  if (scriptsIndex !== -1) {
    return normalized.slice(scriptsIndex)
  }
  return normalized
}
