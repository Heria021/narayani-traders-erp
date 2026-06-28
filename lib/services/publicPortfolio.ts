import type { SupabaseClient } from '@supabase/supabase-js'

export interface PublicPortfolioProject {
  id: string
  displayIndex: number
  slug: string
  image: string
  title: string
  subtitle: string
  description: string
  category: string
  location: string
  year: string
  area: string
}

const FALLBACK_PROJECT_IMAGE = '/website_stock_images/image.png'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  interior: 'Interior',
  visualization_only: 'Visualization',
  renovation: 'Renovation',
  other: 'Other',
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function formatProjectType(type: string | null | undefined) {
  if (!type) return 'Architecture'
  return PROJECT_TYPE_LABELS[type] ?? toTitleCase(type)
}

function compactLocation(city: string | null | undefined, state: string | null | undefined) {
  return [city, state].filter(Boolean).join(', ') || 'Location TBA'
}

function truncateSummary(value: string, maxLength = 96) {
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

export async function fetchPublicPortfolioProjects(supabase: SupabaseClient): Promise<PublicPortfolioProject[]> {
  const { data, error } = await supabase
    .from('arch_public_listings')
    .select(`
      id,
      slug,
      public_title,
      public_description,
      is_featured,
      sort_order,
      created_at,
      cover_media:arch_project_media(file_url),
      project:arch_projects(
        id,
        title,
        type,
        city,
        state,
        area_sqft,
        year_completed,
        description
      ),
      gallery:arch_public_listing_media(
        sort_order,
        media:arch_project_media(file_url)
      )
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? [])
    .filter((row: any) => row.project)
    .map((row: any, index) => {
      const project = row.project
      const gallery = [...(row.gallery ?? [])].sort((a: any, b: any) => {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })
      const description = row.public_description || project.description || ''
      const coverImage = row.cover_media?.file_url || gallery[0]?.media?.file_url || FALLBACK_PROJECT_IMAGE

      return {
        id: row.id,
        displayIndex: index + 1,
        slug: row.slug,
        image: coverImage,
        title: row.public_title || project.title,
        subtitle: truncateSummary(description || project.title),
        description,
        category: formatProjectType(project.type),
        location: compactLocation(project.city, project.state),
        year: project.year_completed ? String(project.year_completed) : 'Year TBA',
        area: project.area_sqft ? `${Number(project.area_sqft).toLocaleString()} sqft` : 'Area TBA',
      }
    })
}
