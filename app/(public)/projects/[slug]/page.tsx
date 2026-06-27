import { createClient } from "@/lib/supabase/server"
import ProjectDetailView, { ProjectDetails } from "./_components/project-detail-view"
import { notFound } from "next/navigation"

interface MockProject {
  slug: string
  image: string
  title: string
  description: string
  category: string
  location: string
  year: string
  area: string
  floors?: number
  configuration?: string
  testimonial?: string
  media: { file_url: string; caption: string }[]
}

const MOCK_PROJECTS: MockProject[] = [
  {
    slug: "glass-pavilion",
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "The Glass Pavilion",
    description: "Minimalist woodland retreat designed to merge with surrounding nature using floor-to-ceiling glass and exposed structures.\n\nThe project explores transparency and structural lightweightness. The concrete floor slab floats above the forest floor, supported by minimal piles, minimizing landscape disruption.\n\nEvery interior space communicates directly with the towering pine forests outside. Double glazed panels feature low-emissivity coatings to manage thermal efficiency, while horizontal roof overhangs shadow high-angle summer sun.",
    category: "Residential",
    location: "Portland, Oregon",
    year: "2025",
    area: "3,200 sqft",
    floors: 1,
    configuration: "1-Level Pavilion",
    testimonial: "Hariom Studio translated our dream of living in nature into an architectural masterpiece. The renders were so accurate, walking in felt like déjà vu.",
    media: [
      { file_url: "/website_stock_images/pexels-ahmetcotur-27626177.jpg", caption: "Brutalist structure details" },
      { file_url: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg", caption: "Site alignment overview" },
      { file_url: "/website_stock_images/pexels-ahmetcotur-31817155.jpg", caption: "Interior dining view" },
    ],
  },
  {
    slug: "vapor-residence",
    image: "/website_stock_images/pexels-ahmetcotur-27626177.jpg",
    title: "Vapor Residence",
    description: "Brutalist concrete dwelling softened by ambient recessed light wells, cascading gardens, and indoor-outdoor water pathways.\n\nThe concrete envelope features board-formed textures, contrasting with the smooth glass interfaces. High skylights cut deep into the concrete shell, casting animated shadows that follow the sun's trajectory throughout the day.\n\nA central reflecting pool acts as a thermal mass, cooling the breeze before it flows into the main living pavilion.",
    category: "Residential",
    location: "Kyoto, Japan",
    year: "2026",
    area: "5,400 sqft",
    floors: 2,
    configuration: "2-Level Villa",
    testimonial: "The composition of light and concrete created by the team is poetic. It represents Japanese minimalism merged with brutalist weight.",
    media: [
      { file_url: "/website_stock_images/pexels-aksinfo7-31387268.jpg", caption: "Exterior facade night lighting" },
      { file_url: "/website_stock_images/pexels-ahmetcotur-31817155.jpg", caption: "Bespoke living area" },
      { file_url: "/website_stock_images/pexels-ahmetcotur-27626174.jpg", caption: "Concrete cantilever details" },
    ],
  },
  {
    slug: "luminous-penthouse",
    image: "/website_stock_images/pexels-ahmetcotur-31817155.jpg",
    title: "Luminous Penthouse",
    description: "High-end urban interior design concept that centers around open spaces, white oak timbers, and double-height ceiling voids.\n\nDesigned for a private art collector, the penthouse balances open gallery layouts with domestic comfort. Structural columns are clad in micro-cement, and floors are finished in high-polish seamless white terrazzo.\n\nLighting is fully indirect, highlighting structural seams and textures.",
    category: "Interior",
    location: "New York, USA",
    year: "2024",
    area: "2,800 sqft",
    floors: 1,
    configuration: "1-Level Penthouse",
    testimonial: "They completely redesigned our space to be open, bright, and highly liveable while keeping a gallery-like focus.",
    media: [
      { file_url: "/website_stock_images/pexels-ahmetcotur-27626177.jpg", caption: "Terrace lounge outline" },
      { file_url: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg", caption: "Master bath layout" },
    ],
  },
  {
    slug: "desert-oasis-villa",
    image: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg",
    title: "Desert Oasis Villa",
    description: "Bespoke desert residence constructed of local clay bricks and custom steel accents, minimizing solar thermal intake.\n\nFeatures a sunken courtyard that collects cool night air. The thermal mass of the thick earth walls ensures interior temperatures stay regulated between blistering days and cold desert nights.",
    category: "Sustainable",
    location: "Sonoran Desert, AZ",
    year: "2025",
    area: "4,600 sqft",
    floors: 1,
    configuration: "Sunken Courtyard Layout",
    testimonial: "Their expertise in thermal mass and sustainable desert living helped us build a villa that uses minimal cooling.",
    media: [
      { file_url: "/website_stock_images/pexels-aksinfo7-31387268.jpg", caption: "Courtyard view at night" },
      { file_url: "/website_stock_images/pexels-ahmetcotur-31817155.jpg", caption: "Sunken lounge details" },
    ],
  },
  {
    slug: "monolithic-museum",
    image: "/website_stock_images/pexels-ahmetcotur-27626174.jpg",
    title: "Monolithic Museum",
    description: "Sculptural public art space that uses off-form concrete panels and hidden sky domes to wash art galleries in soft daylight.\n\nThe sculptural geometry creates a bold spatial experience. Exhibitions are illuminated exclusively by indirect roof sky domes, keeping direct UV radiation off fragile artworks.",
    category: "Commercial",
    location: "Berlin, Germany",
    year: "2026",
    area: "24,000 sqft",
    floors: 3,
    configuration: "3-Level Gallery",
    media: [
      { file_url: "/website_stock_images/pexels-ahmetcotur-27626177.jpg", caption: "Main atrium details" },
      { file_url: "/website_stock_images/pexels-keeganjchecks-12715585.jpg", caption: "Exhibition spaces" },
    ],
  },
  {
    slug: "coastal-sanctuary",
    image: "/website_stock_images/pexels-ahmetcotur-28054849.jpg",
    title: "Coastal Sanctuary",
    description: "Multi-level oceanfront residence with expansive cantilevers, sea-facing pools, and local teak woodwork integrations.\n\nPerched on an oceanfront cliffside, the structural framework cantilevers 15 feet over the surf below. Internal spaces transition seamlessly into external balconies via pocketing sliding doors.",
    category: "Residential",
    location: "Malibu, California",
    year: "2025",
    area: "6,100 sqft",
    floors: 2,
    configuration: "2-Level Ocean Villa",
    media: [
      { file_url: "/website_stock_images/pexels-aksinfo7-31387268.jpg", caption: "Overhang deck view" },
      { file_url: "/website_stock_images/pexels-ahmetcotur-31817155.jpg", caption: "Indoor pools" },
    ],
  },
  {
    slug: "urban-high-rise",
    image: "/website_stock_images/pexels-keeganjchecks-12715585.jpg",
    title: "Urban High-Rise",
    description: "Innovative commercial office design focusing on vertical gardens, smart ventilation, and modular light shelves.\n\nThe facade integrates structural smart-shading panels that rotate dynamically with the path of the sun. Deep vertical gardens climb the building seams to purify air intake.",
    category: "Commercial",
    location: "London, UK",
    year: "2026",
    area: "85,000 sqft",
    floors: 15,
    configuration: "15-Level Office Facade",
    media: [
      { file_url: "/website_stock_images/pexels-ahmetcotur-27626174.jpg", caption: "Façade steel joints" },
      { file_url: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg", caption: "Roof terrace concept" },
    ],
  },
]

export default async function PublicProjectDetailPage({ params }: { params: any }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  const supabase = await createClient()

  // 1. Try to fetch from Supabase
  const { data: listing } = await supabase
    .from("arch_public_listings")
    .select("*, project:arch_projects(*)")
    .eq("slug", slug)
    .maybeSingle()

  let projectDetails: ProjectDetails | null = null

  if (listing && listing.project) {
    const proj = listing.project

    // Fetch related gallery media
    let projectMedia: { file_url: string; caption?: string | null }[] = []
    
    // Check custom selection mapping
    const { data: selectionMedia } = await supabase
      .from("arch_public_listing_media")
      .select("media:arch_project_media(file_url, caption)")
      .eq("public_listing_id", listing.id)
      .order("sort_order")

    if (selectionMedia && selectionMedia.length > 0) {
      projectMedia = selectionMedia.map((m: any) => m.media).filter(Boolean)
    } else {
      // Fallback to all media uploaded for the project
      const { data: rawMedia } = await supabase
        .from("arch_project_media")
        .select("file_url, caption")
        .eq("project_id", proj.id)
        .order("sort_order")
      if (rawMedia) {
        projectMedia = rawMedia
      }
    }

    // Determine cover image URL
    let coverUrl = proj.image || "/website_stock_images/pexels-aksinfo7-31387268.jpg"
    if (listing.cover_media_id) {
      const { data: coverMedia } = await supabase
        .from("arch_project_media")
        .select("file_url")
        .eq("id", listing.cover_media_id)
        .maybeSingle()
      if (coverMedia) {
        coverUrl = coverMedia.file_url
      }
    } else if (projectMedia.length > 0) {
      coverUrl = projectMedia[0].file_url
    }

    // Determine Next project slug & title
    const { data: allListings } = await supabase
      .from("arch_public_listings")
      .select("slug, public_title, project:arch_projects(title)")
      .order("sort_order")

    let nextSlug = slug
    let nextTitle = proj.title
    
    if (allListings && allListings.length > 0) {
      const currIdx = allListings.findIndex((item) => item.slug === slug)
      const nextIdx = (currIdx + 1) % allListings.length
      const nextListing = allListings[nextIdx]
      nextSlug = nextListing.slug
      nextTitle = nextListing.public_title || (nextListing.project as any)?.title || "Next Project"
    }

    projectDetails = {
      title: listing.public_title || proj.title,
      description: listing.public_description || proj.description || "",
      category: proj.type ? proj.type.charAt(0).toUpperCase() + proj.type.slice(1).replace("_", " ") : "Architecture",
      location: proj.city ? `${proj.city}, ${proj.state || ""}` : "Unspecified Location",
      year: proj.year_completed ? String(proj.year_completed) : "2025",
      area: proj.area_sqft ? `${Number(proj.area_sqft).toLocaleString()} SQFT` : "Unspecified",
      floors: proj.floors,
      configuration: proj.configuration,
      testimonial: proj.client_testimonial,
      coverImage: coverUrl,
      media: projectMedia,
      nextProjectSlug: nextSlug,
      nextProjectTitle: nextTitle,
    }
  }

  // 2. Fallback to mock data if not found in database
  if (!projectDetails) {
    const mockProj = MOCK_PROJECTS.find((p) => p.slug === slug)
    
    if (!mockProj) {
      notFound()
    }

    const currIdx = MOCK_PROJECTS.findIndex((p) => p.slug === slug)
    const nextIdx = (currIdx + 1) % MOCK_PROJECTS.length
    const nextMock = MOCK_PROJECTS[nextIdx]

    projectDetails = {
      title: mockProj.title,
      description: mockProj.description,
      category: mockProj.category,
      location: mockProj.location,
      year: mockProj.year,
      area: mockProj.area,
      floors: mockProj.floors,
      configuration: mockProj.configuration,
      testimonial: mockProj.testimonial,
      coverImage: mockProj.image,
      media: mockProj.media,
      nextProjectSlug: nextMock.slug,
      nextProjectTitle: nextMock.title,
    }
  }

  return <ProjectDetailView project={projectDetails} />
}
