import { parseComponentDocs } from '../../../utils/parseComponentDocs'
import { getDesignSystemComponentEntries } from '../../../utils/designSystemRegistry'

export default defineEventHandler(async () => {
  const components = getDesignSystemComponentEntries()

  if (!components.length) {
    return []
  }

  const items = await Promise.all(components.map(async ({ name }) => {
    try {
      const meta = await parseComponentDocs(name)
      return {
        name,
        displayName: meta.displayName || name,
        description: meta.description || ''
      }
    } catch {
      return { name, displayName: name, description: '' }
    }
  }))

  return items.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
})


