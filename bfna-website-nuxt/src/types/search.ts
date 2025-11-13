export interface SearchIndexItem {
  brow: string
  theme: string | null
  excerpt: string
  subheading: string | null
  by_line: string | null
  heading: string
  button_url: string
  button_label: string | null
  text: string
  url: string
}

export interface SearchResult {
  url: string
  heading: string
  subheading: string | null
  excerpt: string | null
  theme: string | null
}

export interface SearchIndex {
  search: SearchIndexItem[]
}

