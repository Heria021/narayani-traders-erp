"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { ArrowRight, MapPin, Search, Grid, Layers } from "lucide-react"

interface Project {
  id: number
  slug: string
  image: string
  title: string
  description: string
  category: string
  location: string
  year: string
  area: string
}

const PROJECTS: Project[] = [
  {
    id: 1,
    slug: "glass-pavilion",
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "The Glass Pavilion",
    description: "Minimalist woodland retreat designed to merge with surrounding nature using floor-to-ceiling glass and exposed structures.",
    category: "Residential",
    location: "Portland, Oregon",
    year: "2025",
    area: "3,200 sqft",
  },
  {
    id: 2,
    slug: "vapor-residence",
    image: "/website_stock_images/pexels-ahmetcotur-27626177.jpg",
    title: "Vapor Residence",
    description: "Brutalist concrete dwelling softened by ambient recessed light wells, cascading gardens, and indoor-outdoor water pathways.",
    category: "Residential",
    location: "Kyoto, Japan",
    year: "2026",
    area: "5,400 sqft",
  },
  {
    id: 3,
    slug: "luminous-penthouse",
    image: "/website_stock_images/pexels-ahmetcotur-31817155.jpg",
    title: "Luminous Penthouse",
    description: "High-end urban interior design concept that centers around open spaces, white oak timbers, and double-height ceiling voids.",
    category: "Interior",
    location: "New York, USA",
    year: "2024",
    area: "2,800 sqft",
  },
  {
    id: 4,
    slug: "desert-oasis-villa",
    image: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg",
    title: "Desert Oasis Villa",
    description: "Bespoke desert residence constructed of local clay bricks and custom steel accents, minimizing solar thermal intake.",
    category: "Sustainable",
    location: "Sonoran Desert, AZ",
    year: "2025",
    area: "4,600 sqft",
  },
  {
    id: 5,
    slug: "monolithic-museum",
    image: "/website_stock_images/pexels-ahmetcotur-27626174.jpg",
    title: "Monolithic Museum",
    description: "Sculptural public art space that uses off-form concrete panels and hidden sky domes to wash art galleries in soft daylight.",
    category: "Commercial",
    location: "Berlin, Germany",
    year: "2026",
    area: "24,000 sqft",
  },
  {
    id: 6,
    slug: "coastal-sanctuary",
    image: "/website_stock_images/pexels-ahmetcotur-28054849.jpg",
    title: "Coastal Sanctuary",
    description: "Multi-level oceanfront residence with expansive cantilevers, sea-facing pools, and local teak woodwork integrations.",
    category: "Residential",
    location: "Malibu, California",
    year: "2025",
    area: "6,100 sqft",
  },
  {
    id: 7,
    slug: "urban-high-rise",
    image: "/website_stock_images/pexels-keeganjchecks-12715585.jpg",
    title: "Urban High-Rise",
    description: "Innovative commercial office design focusing on vertical gardens, smart ventilation, and modular light shelves.",
    category: "Commercial",
    location: "London, UK",
    year: "2026",
    area: "85,000 sqft",
  },
]

const CATEGORIES = ["All", "Residential", "Commercial", "Interior", "Sustainable"]

// Parent stagger variants for scroll entry
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Stagger child card entry with 3D rotation & spring
const cardVariants = {
  hidden: { opacity: 0, y: 50, rotateX: 15, rotateY: -3, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 60,
      damping: 15,
      duration: 0.8,
    },
  },
}

export default function PublicProjectsGridPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = PROJECTS.filter((project) => {
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-32 pb-24 px-6 md:px-12 flex flex-col items-center">
      {/* Title & Description */}
      <div className="w-full max-w-7xl flex flex-col gap-4 text-center md:text-left mb-16">
        <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/50 uppercase">
          Hariom Studio
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-none">
          Project <span className="font-bold block md:inline">Archive</span>
        </h1>
        <p className="text-white/60 font-light text-sm md:text-base max-w-xl leading-relaxed mt-2">
          Explore our complete collection of bespoke architectural concept renderings, interior visualizations, and high-end built designs.
        </p>
      </div>

      {/* Filters & Search Container */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 justify-between items-center mb-12 border-b border-white/10 pb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative px-4 py-2 text-xs md:text-sm font-light rounded-full transition-all duration-300 cursor-pointer ${
                selectedCategory === cat
                  ? "text-black z-10 font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {selectedCategory === cat && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/20 border border-white/10 rounded-full text-xs md:text-sm outline-none transition-all placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Grid List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center py-20 flex flex-col items-center gap-4"
        >
          <Layers className="h-10 w-10 text-white/30" />
          <p className="text-white/50 font-light text-sm">
            No projects found matching the criteria. Try adjusting your filters or search.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// 3D Tilt Card Component
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({ opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Position of cursor relative to element
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Normalize coordinates to -1 to 1
    const xc = (x - width / 2) / (width / 2)
    const yc = ((y - height / 2) / (height / 2)) * -1 // Invert Y

    // Max rotation is 10 degrees
    const rX = yc * 10
    const rY = xc * 10

    setRotateX(rX)
    setRotateY(rY)

    // Glow overlay coordinates
    const glowX = (x / width) * 100
    const glowY = (y / height) * 100
    setGlowStyle({
      opacity: 0.2,
      background: `radial-gradient(circle 180px at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.4), transparent)`,
    })
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setGlowStyle({ opacity: 0 })
  }

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="group relative h-[380px] md:h-[450px] w-full rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/10"
      style={{
        perspective: 1000,
      }}
    >
      {/* 3D Inner Wrapper */}
      <motion.div
        className="relative w-full h-full flex flex-col justify-end p-6 md:p-8 select-none"
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
          style={{ backgroundImage: `url('${project.image}')` }}
        />

        {/* Gradual overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10 transition-opacity duration-300 group-hover:from-black group-hover:via-black/55" />

        {/* Dynamic Glass Glow sheen overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
          style={glowStyle}
        />

        {/* Info Overlay */}
        <div className="relative z-30 flex flex-col gap-2.5">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
            {project.category}
          </span>

          <h3 className="text-xl md:text-2xl font-light tracking-wide text-white uppercase group-hover:text-white transition-colors leading-tight">
            {project.title}
          </h3>

          <p className="text-white/60 text-xs font-light max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:max-h-[80px] group-hover:opacity-100 group-hover:mt-1">
            {project.description}
          </p>

          <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
            <span className="text-[10px] font-light text-white/40 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {project.location}
            </span>
            <Link
              href={`/projects/${project.slug}`}
              className="text-[10px] font-semibold tracking-wider uppercase text-white/80 flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 cursor-pointer"
            >
              Explore
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
