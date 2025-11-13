const TOKEN_MAP = {
  '${PATH_DS_DEMOS}': {
    import: '~/pages/docs/demos',
    public: '/docs/demos'
  },
  '${PATH_COMPONENT_DOCS_OUTPUT}': {
    import: '~/public/component-docs',
    public: '/component-docs'
  },
  '${PATH_DS_COMPONENTS}': {
    import: '~/components/ds'
  },
  '${PATH_DOCS_COMPONENT_OVERVIEWS}': {
    import: '~/content/docs/components',
    public: '/docs/components'
  }
} as const

export type ResolveMode = 'import' | 'public'

type TokenKey = keyof typeof TOKEN_MAP

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/')
}

function collapseDuplicateSlashes(value: string): string {
  return value.replace(/\/\/+/g, '/')
}

function ensureLeadingSlash(value: string): string {
  if (!value.startsWith('/')) {
    return `/${value.replace(/^\/+/, '')}`
  }
  return value
}

function ensureImportPrefix(value: string): string {
  if (value.startsWith('~/') || value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) {
    return value
  }
  return `~/${value.replace(/^\/+/, '')}`
}

export function resolvePathTokens(input: string, mode: ResolveMode): string {
  if (!input) return input

  let result = input

  for (const token of Object.keys(TOKEN_MAP) as TokenKey[]) {
    const replacement = TOKEN_MAP[token][mode]
    if (replacement) {
      result = result.split(token).join(replacement)
    }
  }

  result = collapseDuplicateSlashes(normalizeSlashes(result))

  if (mode === 'public') {
    result = ensureLeadingSlash(result)
  }

  if (mode === 'import') {
    result = ensureImportPrefix(result)
  }

  return result
}

export function hasPathToken(value: string): boolean {
  if (!value) return false
  return (Object.keys(TOKEN_MAP) as TokenKey[]).some(token => value.includes(token))
}

