import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface DesignSystemComponentFile {
  name: string
  absolutePath: string
  relativePath: string
}

const designSystemRoot = resolve(process.cwd(), 'src/components/ds')

let cachedEntries: DesignSystemComponentFile[] | null = null

function collectEntries(dir: string, relativeDir = ''): DesignSystemComponentFile[] {
  let entries: DesignSystemComponentFile[] = []

  let dirEntries

  try {
    dirEntries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return entries
  }

  for (const entry of dirEntries) {
    if (entry.isDirectory()) {
      const childRelativeDir = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
      entries = entries.concat(collectEntries(join(dir, entry.name), childRelativeDir))
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
      entries.push({
        name: entry.name.replace(/\.vue$/, ''),
        absolutePath: join(dir, entry.name),
        relativePath
      })
    }
  }

  return entries
}

export function getDesignSystemComponentEntries(options?: { refresh?: boolean }): DesignSystemComponentFile[] {
  if (!cachedEntries || options?.refresh) {
    cachedEntries = collectEntries(designSystemRoot)
  }

  return cachedEntries
}

function normalizeName(name: string): string {
  return name
    .replace(/\.vue$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

export function findDesignSystemComponent(componentName: string): DesignSystemComponentFile | null {
  const entries = getDesignSystemComponentEntries()

  if (!entries.length) {
    return null
  }

  const normalizedTarget = normalizeName(componentName)

  for (const entry of entries) {
    if (entry.name === componentName) {
      return entry
    }

    if (normalizeName(entry.name) === normalizedTarget) {
      return entry
    }
  }

  return null
}

export function invalidateDesignSystemComponentCache() {
  cachedEntries = null
}

export const DESIGN_SYSTEM_COMPONENT_ROOT = designSystemRoot


