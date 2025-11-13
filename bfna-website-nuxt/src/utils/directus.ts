/**
 * Directus Client Utility
 * 
 * Provides a configured Directus SDK client for querying Directus API.
 * Includes error handling and fallback utilities.
 */

import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from '~/types/directus'

// Initialize Directus client
export const directus = createDirectus<Schema>(
  process.env.DIRECTUS_URL || ''
)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN || ''))

/**
 * Error handling utility with fallback to static JSON
 * 
 * @param directusQuery - Function that returns a Promise from Directus API
 * @param fallbackPath - Path to static JSON fallback file (e.g., '~/content/data/products.json')
 * @param collectionName - Name of collection for error logging
 * @returns Data from Directus or fallback JSON
 */
export async function fetchWithFallback<T>(
  directusQuery: () => Promise<T>,
  fallbackPath: string,
  collectionName?: string
): Promise<T> {
  try {
    return await directusQuery()
  } catch (error) {
    const collection = collectionName || 'collection'
    console.error(`[Directus] API failed for ${collection}, using fallback:`, error)
    
    try {
      const fallback = await import(fallbackPath).then((m) => m.default)
      return fallback || ([] as T)
    } catch (fallbackError) {
      console.error(`[Directus] Fallback failed for ${collection}:`, fallbackError)
      return [] as T
    }
  }
}

/**
 * Runtime cache entry interface
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Runtime cache store (using Nuxt useState for SSR compatibility)
 */
const cache = useState<Record<string, CacheEntry<any>>>('directus-cache', () => ({}))

/**
 * Get cached data if still valid
 * 
 * @param key - Cache key
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns Cached data or null if expired/missing
 */
export function getCachedData<T>(key: string, ttl: number = 5 * 60 * 1000): T | null {
  const entry = cache.value[key]
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > ttl) {
    delete cache.value[key]
    return null
  }
  
  return entry.data as T
}

/**
 * Set cached data with TTL
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function setCachedData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.value[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  }
}

/**
 * Test Directus connection and authentication
 * 
 * @returns Promise that resolves if connection is successful, rejects on error
 */
export async function testDirectusConnection(): Promise<void> {
  try {
    // Try to fetch server info (lightweight endpoint)
    await directus.request<{ data: { project: { project_name: string } } }>(
      '/server/info',
      { method: 'GET' }
    )
  } catch (error) {
    throw new Error(`Directus connection test failed: ${error}`)
  }
}

