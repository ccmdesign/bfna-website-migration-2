import chokidar from 'chokidar'
import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractDocs, getDocsFragmentPath } from './docs-extract'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const componentsGlob = resolve(projectRoot, 'src', 'components', 'ds', '**', '*.vue')

const pending = new Set<string>()
let timer: NodeJS.Timeout | null = null

async function start() {
  console.log('[docs-watch] Performing initial sync')
  await extractDocs({ all: true })
  console.log('[docs-watch] Ready')

  const watcher = chokidar.watch(componentsGlob, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50
    }
  })

  watcher.on('add', scheduleSync)
  watcher.on('change', scheduleSync)
  watcher.on('unlink', handleRemoval)

  process.on('SIGINT', () => {
    watcher.close().finally(() => process.exit(0))
  })
}

function scheduleSync(filePath: string) {
  pending.add(filePath)
  if (timer) return
  timer = setTimeout(flushQueue, 200)
}

async function flushQueue() {
  const files = Array.from(pending)
  pending.clear()
  timer = null
  if (files.length === 0) return
  await extractDocs({ files, quiet: true })
}

async function handleRemoval(filePath: string) {
  pending.delete(filePath)
  const fragmentPath = getDocsFragmentPath(filePath)
  try {
    await fs.rm(fragmentPath)
    console.log(`[docs-watch] Removed ${fragmentPath}`)
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.error(`[docs-watch] Failed to remove ${fragmentPath}`)
      console.error(error)
    }
  }
}

start().catch(error => {
  console.error('[docs-watch] Unexpected error')
  console.error(error)
  process.exitCode = 1
})

