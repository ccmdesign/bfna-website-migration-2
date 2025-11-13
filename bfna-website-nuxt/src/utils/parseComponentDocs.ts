import { parse } from 'vue-docgen-api'
import { findDesignSystemComponent } from './designSystemRegistry'

export interface ComponentDoc {
  displayName: string
  description: string
  props: PropDoc[]
  examples: ExampleDoc[]
  codeSnippets: CodeSnippetDoc[]
  tags: {
    component?: string
    category?: string
    standards?: string
  }
}

export interface PropDoc {
  name: string
  description: string
  type: string
  required: boolean
  defaultValue?: string
}

export interface ExampleDoc {
  title: string
  description?: string
  code: string
}

export interface CodeSnippetDoc {
  id: string
  label: string
  description?: string
  code: string
  language?: string
}

// Cache for development mode
const cache = new Map<string, ComponentDoc>()

export async function parseComponentDocs(componentName: string): Promise<ComponentDoc> {
  if (cache.has(componentName)) {
    return cache.get(componentName)!
  }

  try {
    const componentFile = findDesignSystemComponent(componentName)

    if (!componentFile) {
      throw new Error(`Component file not found for: ${componentName}`)
    }

    const cacheKey = componentFile.name

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }

    const parsed = await parse(componentFile.absolutePath)

    // Extract custom tags
    const customTags = extractCustomTags(parsed.tags || {})
    
    // Transform props
    const props = parsed.props?.map(prop => ({
      name: prop.name,
      description: prop.description || '',
      type: formatType(prop.type),
      required: prop.required || false,
      defaultValue: prop.defaultValue?.value
    })) || []

    // Transform examples
    const examples = customTags.examples || []

    // Build component doc
    const componentDoc: ComponentDoc = {
      displayName: parsed.displayName || componentFile.name,
      description: parsed.description || '',
      props,
      examples,
      codeSnippets: customTags.codeSnippets,
      tags: {
        component: customTags.component,
        category: customTags.category,
        standards: customTags.standards
      }
    }

    // Cache the result
    cache.set(cacheKey, componentDoc)
    if (componentName !== cacheKey) {
      cache.set(componentName, componentDoc)
    }
    
    return componentDoc
  } catch (error) {
    console.error(`Failed to parse component ${componentName}:`, error)
    
    // Return fallback data
    return {
      displayName: componentName,
      description: `Component documentation for ${componentName}`,
      props: [],
      examples: [],
      codeSnippets: [],
      tags: {
        component: componentName,
        category: 'ds-component',
        standards: 'all-10'
      }
    }
  }
}

function extractCustomTags(tags: Record<string, any[]>): {
  component?: string
  category?: string
  standards?: string
  examples: ExampleDoc[]
  codeSnippets: CodeSnippetDoc[]
} {
  const result: {
    component?: string
    category?: string
    standards?: string
    examples: ExampleDoc[]
    codeSnippets: CodeSnippetDoc[]
  } = {
    examples: [],
    codeSnippets: []
  }

  // Extract standard tags
  if (tags.component) {
    result.component = tags.component[0]?.description
  }
  
  if (tags.category) {
    result.category = tags.category[0]?.description
  }
  
  if (tags.standards) {
    result.standards = tags.standards[0]?.description
  }

  // Extract examples
  if (tags.example) {
    result.examples = tags.example.map((example: any, index: number) => ({
      title: example.title || `Example ${index + 1}`,
      description: example.description,
      code: example.code || example.content || example.description || ''
    }))
  }

  const usageTags = tags.usage || []
  const snippetTags = tags.snippet || []

  if (usageTags.length > 0) {
    result.codeSnippets.push(...usageTags.map((item: any, index: number) => mapToCodeSnippet(item, `usage-${index + 1}`, index)))
  }

  if (snippetTags.length > 0) {
    result.codeSnippets.push(...snippetTags.map((item: any, index: number) => mapToCodeSnippet(item, `snippet-${index + 1}`, index)))
  }

  result.codeSnippets = result.codeSnippets.filter(snippet => snippet.code)

  return result
}

function mapToCodeSnippet(raw: any, fallbackId: string, index: number): CodeSnippetDoc {
  const label = raw?.title || raw?.name || `Snippet ${index + 1}`
  const baseId = slugify(label)
  const id = baseId || fallbackId
  const description = raw?.description || raw?.content || undefined
  const code = (raw?.code || raw?.content || raw?.description || '').toString().trim()
  const language = raw?.lang || raw?.language || 'vue'

  return {
    id,
    label,
    description,
    code,
    language
  }
}

function slugify(value: string | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatType(type: any): string {
  if (!type) return 'unknown'
  
  if (type.name) {
    if (type.name === 'Array') {
      return `${type.name}<${type.elements?.map((e: any) => e.name).join(' | ') || 'any'}>`
    }
    
    if (type.name === 'union') {
      return type.elements?.map((e: any) => e.name).join(' | ') || 'unknown'
    }
    
    return type.name
  }
  
  return 'unknown'
}
