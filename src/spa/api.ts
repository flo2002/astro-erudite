import type { SpaSiteData } from '@/spa/types'

let cachedSiteData: SpaSiteData | null = null

export async function getSiteData(): Promise<SpaSiteData> {
  if (cachedSiteData) {
    return cachedSiteData
  }

  const response = await fetch('/spa-data/site.json')
  if (!response.ok) {
    throw new Error(`Failed to load SPA data: ${response.status}`)
  }

  cachedSiteData = (await response.json()) as SpaSiteData
  return cachedSiteData
}
