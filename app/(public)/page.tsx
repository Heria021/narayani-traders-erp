"use client"

import {
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type Variants,
} from "motion/react"
import Link from "next/link"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Layers,
  MousePointerClick,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: number
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  {
    id: 1,
    slug: "glass-pavilion",
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "The Glass Pavilion",
    subtitle: "Minimalist woodland retreat merging nature and modern structure.",
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
    subtitle: "Brutalist concrete architecture softened by lighting and water elements.",
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
    subtitle: "High-end interior visualization showcasing light-flooded spaces.",
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
    subtitle: "Stunning desert retreat using organic materials and expansive glass facades.",
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
    subtitle: "Sleek sculptural architecture designed to redefine public spaces.",
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
    subtitle: "Bespoke oceanfront luxury living crafted with natural materials.",
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
    subtitle: "Cutting-edge commercial tower facade blending aesthetics and sustainability.",
    description: "Innovative commercial office design focusing on vertical gardens, smart ventilation, and modular light shelves.",
    category: "Commercial",
    location: "London, UK",
    year: "2026",
    area: "85,000 sqft",
  },
]

const CATEGORIES = ["All", "Residential", "Commercial", "Interior", "Sustainable"]
const SLIDE_DURATION = 6000
const EASE_EXPO = [0.16, 1, 0.3, 1] as const

// Art shapes per project — each is a set of SVG path commands that get
// stroke-dashoffset animated on hover (draw-on effect)
const PROJECT_ART = [
  `M 20 20 L 140 20 L 140 90 L 20 90 Z
   M 20 100 L 140 100 L 140 170 L 20 170 Z
   M 150 20 L 220 20 L 220 170 L 150 170 Z
   M 20 180 L 220 180 L 220 220 L 20 220 Z`,
  `M 120 220 A 100 100 0 0 1 220 120
   M 120 220 A 75 75 0 0 1 195 120
   M 120 220 A 50 50 0 0 1 170 120
   M 120 220 A 25 25 0 0 1 145 120`,
  `M 20 20 L 220 220
   M 60 20 L 220 180
   M 100 20 L 220 140
   M 140 20 L 220 100
   M 20 60 L 180 220
   M 20 100 L 140 220
   M 20 140 L 100 220`,
  `M 120 30 L 220 190 L 20 190 Z
   M 120 70 L 200 190 L 40 190 Z
   M 120 110 L 180 190 L 60 190 Z`,
  `M 20 40 L 220 40
   M 20 80 L 220 80
   M 20 120 L 220 120
   M 20 160 L 220 160
   M 20 200 L 220 200
   M 60 20 L 60 220
   M 180 20 L 180 220`,
  `M 20 60 Q 70 30 120 60 T 220 60
   M 20 100 Q 70 70 120 100 T 220 100
   M 20 140 Q 70 110 120 140 T 220 140
   M 20 180 Q 70 150 120 180 T 220 180`,
  `M 40 220 L 40 20
   M 80 220 L 80 40
   M 120 220 L 120 20
   M 160 220 L 160 40
   M 200 220 L 200 20
   M 20 80 L 220 80
   M 20 140 L 220 140`,
]

// ─── Slideshow variants ────────────────────────────────────────────────────────

const slideVariants: Variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_EXPO } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.28, ease: "easeIn" } },
}

// ─── Wavy spine path generator ─────────────────────────────────────────────────
// Builds one continuous curvilinear path that snakes left/right across the
// full height of the archive list, in normalised viewBox units (0–100 wide).
// Rows alternate sides, so the curve gently sways toward whichever card is
// the "art" card vs "photo" card for that row.

