"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Calendar, MapPin, Maximize2, Layers, ShieldCheck, Quote } from "lucide-react"

export interface ProjectDetails {
  title: string
  description: string
  category: string
  location: string
  year: string
  area: string
  floors?: number | null
  configuration?: string | null
  testimonial?: string | null
  coverImage: string
  media: { file_url: string; caption?: string | null }[]
  nextProjectSlug: string
  nextProjectTitle: string
}

// Variants for staggered entrance
const fadeUpVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 15,
      delay: i * 0.1,
      duration: 0.6,
    },
  }),
}

export default function ProjectDetailView({ project }: { project: ProjectDetails }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Scroll animation for parallax cover hero
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 180])
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.05])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.2])

  return (
    <div ref={containerRef} className="min-h-screen bg-[#060606] text-white overflow-hidden pb-20">
      
      {/* 1. Cover Hero Section */}
      <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden bg-black flex items-end">
        {/* Parallax Background Container */}
        <motion.div
          className="absolute inset-0 w-full h-full bg-cover bg-center origin-bottom"
          style={{
            y: heroY,
            scale: heroScale,
            opacity: heroOpacity,
            backgroundImage: `url('${project.coverImage}')`,
          }}
        />
        
        {/* Overlays for dark ambient contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-black/30 to-black/40 z-10" />

        {/* Back Button */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white bg-black/30 hover:bg-black/50 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Projects
          </Link>
        </div>

        {/* Hero Title Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 md:pb-16 flex flex-col gap-3">
          <motion.span
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/60 uppercase"
          >
            {project.category} &bull; {project.location}
          </motion.span>
          
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="text-4xl md:text-7xl font-extralight tracking-tight uppercase leading-none"
          >
            {project.title.split(" ").map((word, i) => (
              <span key={i} className={i % 2 === 1 ? "font-bold block mt-1" : "font-extralight"}>
                {word}{" "}
              </span>
            ))}
          </motion.h1>
        </div>
      </div>

      {/* 2. Specs Dashboard Section */}
      <div className="w-full border-y border-white/5 bg-[#0a0a0a] py-8 px-6 md:px-12 mb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          
          <div className="flex flex-col gap-1.5 border-l border-white/10 pl-4">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-white/50" />
              Area
            </span>
            <span className="text-lg md:text-xl font-light">{project.area}</span>
          </div>

          <div className="flex flex-col gap-1.5 border-l border-white/10 pl-4">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-white/50" />
              Year Completed
            </span>
            <span className="text-lg md:text-xl font-light">{project.year}</span>
          </div>

          <div className="flex flex-col gap-1.5 border-l border-white/10 pl-4">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-white/50" />
              Configuration
            </span>
            <span className="text-lg md:text-xl font-light">
              {project.configuration || `${project.floors || 1} Floor(s)`}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 border-l border-white/10 pl-4">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/50" />
              Location
            </span>
            <span className="text-lg md:text-xl font-light line-clamp-1">{project.location}</span>
          </div>

        </div>
      </div>

      {/* 3. Description Narrative & Testimonial */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
        
        {/* Narrative */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-2xl font-light tracking-wide uppercase text-white/80">
            Design Concept & Approach
          </h2>
          <div className="h-[1px] w-12 bg-white/20" />
          <p className="text-white/70 font-light text-base md:text-lg leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Testimonial Panel */}
        {project.testimonial && (
          <div className="lg:col-span-4 self-start">
            <div className="relative p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
              <Quote className="absolute right-6 top-6 h-12 w-12 text-white/5 pointer-events-none" />
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                  Client Verdict
                </span>
                <p className="text-white/80 font-light italic text-sm md:text-base leading-relaxed">
                  "{project.testimonial}"
                </p>
                <div className="h-[1px] w-full bg-white/5 pt-2" />
                <span className="text-[11px] font-semibold tracking-wider text-white/60 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-white/40" />
                  Verified Commission
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Large Image spreads Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-8 md:gap-12 mb-28">
        <h2 className="text-xl md:text-2xl font-light tracking-wide uppercase text-white/40 mb-2">
          Visual Showcase
        </h2>

        {project.media.length === 0 ? (
          <div className="w-full text-center py-12 border border-white/5 rounded-2xl bg-white/5">
            <span className="text-white/40 text-sm">No additional showcase images loaded.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-12 md:gap-16">
            {project.media.map((item, idx) => {
              // Asymmetric Layout:
              // Index 0: Large Full Width Image
              // Index 1, 2: Two-column grid
              // Index 3: Full Width Image
              // Index 4, 5: Two-column grid
              const isFullWidth = idx % 3 === 0;

              return (
                <div key={idx} className="w-full flex flex-col gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ type: "spring" as const, stiffness: 50, damping: 15 }}
                    className={`relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/10 group ${
                      isFullWidth ? "h-[50vh] md:h-[75vh]" : "h-[40vh] md:h-[55vh]"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
                      style={{ backgroundImage: `url('${item.file_url}')` }}
                    />
                    {/* Shadow reveal for caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    
                    {/* Caption Overlay */}
                    {item.caption && (
                      <div className="absolute bottom-6 left-6 right-6 z-20 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <p className="text-xs md:text-sm font-light text-white/90 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                          {item.caption}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Next Project Closeout Banner */}
      <div className="border-t border-white/10 pt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Link
            href={`/projects/${project.nextProjectSlug}`}
            className="group block relative w-full h-[220px] md:h-[300px] rounded-3xl overflow-hidden bg-zinc-950 border border-white/10"
          >
            {/* Direct Background link or fallback */}
            <div className="absolute inset-0 bg-[#0c0c0c] transition-all duration-500 group-hover:opacity-90" />
            
            {/* Visual gradient sheen */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
            
            {/* Center Information */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 gap-3">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/40 uppercase">
                Up Next
              </span>
              <h3 className="text-2xl md:text-5xl font-light tracking-wide text-white uppercase group-hover:text-white/90 transition-colors flex items-center gap-3">
                {project.nextProjectTitle}
                <ArrowRight className="h-6 w-6 md:h-8 md:w-8 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 text-white" />
              </h3>
              <span className="text-[11px] text-white/50 font-light flex items-center gap-1">
                Explore Project Details
              </span>
            </div>
          </Link>
        </div>
      </div>

    </div>
  )
}
