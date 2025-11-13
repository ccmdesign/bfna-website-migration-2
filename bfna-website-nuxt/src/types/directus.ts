/**
 * Directus TypeScript Schema Definitions
 * 
 * These types match the Directus collection schemas exactly to ensure
 * type safety when querying Directus API.
 */

// Common types
export interface Image {
  url: string
  title?: string
  width?: number
  height?: number
}

export interface Button {
  url: string
  label: string
  type?: string
}

export interface BreadcrumbItem {
  link: string
  title: string
}

export interface Breadcrumbs {
  currentPage: string
  items: BreadcrumbItem[]
}

export interface Author {
  name: string
  email?: string
  job_title?: string
}

export interface Authors {
  all?: string
  external?: string[]
  collab?: string[]
  internal?: Author[]
}

export interface OriginalPublication {
  publish_date?: string
  url?: string
}

export interface TeamMember {
  name: string
  job?: string
  job_title?: string
  email?: string
  bio?: string
  image?: string
}

export interface TeamSection {
  heading?: string
  subheading?: string
  team?: TeamMember[]
}

// Product
export interface Product {
  id: string
  title: string
  type: 'report' | 'website' | 'video'
  subheading?: string
  description?: string
  image?: Image
  hasVideo?: boolean
  buttons?: Button[]
  theme?: 'politics-society' | 'democracy' | 'digital-world' | 'future-leadership' | 'default'
  permalink?: string
  workstream?: string
  og_description?: string
  breadcrumbs?: Breadcrumbs
  team_section?: TeamSection
  createdAt?: string
  updatedAt?: string
}

// Publication
export interface Publication {
  id: string
  brow?: string
  theme?: string
  heading: string
  subheading?: string
  excerpt?: string
  excerpt_from_contentful?: boolean
  by_line?: string
  content?: string
  authors?: Authors
  original_publication?: OriginalPublication
  button?: Button
  download_media?: string
  workstream?: string
  og_description?: string
  breadcrumbs?: Breadcrumbs
  default_published?: string
  order_by?: string
  createdAt?: string
  updatedAt?: string
}

export interface PublicationUpdate {
  id: string
  publication_id: string
}

export interface PublicationHomepageUpdate {
  id: string
  publication_id: string
}

// Video
export interface Video {
  id: string
  brow?: string
  theme?: string
  video?: {
    url: string
    thumbnail?: string
  }
  heading: string
  content?: string
  button?: Button
  by_line?: string
  authors?: Authors
  workstream?: string
  og_description?: string
  breadcrumbs?: Breadcrumbs
  default_published?: string
  order_by?: string
  createdAt?: string
  updatedAt?: string
}

export interface VideoUpdate {
  id: string
  video_id: string
}

export interface VideoHomepageUpdate {
  id: string
  video_id: string
}

// Infographic
export interface Infographic {
  id: string
  brow?: string
  theme?: string
  image?: Image
  infographic?: {
    url: string
    title?: string
  }
  content?: string
  original_publication?: OriginalPublication
  by_line?: string
  authors?: Authors
  heading: string
  subheading?: string
  button?: Button
  workstream?: string
  og_description?: string
  breadcrumbs?: Breadcrumbs
  createdAt?: string
  updatedAt?: string
}

export interface InfographicHomepageUpdate {
  id: string
  infographic_id: string
}

// Podcast
export interface Podcast {
  id: string
  brow?: string
  theme?: string
  type?: string
  heading: string
  excerpt?: string
  image?: Image
  button?: Button
  createdAt?: string
  updatedAt?: string
}

export interface PodcastHomepageUpdate {
  id: string
  podcast_id: string
}

// News
export interface News {
  id: string
  heading: string
  excerpt?: string
  image?: Image
  url?: string
  buttonLabel?: string
  type?: string
  createdAt?: string
  updatedAt?: string
}

// Person
export interface Person {
  id: string
  name: string
  job_title?: string
  job?: string
  email?: string
  bio?: string
  image?: string
  linkedin?: string
  twitter?: string
  is_board_member?: boolean
  createdAt?: string
  updatedAt?: string
}

// People Config (Singleton)
export interface PeopleConfig {
  id: number
  heading?: string
  subheading?: string
  theme?: string
  image?: Image
}

// Workstream
export interface Workstream {
  id: string
  slug: string
  heading: string
  description?: string
  theme?: string
  button?: Button
  image?: Image
  products_list?: Product[]
  updates_list?: any[]
  navigation_order?: number
  createdAt?: string
  updatedAt?: string
}

// Announcement (Singleton)
export interface Announcement {
  id: number
  workstream?: string
  message?: string[]
  url?: string
}

// Directus Schema Interface
export interface Schema {
  products: Product[]
  publications: Publication[]
  publication_updates: PublicationUpdate[]
  publication_homepage_updates: PublicationHomepageUpdate[]
  videos: Video[]
  video_updates: VideoUpdate[]
  video_homepage_updates: VideoHomepageUpdate[]
  infographics: Infographic[]
  infographic_homepage_updates: InfographicHomepageUpdate[]
  podcasts: Podcast[]
  podcast_homepage_updates: PodcastHomepageUpdate[]
  news: News[]
  people: Person[]
  people_config: PeopleConfig
  workstreams: Workstream[]
  announcements: Announcement
}