function buildSpinePath(rowCount: number, rowUnitHeight = 100) {
  if (rowCount <= 0) return ""
  const midX = 50
  const swing = 14 // how far the curve sways left/right, in viewBox units
  let d = `M ${midX} 0`
  for (let i = 0; i < rowCount; i++) {
    const yStart = i * rowUnitHeight
    const yMid = yStart + rowUnitHeight * 0.5
    const yEnd = yStart + rowUnitHeight
    const dir = i % 2 === 0 ? 1 : -1
    const cx = midX + dir * swing
    // Smooth S-curve through the row's midpoint, settling back at center by row end
    d += ` C ${midX} ${yStart + rowUnitHeight * 0.18}, ${cx} ${yMid - rowUnitHeight * 0.12}, ${cx} ${yMid}`
    d += ` C ${cx} ${yMid + rowUnitHeight * 0.12}, ${midX} ${yEnd - rowUnitHeight * 0.18}, ${midX} ${yEnd}`
  }
  return d
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PublicHomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // ── RAF loop for progress bar — zero React re-renders ─────────────────────
  const progressBarRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [])

  const startLoop = useCallback(() => {
    stopLoop()
    startTimeRef.current = Date.now()
    const tick = () => {
      const pct = Math.min(((Date.now() - startTimeRef.current) / SLIDE_DURATION) * 100, 100)
      if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick) }
      else { setActiveIndex(p => (p + 1) % PROJECTS.length) }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopLoop])

  const prevIndexRef = useRef(-1)
  if (prevIndexRef.current !== activeIndex) {
    prevIndexRef.current = activeIndex
    stopLoop()
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => startLoop())
    }
  }

  const goTo = useCallback((idx: number) => setActiveIndex(idx), [])
  const handleNext = useCallback(() => goTo((activeIndex + 1) % PROJECTS.length), [activeIndex, goTo])
  const handlePrev = useCallback(() => goTo((activeIndex - 1 + PROJECTS.length) % PROJECTS.length), [activeIndex, goTo])

  const scrollToProjects = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
  }

  const currentProject = PROJECTS[activeIndex]

  const filteredProjects = useMemo(
    () => PROJECTS.filter(p => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      return matchCat && matchSearch
    }),
    [selectedCategory, searchQuery]
  )

  const spinePath = useMemo(() => buildSpinePath(filteredProjects.length), [filteredProjects.length])

  return (
    <div className="bg-black text-white w-full min-h-screen">

      {/* ══════════════════════════════════════════
          HERO SLIDESHOW
      ══════════════════════════════════════════ */}
      <section className="relative h-screen w-full overflow-hidden bg-black">

        <div className="absolute inset-0">
          {PROJECTS.map((p, i) => (
            <div
              key={p.id}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${p.image}')`,
                opacity: i === activeIndex ? 1 : 0,
                transform: i === activeIndex ? "scale(1.04)" : "scale(1.0)",
                transition: "opacity 1.2s ease-in-out, transform 7s ease-out",
                willChange: "opacity, transform",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-10" />

        <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-12 pt-24 pb-28">
          <div className="max-w-3xl flex flex-col gap-6 md:gap-8">

            <AnimatePresence mode="wait">
              <motion.div key={`meta-${activeIndex}`} variants={slideVariants} initial="enter" animate="center" exit="exit"
                className="flex items-center gap-3 text-xs md:text-sm font-semibold tracking-[0.22em] uppercase text-white/55">
                <span>{currentProject.category}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-white/35" />
                <span>{currentProject.location}</span>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.h1 key={`title-${activeIndex}`} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.65, ease: EASE_EXPO, delay: 0.06 }}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-[88px] font-extralight tracking-tight leading-[0.95] uppercase">
                {currentProject.title.split(" ").map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? "font-bold block" : "font-extralight"}>
                    {word}{" "}
                  </span>
                ))}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p key={`sub-${activeIndex}`} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.55, ease: EASE_EXPO, delay: 0.1 }}
                className="text-white/65 text-base sm:text-lg md:text-xl font-light max-w-lg leading-relaxed">
                {currentProject.subtitle}
              </motion.p>
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4 mt-2">
              <a href="#projects" onClick={scrollToProjects}
                className="group flex items-center gap-2 text-xs md:text-sm font-semibold tracking-widest uppercase bg-white text-black hover:bg-white/92 px-6 md:px-8 py-3.5 md:py-4 rounded-full hover:scale-[1.03] active:scale-[0.98]"
                style={{ transition: "background-color 200ms, transform 150ms" }}>
                Explore Portfolio
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <Link href="/contact"
                className="text-xs md:text-sm font-semibold tracking-widest uppercase border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/8 px-6 md:px-8 py-3.5 md:py-4 rounded-full transition-all duration-200 backdrop-blur-sm">
                Inquire
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-12 z-30 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="flex items-center gap-2 md:gap-3">
            {PROJECTS.map((p, idx) => (
              <button key={p.id} onClick={() => goTo(idx)} aria-label={`Slide ${idx + 1}`}
                className="group flex flex-col gap-1.5 py-3 cursor-pointer">
                <div className="relative h-[2px] w-8 sm:w-12 bg-white/18 overflow-hidden rounded-full">
                  {idx === activeIndex && (
                    <div ref={progressBarRef} className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: "0%" }} />
                  )}
                  {idx !== activeIndex && (
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/30 transition-colors duration-200 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-mono tracking-wider transition-colors duration-300 ${idx === activeIndex ? "text-white" : "text-white/35 group-hover:text-white/55"}`}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <a href="#projects" onClick={scrollToProjects}
              className="hidden lg:flex items-center gap-2 text-[10px] tracking-[0.22em] font-semibold text-white/45 hover:text-white/80 uppercase transition-colors duration-200">
              <MousePointerClick className="h-4 w-4" />
              Scroll Down
            </a>
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} aria-label="Previous"
                className="flex items-center justify-center h-9 w-9 rounded-full border border-white/12 hover:border-white/35 bg-black/25 hover:bg-white/10 text-white/55 hover:text-white transition-all duration-200">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNext} aria-label="Next"
                className="flex items-center justify-center h-9 w-9 rounded-full border border-white/12 hover:border-white/35 bg-black/25 hover:bg-white/10 text-white/55 hover:text-white transition-all duration-200">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROJECT ARCHIVE
      ══════════════════════════════════════════ */}
      <section
        id="projects"
        className="relative w-full bg-[#060606] py-24 md:py-32 border-t border-white/8"
      >
        <div className="flex flex-col">

          {/* Heading + filters stay readable at a constrained, centered width */}
          <div className="max-w-6xl mx-auto w-full px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: EASE_EXPO }}
              className="flex flex-col gap-3 mb-20">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/45 uppercase">Portfolio Curation</span>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-none">
                Project <span className="font-bold">Archive</span>
              </h2>
              <p className="text-white/55 font-light text-sm md:text-base max-w-xl leading-relaxed mt-1">
                Explore our complete collection of bespoke architectural concept renderings, interior visualizations, and high-end built designs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.1 }}
              className="flex flex-col md:flex-row gap-5 justify-between items-start md:items-center mb-16 border-b border-white/8 pb-8">
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`relative px-4 py-2 text-xs md:text-sm rounded-full cursor-pointer transition-colors duration-200 ${selectedCategory === cat ? "text-black font-medium z-10" : "text-white/55 font-light hover:text-white hover:bg-white/6"}`}>
                    {selectedCategory === cat && (
                      <motion.div layoutId="activeCat" className="absolute inset-0 bg-white rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/35 pointer-events-none" />
                <input type="text" placeholder="Search projects…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/8 focus:bg-white/8 focus:ring-1 focus:ring-white/15 border border-white/8 rounded-full text-xs md:text-sm outline-none transition-colors duration-200 placeholder:text-white/25" />
              </div>
            </motion.div>
          </div>

          {/* ── Card list — runs the FULL width of the section (no max-w cap),
              so the in/out horizontal swing has real room on both sides and
              the cards never get clipped. Vertical fade is scoped here only,
              so the heading/filter bar above stays fully visible. ── */}
          <div
            className="relative w-full overflow-x-hidden"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
              maskImage: "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
            }}
          >

            {/* Wavy spine — one continuous SVG path behind all rows */}
            {filteredProjects.length > 0 && (
              <svg
                className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none z-0"
                width="100" height="100%"
                viewBox={`0 0 100 ${filteredProjects.length * 100}`}
                preserveAspectRatio="none"
                style={{ height: "100%" }}
              >
                <path d={spinePath} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.6" />
              </svg>
            )}

            <AnimatePresence mode="popLayout">
              {filteredProjects.length > 0 ? (
                <div className="flex flex-col gap-0 relative z-10 max-w-[1800px] mx-auto px-4 md:px-16">
                  {filteredProjects.map((project, idx) => {
                    const isLeft = idx % 2 === 0
                    const artIndex = (project.id - 1) % PROJECT_ART.length
                    return (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        isLeft={isLeft}
                        artPaths={PROJECT_ART[artIndex]}
                      />
                    )
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4 py-24 text-center max-w-6xl mx-auto">
                  <Layers className="h-9 w-9 text-white/25" />
                  <p className="text-white/40 font-light text-sm">No projects match those filters.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>
    </div>
  )
}

// ─── Project Row ──────────────────────────────────────────────────────────────
// Scroll-linked "center focus" row: opacity / scale / blur all driven
// continuously by scroll progress relative to the viewport, peaking when
// the row crosses the vertical center. Rows above/below recede smoothly
// instead of binary on/off — only one project ever reads as "in focus."

function ProjectRow({
  project,
  isLeft,
  artPaths,
}: {
  project: Project
  isLeft: boolean
  artPaths: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"], // 0 = entering from bottom, 1 = leaving past top
  })

  const opacity = useTransform(scrollYProgress, [0, 0.32, 0.5, 0.68, 1], [0.18, 0.45, 1, 0.45, 0.18])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.93, 1, 0.93])
  const blurPx = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, 5])
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`)

  // Horizontal travel: each column starts off-screen at its own outside edge,
  // glides inward to meet at center when the row crosses viewport-center,
  // then continues outward back to that SAME edge as it exits — an
  // out → in → out sweep rather than a one-way slide.
  // Left column always travels from/to the left edge, right column from/to the right edge,
  // regardless of which card (photo or art) currently occupies that column.
  const leftColX = useTransform(scrollYProgress, [0, 0.5, 1], ["-60%", "0%", "-60%"])
  const rightColX = useTransform(scrollYProgress, [0, 0.5, 1], ["60%", "0%", "60%"])

  return (
    <motion.div
      ref={rowRef}
      style={{ opacity, scale, filter }}
      className="relative grid grid-cols-1 md:grid-cols-[1fr_64px_1fr] items-center gap-0 py-10 md:py-14"
    >
      <motion.div className="w-full" style={{ x: leftColX }}>
        {isLeft ? <PhotoCard project={project} /> : <ArtCard project={project} artPaths={artPaths} />}
      </motion.div>

      <div className="hidden md:block" />

      <motion.div className="w-full mt-5 md:mt-0" style={{ x: rightColX }}>
        {isLeft ? <ArtCard project={project} artPaths={artPaths} /> : <PhotoCard project={project} />}
      </motion.div>
    </motion.div>
  )
}

// ─── Photo Card ───────────────────────────────────────────────────────────────
// Bigger, calmer: only the title shows at rest. Category, description, and
// the link all reveal together on hover so the resting state stays clean.

function PhotoCard({ project }: { project: Project }) {
  const hoverX = useMotionValue(0)
  const hoverY = useMotionValue(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const bgX = useSpring(useTransform(hoverX, [-1, 1], ["-1.5%", "1.5%"]), { stiffness: 180, damping: 24 })
  const bgY = useSpring(useTransform(hoverY, [-1, 1], ["-1.5%", "1.5%"]), { stiffness: 180, damping: 24 })

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    hoverX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    hoverY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
  }, [hoverX, hoverY])

  const handleLeave = useCallback(() => {
    hoverX.set(0)
    hoverY.set(0)
  }, [hoverX, hoverY])

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative overflow-hidden rounded-3xl bg-[#0d0d0d] border border-white/8"
      style={{ height: 540 }}
      whileHover="hover"
      initial="rest"
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-[-4%] bg-cover bg-center"
          style={{ backgroundImage: `url('${project.image}')`, x: bgX, y: bgY, willChange: "transform" }}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
          transition={{ duration: 0.7, ease: EASE_EXPO }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent z-10" />
      <motion.div
        className="absolute inset-0 bg-black/15 z-10"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: 0.35 }}
      />

      {/* Resting state — title only, kept minimal */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col justify-end p-8"
        variants={{ rest: { y: 0 }, hover: { y: -8 } }}
        transition={{ duration: 0.45, ease: EASE_EXPO }}
      >
        <motion.span
          className="text-[9px] font-bold tracking-[0.24em] text-white/0 uppercase mb-2 overflow-hidden"
          variants={{ rest: { opacity: 0, height: 0 }, hover: { opacity: 0.45, height: "auto" } }}
          transition={{ duration: 0.3 }}
        >
          {project.category} &nbsp;·&nbsp; {project.year}
        </motion.span>

        <h3 className="text-3xl font-light tracking-wide text-white uppercase leading-tight mb-2">
          {project.title}
        </h3>

        <motion.div
          variants={{ rest: { opacity: 0, height: 0, y: 8 }, hover: { opacity: 1, height: "auto", y: 0 } }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          style={{ overflow: "hidden" }}
          className="flex flex-col gap-4"
        >
          <p className="text-white/60 text-xs font-light leading-relaxed max-w-sm">
            {project.description}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="flex items-center gap-1.5 text-[10px] font-light text-white/40">
              <MapPin className="h-3 w-3 shrink-0" />
              {project.location}
            </span>
            <Link href={`/projects/${project.slug}`}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-white/80 hover:text-white transition-colors"
              onClick={e => e.stopPropagation()}>
              Explore <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-5 right-5 z-30 pointer-events-none"
        variants={{ rest: { opacity: 0, scale: 0.8 }, hover: { opacity: 1, scale: 1 } }}
        transition={{ duration: 0.35, ease: EASE_EXPO }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0 L0 0 L0 24" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-5 left-5 z-30 pointer-events-none"
        variants={{ rest: { opacity: 0, scale: 0.8 }, hover: { opacity: 1, scale: 1 } }}
        transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.05 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M0 24 L24 24 L24 0" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        </svg>
      </motion.div>
    </motion.article>
  )
}

// ─── Art Card ─────────────────────────────────────────────────────────────────
// Bigger card, lighter meta block — area dropped from the always-visible
// stack, more breathing room around the line art.

function ArtCard({ project, artPaths }: { project: Project; artPaths: string }) {
  const [hovered, setHovered] = useState(false)
  const paths = artPaths.trim().split("\n").map(p => p.trim()).filter(Boolean)

  return (
    <motion.article
      className="group relative overflow-hidden rounded-3xl border border-white/8 bg-[#0d0d0d]"
      style={{ height: 540 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ borderColor: "rgba(255,255,255,0.18)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)" }} />

      <div className="relative h-full flex flex-col md:flex-row">

        <div className="flex flex-col justify-between p-8 md:w-[42%] shrink-0 border-r border-white/6">
          <div>
            <span className="text-[9px] font-bold tracking-[0.24em] text-white/35 uppercase block mb-6">
              {project.category} &nbsp;·&nbsp; {project.year}
            </span>
            <h3 className="text-2xl font-light tracking-wide text-white uppercase leading-tight">
              {project.title}
            </h3>
          </div>

          <div className="flex flex-col gap-6 mt-6">
            <p className="text-white/50 text-[11px] font-light leading-relaxed">
              {project.subtitle}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-white/35">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{project.location}</span>
            </div>
            <Link href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-white/55 hover:text-white transition-colors duration-200">
              View Project <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`grid-${project.id}`} width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
          </svg>

          <span className="absolute bottom-5 right-6 text-[80px] font-bold text-white/[0.04] leading-none select-none pointer-events-none">
            {String(project.id).padStart(2, "0")}
          </span>

          <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[250px] max-h-[250px]" style={{ overflow: "visible" }}>
            {paths.map((d, i) => (
              <ArtPath key={i} d={d} hovered={hovered} delay={i * 0.06} />
            ))}
          </svg>

          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
          />
        </div>
      </div>
    </motion.article>
  )
}

// ─── Art Path — individual animated SVG stroke ────────────────────────────────
// Curves softened: straight grid/cross-hatch shapes get rounded joins +
// caps already; for the line-art curvature itself, see PROJECT_ART above —
// arcs/waves (items 2 and 6) already read as curvilinear, and rounded
// strokeLinecap/strokeLinejoin keep every corner soft.

function ArtPath({ d, hovered, delay }: { d: string; hovered: boolean; delay: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1"
      animate={{
        strokeDashoffset: hovered ? 0 : 1,
        opacity: hovered ? 1 : 0.08,
      }}
      transition={{
        strokeDashoffset: { duration: 0.6, ease: EASE_EXPO, delay },
        opacity: { duration: 0.35, delay: hovered ? delay : 0 },
      }}
      style={{ strokeDashoffset: 1 }}
    />
  )
}