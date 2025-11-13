import { dirname, resolve } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { getDesignSystemComponentEntries } from '../src/utils/designSystemRegistry'

interface PromptMetadata {
  promptId: string
  version: string
}

interface HistoryEntry {
  componentId: string
  demoPath: string
  metaPath: string
  dataHash: string
}

async function run() {
  const root = process.cwd()
  const promptPath = resolve(root, 'src/content/docs/prompts/component-demo.prompt.md')
  const demosDir = resolve(root, 'src/components/docs/demos')
  const historyPath = resolve(root, 'src/content/docs/prompts/history.md')

  await mkdir(demosDir, { recursive: true })

  const prompt = await loadPromptMetadata(promptPath)
  const promptRunId = `${prompt.promptId}-${Date.now()}`
  const components = getDesignSystemComponentEntries({ refresh: true })

  if (!components.length) {
    console.warn('[docs:demos] No design system components found')
    return
  }

  const historyEntries: HistoryEntry[] = []

  for (const component of components) {
    const slug = toSlug(component.name)
    const demoPath = resolve(demosDir, `${slug}-demo.vue`)
    const metaPath = resolve(demosDir, `${slug}-demo.meta.json`)
    const importPath = `~/components/ds/${component.relativePath.replace(/\\/g, '/')}`
    const now = new Date().toISOString()

    const demoContent = buildDemoSfc({
      componentName: component.name,
      importPath,
      prompt,
      promptRunId,
      lastPromptRun: now
    })

    const metadataContent = buildDemoMetaJson({
      componentName: component.name,
      slug,
      importPath,
      prompt,
      promptRunId,
      lastPromptRun: now
    })

    await mkdir(dirname(demoPath), { recursive: true })
    await writeFile(demoPath, demoContent, 'utf8')
    await writeFile(metaPath, JSON.stringify(metadataContent, null, 2), 'utf8')

    historyEntries.push({
      componentId: component.name,
      demoPath: relativeFromRoot(demoPath),
      metaPath: relativeFromRoot(metaPath),
      dataHash: hashPayload(metadataContent)
    })
  }

  if (historyEntries.length) {
    await appendPromptHistory(historyPath, prompt, promptRunId, historyEntries)
  }

  console.log(`[docs:demos] Generated ${historyEntries.length} demo scaffolds`)
}

run().catch(error => {
  console.error('[docs:demos] Unhandled error:', error)
  process.exit(1)
})

async function loadPromptMetadata(promptPath: string): Promise<PromptMetadata> {
  const raw = await readFile(promptPath, 'utf8')
  const match = raw.match(/^---\s*([\s\S]+?)\s*---/m)
  if (!match) {
    throw new Error(`Prompt frontmatter missing in ${promptPath}`)
  }
  const frontmatter = match[1]
  return {
    promptId: extractFrontmatterValue(frontmatter, 'promptId') || 'component-demo',
    version: extractFrontmatterValue(frontmatter, 'version') || '0.0.0'
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

function toSlug(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase()
}

function buildDemoSfc(options: {
  componentName: string
  importPath: string
  prompt: PromptMetadata
  promptRunId: string
  lastPromptRun: string
}): string {
  const {
    componentName,
    importPath,
    prompt,
    promptRunId,
    lastPromptRun
  } = options

  return [
    '<template>',
    '  <section class="docs-component-demo">',
    `    <${componentName}`,
    '      v-bind="demoState.variant.props"',
    '      v-on="demoState.events"',
    '    />',
    '  </section>',
    '</template>',
    '',
    '<script setup lang="ts">',
    `import ${componentName} from '${importPath}'`,
    '',
    `const promptMetadata = {`,
    `  promptId: '${prompt.promptId}',`,
    `  promptVersion: '${prompt.version}',`,
    `  promptRunId: '${promptRunId}',`,
    `  lastPromptRun: '${lastPromptRun}'`,
    `}`,
    '',
    'const demoState = {',
    '  variant: {',
    `    name: 'default',`,
    '    props: {},',
    '    tokens: [] as string[]',
    '  },',
    '  events: {} as Record<string, (...args: unknown[]) => void>',
    '}',
    '',
    'defineExpose({ promptMetadata })',
    '</script>',
    '',
    '<style scoped>',
    '.docs-component-demo {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 1.5rem;',
    '  padding: 1.5rem;',
    '}',
    '</style>',
    ''
  ].join('\n')
}

function buildDemoMetaJson(options: {
  componentName: string
  slug: string
  importPath: string
  prompt: PromptMetadata
  promptRunId: string
  lastPromptRun: string
}) {
  const {
    componentName,
    slug,
    importPath,
    prompt,
    promptRunId,
    lastPromptRun
  } = options

  return {
    component: componentName,
    slug,
    promptId: prompt.promptId,
    promptVersion: prompt.version,
    promptRunId,
    lastPromptRun,
    variants: [
      {
        name: 'default',
        props: {},
        tokens: []
      }
    ],
    states: ['focus-visible', 'disabled'],
    dependencies: [importPath]
  }
}

async function appendPromptHistory(
  historyPath: string,
  prompt: PromptMetadata,
  promptRunId: string,
  entries: HistoryEntry[]
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
  const detail = entries.map(entry => {
    return `- ${entry.componentId} → \`${entry.demoPath}\`, meta: \`${entry.metaPath}\` · dataHash: \`${entry.dataHash.slice(0, 12)}\``
  }).join('\n')

  const payload = `${header}\n- promptRunId: \`${promptRunId}\`\n${detail}\n\n`
  await writeFile(historyPath, existing + payload, 'utf8')
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function relativeFromRoot(absPath: string): string {
  return absPath.replace(process.cwd(), '').replace(/^\/+/, '').replace(/\\/g, '/')
}
