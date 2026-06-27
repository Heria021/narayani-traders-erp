"use client"

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
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
  MapPin,
  MapPinned,
  Search,
  Layers,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"


// - Types -

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

// - Data -

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

// - Wavy spine path generator -

function buildSpinePath(rowCount: number, rowUnitHeight = 100) {
  if (rowCount <= 0) return ""
  const midX = 50
  const swing = 14
  let d = `M ${midX} 0`
  for (let i = 0; i < rowCount; i++) {
    const yStart = i * rowUnitHeight
    const yMid = yStart + rowUnitHeight * 0.5
    const yEnd = yStart + rowUnitHeight
    const dir = i % 2 === 0 ? 1 : -1
    const cx = midX + dir * swing
    d += ` C ${midX} ${yStart + rowUnitHeight * 0.18}, ${cx} ${yMid - rowUnitHeight * 0.12}, ${cx} ${yMid}`
    d += ` C ${cx} ${yMid + rowUnitHeight * 0.12}, ${midX} ${yEnd - rowUnitHeight * 0.18}, ${midX} ${yEnd}`
  }
  return d
}

// - Hero copy — swap the HERO_COPY object to change variant -
//
//  Option 1 · Philosophy (active below)
//  Option 2 · Capability  → eyebrow: "Full-Service Architectural Studio"
//                            headline: ["Precision-Crafted", "Architecture."]
//                            body: "From brutalist concrete structures to sustainable glass retreats, we deliver full-scale architectural visualization, planning, and design integration."
//                            cta1: { label: "Our Methodology", href: "/methodology" }
//                            cta2: { label: "Let's Collaborate", href: "/contact" }
//  Option 3 · Impact      → eyebrow: "Architecture for Future Living"
//                            headline: ["Designing for the", "Future of Living."]
//                            body: "We create immersive environments defined by light, natural materials, and structural integrity. Your vision, engineered to exceed expectations."
//                            cta1: { label: "Explore Our Expertise", href: "#projects" }
//                            cta2: { label: "Inquire", href: "/contact" }

const HERO_COPY_A = {
  eyebrow: "Architecture · Interior · Environment",
  // Each string in headline becomes its own line.
  // Odd-indexed words within a line render in bold (matching the site's existing typographic voice).
  headline: ["We Architecture", "Exceptional Spaces."],
  body: "Bridging the gap between raw materiality and refined comfort. We specialise in bespoke residential and commercial designs that harmonise with their environment.",
  cta1: { label: "Our Methodology", href: "/methodology" },
  cta2: { label: "Start a Project", href: "/contact" },
  // Slide ticker label shown at the far right of the bottom bar
  tickerLabel: "Selected Works",
}

const HERO_COPY_B = {
  eyebrow: "Philosophy · Structure · Light",
  headline: ["Light Composes", "Refined Textures."],
  body: "We believe that a built space should not fight its environment. Light should not illuminate — it should compose texture, defining human experience through structural integrity.",
  cta1: { label: "Our Methodology", href: "/methodology" },
  cta2: { label: "Start a Project", href: "/contact" },
  tickerLabel: "Selected Works",
}

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.06,
      staggerDirection: -1,
    },
  },
}

const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 15,
    filter: "blur(12px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: EASE_EXPO,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    filter: "blur(8px)",
    transition: {
      duration: 0.5,
      ease: EASE_EXPO,
    },
  },
}

const dividerVariants: Variants = {
  initial: {
    scaleX: 0,
    opacity: 0,
    originX: 0,
  },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: EASE_EXPO,
    },
  },
  exit: {
    scaleX: 0,
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: EASE_EXPO,
    },
  },
}

const SERVICES = [
  {
    num: "01",
    icon: "🗺️",
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "Floor Plan Design",
    desc: "Detailed 2D floor plans crafted for optimal space utilization — rooms, corridors, staircases, and dimensions drawn to execution-ready precision.",
  },
  {
    num: "02",
    icon: "📐",
    image: "/website_stock_images/pexels-ahmetcotur-27626177.jpg",
    title: "3D Architectural Renders",
    desc: "Photorealistic 3D exterior and interior visualizations that bring your project to life before a single brick is placed.",
  },
  {
    num: "03",
    icon: "🛋️",
    image: "/website_stock_images/pexels-ahmetcotur-31817155.jpg",
    title: "Interior Design",
    desc: "Bespoke interior concepts — furniture placement, material palettes, lighting moods, and finish boards tailored to your aesthetic.",
  },
  {
    num: "04",
    icon: "🏘️",
    image: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg",
    title: "Society & Township Planning",
    desc: "Master planning for residential colonies and townships — road networks, green zones, plot layouts, and common infrastructure.",
  },
  {
    num: "05",
    icon: "🧭",
    image: "/website_stock_images/pexels-ahmetcotur-27626174.jpg",
    title: "Vastu Consultation",
    desc: "Room orientation, entrance placement, and energy-flow layouts that harmonise Vastu Shastra tradition with modern design.",
  },
  {
    num: "06",
    icon: "📋",
    image: "/website_stock_images/pexels-keeganjchecks-12715585.jpg",
    title: "Technical Drafting & Blueprints",
    desc: "Construction-ready working drawings, elevation details, section cuts, and structural blueprints documented for contractor execution.",
  },
]

const SHOWCASE_ITEMS = [
  {
    num: "01",
    image: "/website_stock_images/pexels-ahmetcotur-27626177.jpg",
    title: "Brutalist Concrete Concept",
    desc: "Refining mass and shadow through photorealistic raw textures.",
  },
  {
    num: "02",
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "Minimalist Purity Retreat",
    desc: "Refining details to achieve clean light and architectural volume.",
  },
  {
    num: "03",
    image: "/website_stock_images/pexels-ahmetcotur-31817155.jpg",
    title: "Timber & Light Synthesis",
    desc: "Warm local wood textures balancing industrial envelopes.",
  },
  {
    num: "04",
    image: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg",
    title: "Terraces & Overhangs Villa",
    desc: "Extending visual lines outwards with dramatic cantilevers.",
  },
  {
    num: "05",
    image: "/website_stock_images/pexels-ahmetcotur-27626174.jpg",
    title: "Daylight Ingress Mapping",
    desc: "Washing galleries and atriums with soft, indirect sky wells.",
  },
  {
    num: "06",
    image: "/website_stock_images/pexels-keeganjchecks-12715585.jpg",
    title: "Urban Landscape Synthesis",
    desc: "Designing environments that breathe and blend with nature.",
  },
]

const STUDIO_STATS: { value: string; label: string }[] = [
  { value: "12+", label: "Years Active" },
  { value: "85+", label: "Projects Delivered" },
]

// - Main component -

export default function PublicHomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeService, setActiveService] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // - Studio scroll parallax hook -
  const aboutStudioRef = useRef<HTMLElement>(null)
  const { scrollYProgress: studioScrollY } = useScroll({
    target: aboutStudioRef,
    offset: ["start end", "end start"],
  })
  const studioPhotoY = useTransform(studioScrollY, [0, 1], ["8%", "-8%"])
  
  // - Studio mouse interactive hover parallax values -
  const studioHoverX = useMotionValue(0)
  const studioHoverY = useMotionValue(0)
  const studioCardRef = useRef<HTMLDivElement>(null)

  const studioMouseBgX = useSpring(useTransform(studioHoverX, [-1, 1], ["-1.5%", "1.5%"]), { stiffness: 180, damping: 24 })
  const studioMouseBgY = useSpring(useTransform(studioHoverY, [-1, 1], ["-1.5%", "1.5%"]), { stiffness: 180, damping: 24 })

  const handleStudioMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = studioCardRef.current?.getBoundingClientRect()
    if (!rect) return
    studioHoverX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    studioHoverY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
  }, [studioHoverX, studioHoverY])

  const handleStudioLeave = useCallback(() => {
    studioHoverX.set(0)
    studioHoverY.set(0)
  }, [studioHoverX, studioHoverY])

  // Combine scroll-linked y translation and mouse hover y spring
  const finalStudioPhotoY = useTransform(
    [studioPhotoY, studioMouseBgY],
    ([scrollY, mouseContainerY]) => `calc(${scrollY} + ${mouseContainerY})`
  )

  // - RAF loop for progress bar — zero React re-renders -
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


  const currentProject = PROJECTS[activeIndex]
  const isEvenProject = activeIndex % 2 === 1
  const currentHeroCopy = isEvenProject ? HERO_COPY_B : HERO_COPY_A

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

      {/* =
          HERO — MISSION-DRIVEN
          The slideshow is demoted to a full-bleed
          cinematic backdrop. The firm's philosophy
          is now the primary content of this section.
      = */}
      <section className="relative h-screen w-full overflow-hidden bg-black">

        {/* - Background slideshow (unchanged mechanics) - */}
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
          {/* Heavier left vignette so the firm statement always reads cleanly */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/35" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-10" />

        {/* - Primary hero content - */}
        <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-12 pt-24 pb-36">
          <div className="max-w-4xl flex flex-col gap-7 md:gap-10">

            <AnimatePresence mode="wait">
              <motion.div
                key={isEvenProject ? "even" : "odd"}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={containerVariants}
                className="flex flex-col gap-7 md:gap-10"
              >
                {/* Eyebrow — firm disciplines */}
                <motion.p
                  variants={childVariants}
                  className="text-[10px] md:text-xs font-bold tracking-[0.28em] uppercase text-white/40"
                >
                  {currentHeroCopy.eyebrow}
                </motion.p>

                {/* Headline — large, typographically weighted */}
                {/* Odd-indexed words are bold, matching the existing site type system */}
                <motion.h1
                  variants={childVariants}
                  className="text-[clamp(2.6rem,7vw,6rem)] font-extralight tracking-tight leading-[0.93] uppercase"
                >
                  {currentHeroCopy.headline.map((line: string, lineIdx: number) => (
                    <span key={lineIdx} className="block">
                      {line.split(" ").map((word: string, wordIdx: number) => (
                        <span
                          key={wordIdx}
                          className={wordIdx % 2 === 1 ? "font-bold" : "font-extralight"}
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </span>
                  ))}
                </motion.h1>

                {/* Divider — thin rule bridges headline and body, a structural accent */}
                <motion.div
                  variants={dividerVariants}
                  className="h-px w-24 bg-white/25"
                />

                {/* Body — firm philosophy statement */}
                <motion.p
                  variants={childVariants}
                  className="text-white/60 text-base sm:text-lg md:text-xl font-light max-w-xl leading-relaxed"
                >
                  {currentHeroCopy.body}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.62 }}
              className="flex flex-wrap items-center gap-4 mt-1"
            >
              <Link
                href={currentHeroCopy.cta1.href}
                className="group flex items-center gap-2 text-xs md:text-sm font-semibold tracking-widest uppercase bg-white text-black hover:bg-white/92 px-6 md:px-8 py-3.5 md:py-4 rounded-full hover:scale-[1.03] active:scale-[0.98]"
                style={{ transition: "background-color 200ms, transform 150ms" }}
              >
                {currentHeroCopy.cta1.label}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={currentHeroCopy.cta2.href}
                className="text-xs md:text-sm font-semibold tracking-widest uppercase border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/8 px-6 md:px-8 py-3.5 md:py-4 rounded-full transition-all duration-200 backdrop-blur-sm"
              >
                {currentHeroCopy.cta2.label}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* - Bottom bar: slide controls + current project ticker - */}
        <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-12 z-30 flex flex-col md:flex-row md:items-end justify-between gap-5">

          {/* Dot / progress nav — unchanged */}
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
        </div>
      </section>

      {/* ==========================================
          WHAT WE DO (02)
          ========================================== */}
      <section
        id="what-we-do"
        className="relative w-full bg-black py-24 md:py-32 border-t border-white/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12">
          
          {/* Section label */}
          <div className="flex items-center gap-3 mb-14">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/45 uppercase">02 / What We Do</span>
            <div className="h-px w-8 bg-white/20" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* LEFT - Services list */}
            <div className="lg:col-span-7 flex flex-col gap-0">
              <div className="mb-10 max-w-xl">
                <h2 className="text-4xl md:text-5xl font-extralight tracking-tight uppercase leading-none text-white mb-4">
                  <AnimatedText text="Our Core Services" />
                </h2>
                <p className="text-white/55 font-light text-sm md:text-base leading-relaxed">
                  We bridge the gap between design theory and tactile execution. Our range of disciplines ensures accuracy at every scale.
                </p>
              </div>

              <div className="flex flex-col border-t border-white/10">
                {SERVICES.map((service, idx) => {
                  const isActive = activeService === idx
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setActiveService(idx)}
                      className="relative py-6 border-b border-white/10 cursor-pointer group transition-all duration-300"
                    >
                      {/* Hover background highlight */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="activeServiceBg"
                            className="absolute inset-y-2 inset-x-[-12px] bg-white/[0.03] rounded-xl -z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-6 items-start">
                          {/* Service number */}
                          <span className={`text-sm font-mono tracking-widest transition-colors duration-300 mt-1 ${isActive ? "text-white" : "text-white/30"}`}>
                            {service.num}
                          </span>

                          <div className="flex flex-col gap-2">
                            {/* Service title */}
                            <h3 className={`text-xl md:text-2xl font-light uppercase tracking-wide transition-all duration-300 ${isActive ? "text-white translate-x-1" : "text-white/60"}`}>
                              {service.title.split(" ").map((w, i) => (
                                <span key={i} className={i % 2 === 1 ? "font-bold" : "font-light"}>
                                  {w}{" "}
                                </span>
                              ))}
                            </h3>

                            {/* Service description (collapsible accordion style) */}
                            <motion.div
                              initial={false}
                              animate={{
                                height: isActive ? "auto" : 0,
                                opacity: isActive ? 1 : 0,
                                marginTop: isActive ? 8 : 0,
                              }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden pr-6"
                            >
                              <p className="text-white/50 text-xs md:text-sm font-light leading-relaxed">
                                {service.desc}
                              </p>
                            </motion.div>
                          </div>
                        </div>

                        {/* Arrow icon */}
                        <div className="relative overflow-hidden w-6 h-6 flex items-center justify-center shrink-0">
                          <ArrowRight
                            className={`h-4 w-4 transition-all duration-300 ${isActive ? "translate-x-0 rotate-0 text-white" : "-translate-x-4 -rotate-45 text-white/20 group-hover:translate-x-0 group-hover:rotate-0 group-hover:text-white/50"}`}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT - Dynamic sticky visualization canvas */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 mt-8 lg:mt-0">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl group">
                
                {/* Visualizer blueprint grid background lines */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none z-10" 
                  style={{
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                />

                {/* Blueprint technical markings */}
                <div className="absolute top-4 left-4 z-20 font-mono text-[8px] text-white/30 select-none pointer-events-none uppercase tracking-widest flex flex-col gap-1">
                  <div>STUDIO SPEC // REF_002_{SERVICES[activeService].num}</div>
                  <div>SCALE: 1:25 @ A3</div>
                </div>

                <div className="absolute top-4 right-4 z-20 font-mono text-[8px] text-white/30 select-none pointer-events-none uppercase tracking-widest">
                  LOC: BIDASAR_HQ
                </div>

                <div className="absolute bottom-4 left-4 z-20 font-mono text-[8px] text-white/30 select-none pointer-events-none uppercase tracking-widest">
                  SYS: STABLE_OP_3.5
                </div>

                {/* Animated active image */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeService}
                    initial={{ opacity: 0, scale: 1.08, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {SERVICES[activeService].image && (
                      <img
                        src={SERVICES[activeService].image}
                        alt={SERVICES[activeService].title}
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* Technical crosshair overlays */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Top-left corner bracket */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/20" />
                  {/* Top-right corner bracket */}
                  <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20" />
                  {/* Bottom-left corner bracket */}
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20" />
                  {/* Bottom-right corner bracket */}
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/20" />
                </div>
              </div>

              {/* Dynamic Service details / metadata footer below the visualization */}
              <motion.div
                key={activeService}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-4"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Deliverables</span>
                  <span className="text-xs text-white/70 font-light font-mono">
                    {activeService === 0 && "2D Layouts, Site Maps"}
                    {activeService === 1 && "Exterior/Interior CGI, 4K Stills"}
                    {activeService === 2 && "Material Boards, Lighting Moods"}
                    {activeService === 3 && "Master Planning, Road Networks"}
                    {activeService === 4 && "Orientation Maps, Energy Audits"}
                    {activeService === 5 && "Structural Details, HVAC Sheets"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Execution Tools</span>
                  <span className="text-xs text-white/70 font-light font-mono">
                    {activeService === 0 && "AutoCAD, SpacePlanner"}
                    {activeService === 1 && "3ds Max, V-Ray, Corona"}
                    {activeService === 2 && "Sketchup, Photoshop, Fohn"}
                    {activeService === 3 && "ArcGIS, Civil 3D, AutoCAD"}
                    {activeService === 4 && "Vastu Compass, Solar Angles"}
                    {activeService === 5 && "Revit, AutoCAD, Tekla"}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* =
          PROJECT ARCHIVE  (unchanged)
      = */}
      <section
        id="projects"
        className="relative w-full bg-[#060606] py-24 md:py-32 border-t border-white/10"
      >
        <div className="flex flex-col">

          <div className="max-w-7xl mx-auto w-full px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: EASE_EXPO }}
              className="flex flex-col gap-4 mb-20">
              <div className="flex items-center gap-3">
                <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/45 uppercase">03 / Selected Portfolio</span>
                <div className="h-px w-8 bg-white/20" />
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-none text-white">
                <AnimatedText text="Project Archive" />
              </h2>
              <p className="text-white/55 font-light text-sm md:text-base max-w-xl leading-relaxed mt-1">
                Explore our complete collection of bespoke architectural concept renderings, interior visualizations, and high-end built designs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.1 }}
              className="flex flex-col md:flex-row gap-5 justify-between items-start md:items-center mb-16 border-b border-white/10 pb-8">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/8 focus:bg-white/8 focus:ring-1 focus:ring-white/15 border border-white/10 rounded-full text-xs md:text-sm outline-none transition-colors duration-200 placeholder:text-white/25" />
              </div>
            </motion.div>
          </div>

          <div
            className="relative w-full overflow-x-hidden"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
              maskImage: "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
            }}
          >
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
                  className="flex flex-col items-center gap-4 py-24 text-center max-w-7xl mx-auto">
                  <Layers className="h-9 w-9 text-white/25" />
                  <p className="text-white/40 font-light text-sm">No projects match those filters.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* =
          ABOUT THE STUDIO
      = */}
      <section
        ref={aboutStudioRef}
        id="about-studio"
        className="relative w-full bg-[#060606] py-24 md:py-32 border-t border-white/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12">

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.05 }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            className="flex items-center gap-3 mb-14"
          >
            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/45 uppercase">04 / Who We Are</span>
            <div className="h-px w-8 bg-white/20" />
          </motion.div>

          {/* Two-column layout: photo left (larger col-span), content right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* LEFT — parallax photo (Col-span 7 for a wider, more massive image) */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: -60, scale: 0.96 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.05 }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                className="w-full h-full"
              >
                <motion.div
                  ref={studioCardRef}
                  onMouseMove={handleStudioMove}
                  onMouseLeave={handleStudioLeave}
                  whileHover="hover"
                  initial="rest"
                  className="relative overflow-hidden rounded-2xl border border-white/10 cursor-pointer group w-full"
                  style={{ height: "clamp(540px, 64vw, 760px)" }}
                >
                  <motion.div
                    className="absolute inset-[-14%] bg-cover bg-center"
                    style={{
                      backgroundImage: "url('/website_stock_images/office.jpg')",
                      x: studioMouseBgX,
                      y: finalStudioPhotoY,
                      willChange: "transform",
                    }}
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
                    transition={{ duration: 0.7, ease: EASE_EXPO }}
                  />
                  {/* Subtle dark vignette at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                  
                  {/* Hover Darken overlay */}
                  <motion.div
                    className="absolute inset-0 bg-black/15 z-10"
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                    transition={{ duration: 0.35 }}
                  />

                  {/* Floating location badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.4 }}
                    className="absolute bottom-5 left-5 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 z-20"
                  >
                    <MapPinned className="h-3.5 w-3.5 text-white/50 shrink-0" />
                    <span className="text-[10px] font-light text-white/70 tracking-wider">Bidasar, Rajasthan — Studio HQ</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* RIGHT — copy + stats (Col-span 5) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.1 }}
              className="lg:col-span-5 flex flex-col gap-8"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-tight uppercase leading-tight text-white">
                <AnimatedText text="Rooted in Rajasthan. Designing for the World." />
              </h2>

              <p className="text-white/65 font-light text-sm md:text-base leading-relaxed">
                Founded from the architectural heritage of Rajasthan, our studio in Bidasar is where computational design, light study, and material honesty converge. We work directly with clients from sketch to final handover, ensuring every space is crafted with precision, honesty, and execution-ready detail.
              </p>

              {/* Stats grid — proof, not decoration */}
              <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden mt-2">
                {STUDIO_STATS.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ type: "spring", stiffness: 60, damping: 13, delay: 0.2 + idx * 0.08 }}
                    className="flex flex-col gap-1 p-5 bg-[#0d0d0d]"
                  >
                    <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                    <span className="text-[10px] font-light text-white/45 uppercase tracking-[0.15em]">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              <Link
                href="/about"
                className="group self-start inline-flex items-center gap-3 text-xs font-semibold tracking-widest uppercase border border-white/20 text-white hover:border-white/50 bg-white/5 hover:bg-white/10 px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Full Studio Story</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          WORK SHOWCASE (Curved Infinite Marquee Gallery)
          ========================================== */}
      <section
        id="work-showcase"
        className="relative w-full bg-black py-24 md:py-32 border-t border-white/10 overflow-hidden"
      >
        {/* Centered Heading */}
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight uppercase leading-none text-white">
            <AnimatedText text="Work Showcase" />
          </h2>
        </div>

        {/* Curved Infinite Marquee Gallery (Right to Left) */}
        <div
          className="relative w-full overflow-hidden py-16 pointer-events-auto"
          style={{
            perspective: "800px", // Exaggerates 3D depth to make the curve more visible
            transformStyle: "preserve-3d",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <motion.div
            style={{
              display: "flex",
              gap: "2.5rem",
              width: "max-content",
              transformStyle: "preserve-3d",
              transform: "rotateX(-12.5deg) rotateY(-4deg)", // Tilts the 3D plane significantly to curve the horizontal slide visually
            }}
            animate={{ x: [0, -100 / 3 + "%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 45, // steady speed
                ease: "linear",
              },
            }}
          >
            {[...SHOWCASE_ITEMS, ...SHOWCASE_ITEMS, ...SHOWCASE_ITEMS].map((service, idx) => (
              <ServiceImageCard key={idx} service={service} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          HOW WE DO (05)
          ========================================== */}
      <section
        id="how-we-do"
        className="relative w-full bg-black py-24 md:py-32 border-t border-white/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-16">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_EXPO }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/45 uppercase">05 / How We Do</span>
              <div className="h-px w-8 bg-white/20" />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight uppercase leading-none text-white">
              <AnimatedText text="The Studio Process" />
            </h2>
            <p className="text-white/55 font-light text-sm md:text-base max-w-xl leading-relaxed mt-1">
              From solar paths and local clay brick analysis to detailed execution plans.
            </p>
          </motion.div>

          <div className="flex flex-col border-t border-white/10">
            {[
              { num: "01", step: "Ideation & Spatial Study", body: "Analyzing solar paths, wind directions, structural boundaries, and client needs — refined into simple floor study drafts." },
              { num: "02", step: "3D Visualization", body: "Drafts are modeled in 3D. We iterate light maps, physical textures, and raw materials digitally until the space feels alive." },
              { num: "03", step: "Technical Blueprinting", body: "Detailed working plans, engineering blueprints, material catalogues, and scheduling specs are locked for construction." },
              { num: "04", step: "Supervision & Handover", body: "We consult with execution and masonry teams, ensuring details are crafted correctly until keys change hands." }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: EASE_EXPO, delay: idx * 0.08 }}
                className="group flex flex-col md:flex-row justify-between items-start md:items-center py-8 border-b border-white/10 hover:bg-white/[0.02] px-4 md:px-8 transition-colors duration-300"
              >
                <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto">
                  <span className="text-3xl md:text-4xl font-extralight text-white/20 font-mono tracking-wider group-hover:text-white/55 transition-colors duration-300 w-16">
                    {item.num}
                  </span>
                  <h3 className="text-lg md:text-xl font-light uppercase tracking-wide text-white/70 group-hover:text-white transition-colors duration-300">
                    {item.step}
                  </h3>
                </div>
                <p className="text-white/50 text-xs md:text-sm font-light leading-relaxed max-w-lg mt-3 md:mt-0 md:ml-12">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="relative w-full bg-[#060606] pt-24 pb-16 border-t border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-6 flex flex-col gap-6">
              <span className="font-bold text-sm md:text-base tracking-[0.2em] text-white uppercase">
                JR SUTHAR & DESIGNS
              </span>
              <p className="text-white/55 font-light text-xs md:text-sm leading-relaxed max-w-sm">
                Architectural visualization, planning, and bespoke design studio. We shape materials and light to craft environments that harmonize with their surroundings.
              </p>
            </div>

            <div className="md:col-span-3 flex flex-col gap-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">Navigation</span>
              <ul className="flex flex-col gap-2.5 text-xs font-light">
                <li>
                  <Link href="/" className="text-white/55 hover:text-white transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#projects" className="text-white/55 hover:text-white transition-colors duration-200">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-white/55 hover:text-white transition-colors duration-200">
                    About Studio
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/55 hover:text-white transition-colors duration-200">
                    Inquire & Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 flex flex-col gap-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">Studio Office</span>
              <ul className="flex flex-col gap-2.5 text-xs font-light">
                <li className="text-white/55">
                  Bidasar, Rajasthan, India
                </li>
                <li>
                  <a href="mailto:info@jrsuthar.com" className="text-white/55 hover:text-white transition-colors duration-200">
                    info@jrsuthar.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919876543210" className="text-white/55 hover:text-white transition-colors duration-200">
                    +91 98765 43210
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/10 pt-8 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <span>© {new Date().getFullYear()} JR SUTHAR & DESIGNS.</span>
            <span>Crafting built realities</span>
          </div>
        </div>
      </footer>
      <JRSutharWatermark />
    </div>
  )
}

// - Easing Curves -
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4)
const easeInQuart = (x: number) => Math.pow(x, 4)
const linear = (x: number) => x

// - Project Row -

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
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.28, 0.45, 0.55, 0.72, 0.85, 1],
    [0.1, 0.1, 0.55, 1, 1, 0.55, 0.1, 0.1],
    { ease: [linear, easeOutQuart, easeOutQuart, linear, easeInQuart, easeInQuart, linear] }
  )
  const scale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.55, 0.85, 1],
    [0.94, 0.94, 1, 1, 0.94, 0.94],
    { ease: [linear, easeOutQuart, linear, easeInQuart, linear] }
  )
  const leftColX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.55, 0.85, 1],
    ["-45%", "-45%", "0%", "0%", "-45%", "-45%"],
    { ease: [linear, easeOutQuart, linear, easeInQuart, linear] }
  )
  const rightColX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.55, 0.85, 1],
    ["45%", "45%", "0%", "0%", "45%", "45%"],
    { ease: [linear, easeOutQuart, linear, easeInQuart, linear] }
  )

  return (
    <motion.div
      ref={rowRef}
      style={{ opacity, scale, willChange: "transform, opacity" }}
      className="relative grid grid-cols-1 md:grid-cols-[1fr_64px_1fr] items-center gap-0 py-14 md:py-20"
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

// - Photo Card -

const MotionCard = motion.create(Card)

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
    <MotionCard
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative overflow-hidden rounded-3xl bg-[#0d0d0d] border border-white/10 p-0 ring-0 shadow-none"
      style={{ height: 460 }}
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

      <motion.div
        className="absolute inset-0 z-20 flex flex-col justify-end p-8"
        variants={{ rest: { y: 0 }, hover: { y: -8 } }}
        transition={{ duration: 0.45, ease: EASE_EXPO }}
      >
        <CardHeader className="p-0 gap-0 space-y-0 mb-2 border-b-0">
          <CardDescription className="text-[9px] font-bold tracking-[0.24em] uppercase text-white/35 block border-0 p-0 mb-1">
            <motion.span
              className="block overflow-hidden"
              variants={{ rest: { opacity: 0, height: 0 }, hover: { opacity: 0.45, height: "auto" } }}
              transition={{ duration: 0.3 }}
            >
              {project.category} &nbsp;·&nbsp; {project.year}
            </motion.span>
          </CardDescription>
          <CardTitle className="text-3xl font-light tracking-wide text-white uppercase leading-tight p-0 m-0 border-0">
            {project.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 border-0">
          <motion.div
            variants={{ rest: { opacity: 0, height: 0, y: 8 }, hover: { opacity: 1, height: "auto", y: 0 } }}
            transition={{ duration: 0.4, ease: EASE_EXPO }}
            style={{ overflow: "hidden" }}
            className="flex flex-col gap-4"
          >
            <p className="text-white/60 text-xs font-light leading-relaxed max-w-sm">
              {project.description}
            </p>
            <CardFooter className="flex items-center justify-between pt-3 border-t border-white/10 p-0">
              <span className="flex items-center gap-1.5 text-[10px] font-light text-white/40">
                <MapPin className="h-3 w-3 shrink-0" />
                {project.location}
              </span>
              <Link href={`/projects/${project.slug}`}
                className="flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-white/80 hover:text-white transition-colors"
                onClick={e => e.stopPropagation()}>
                Explore <ArrowRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          </motion.div>
        </CardContent>
      </motion.div>
    </MotionCard>
  )
}

// - Office Photo Card -

function OfficePhotoCard({ image }: { image: string }) {
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
    <MotionCard
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative overflow-hidden rounded-3xl bg-[#0d0d0d] border border-white/10 p-0 ring-0 shadow-none w-full"
      style={{ height: 600 }}
      whileHover="hover"
      initial="rest"
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-[-4%] bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')`, x: bgX, y: bgY, willChange: "transform" }}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
          transition={{ duration: 0.7, ease: EASE_EXPO }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
      <motion.div
        className="absolute inset-0 bg-black/10 z-10"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: 0.35 }}
      />
    </MotionCard>
  )
}

// - Animated Text Component -

function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ")
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  }
  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 14,
        stiffness: 110,
      },
    },
    hidden: {
      opacity: 0,
      y: 15,
      filter: "blur(4px)",
      transition: {
        type: "spring",
        damping: 14,
        stiffness: 110,
      },
    },
  }

  return (
    <motion.span
      style={{ display: "inline-block", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          style={{ display: "inline-block", marginRight: "0.25em" }}
          key={index}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

// - Service Image Card -

function ServiceImageCard({ service }: { service: { image: string; title: string; desc: string; num?: string; icon?: string } }) {
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
    <Magnetic className="shrink-0">
      <MotionCard
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="group relative overflow-hidden rounded-3xl bg-[#0d0d0d] border border-white/10 p-0 ring-0 shadow-none"
        style={{ height: "min(600px, 58vw)", width: "min(960px, 90vw)" }}
        whileHover="hover"
        initial="rest"
      >
        <div className="absolute inset-0 overflow-hidden">
          {service.image && (
            <motion.div
              className="absolute inset-[-4%] bg-cover bg-center"
              style={{ backgroundImage: `url('${service.image}')`, x: bgX, y: bgY, willChange: "transform" }}
              variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
              transition={{ duration: 0.7, ease: EASE_EXPO }}
            />
          )}
        </div>

        {/* Dark overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10" />
        <motion.div
          className="absolute inset-0 bg-black/20 z-10"
          variants={{ rest: { opacity: 0.1 }, hover: { opacity: 0 } }}
          transition={{ duration: 0.35 }}
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 select-none">
          {/* Bottom content */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-2xl font-light tracking-wide text-white uppercase leading-tight">
              {service.title.split(" ").map((w, i) => (
                <span key={i} className={i % 2 === 1 ? "font-bold" : "font-light"}>
                  {w}{" "}
                </span>
              ))}
            </h3>
            <p className="text-white/50 text-xs font-light leading-relaxed max-w-lg group-hover:text-white/85 transition-colors duration-300">
              {service.desc}
            </p>
          </div>
        </div>
      </MotionCard>
    </Magnetic>
  )
}

// - Magnetic Wrapper -

function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 18 })
  const sy = useSpring(y, { stiffness: 180, damping: 18 })

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * 0.07)
        y.set((e.clientY - r.top - r.height / 2) * 0.07)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// - Discipline Card -

function DisciplineCard({ item, i }: { item: { num: string; icon?: string; title: string; desc: string }; i: number }) {
  return (
    <Magnetic>
      <motion.div
        initial="rest"
        whileHover="hover"
        animate="rest"
        className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-950 p-7 flex flex-col gap-0 cursor-default min-h-[240px] w-full"
      >
        {/* Ghost numeral */}
        <span className="absolute -right-3 -bottom-6 text-[110px] font-black leading-none text-white/[0.025] select-none pointer-events-none transition-all duration-700 group-hover:text-white/[0.055]">
          {item.num}
        </span>

        {/* Number tag & Icon */}
        <div className="flex justify-between items-center mb-6 w-full">
          <span className="text-[9px] font-mono tracking-[0.3em] text-white/20">{item.num}</span>
          {item.icon && (
            <span className="text-lg select-none leading-none opacity-70 group-hover:opacity-100 transition-opacity duration-300">
              {item.icon}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold uppercase tracking-wide leading-tight text-white whitespace-pre-line mb-0">
          {item.title}
        </h3>

        {/* Body — hidden by default, slides up on hover */}
        <div className="overflow-hidden">
          <motion.p
            className="text-xs font-light text-white/40 leading-relaxed mt-4"
            variants={{
              rest: { y: "100%", opacity: 0 },
              hover: { y: "0%", opacity: 1 }
            }}
            transition={{ duration: 0.45, ease: EASE_EXPO }}
          >
            {item.desc}
          </motion.p>
        </div>

        {/* Bottom line reveal on hover */}
        <motion.div
          className="absolute bottom-0 left-0 h-[1.5px] bg-white origin-left w-full"
          variants={{
            rest: { scaleX: 0 },
            hover: { scaleX: 1 }
          }}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
        />
      </motion.div>
    </Magnetic>
  )
}

// - Art Card -

function ArtCard({ project, artPaths }: { project: Project; artPaths: string }) {
  const [hovered, setHovered] = useState(false)
  const paths = artPaths.trim().split("\n").map(p => p.trim()).filter(Boolean)

  return (
    <MotionCard
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d] p-0 ring-0 shadow-none"
      style={{ height: 460 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ borderColor: "rgba(255,255,255,0.18)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)" }} />

      <div className="relative h-full flex flex-col md:flex-row">

        <div className="flex flex-col justify-between p-8 md:w-[42%] shrink-0 border-r border-white/10">
          <CardHeader className="p-0 gap-0 space-y-0">
            <CardDescription className="text-[9px] font-bold tracking-[0.24em] text-white/35 uppercase block mb-6 border-0 p-0">
              {project.category} &nbsp;·&nbsp; {project.year}
            </CardDescription>
            <CardTitle className="text-2xl font-light tracking-wide text-white uppercase leading-tight p-0 m-0 border-0">
              {project.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex flex-col gap-6 mt-6 border-0">
            <p className="text-white/50 text-[11px] font-light leading-relaxed">
              {project.subtitle}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-white/35">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{project.location}</span>
            </div>
            <CardFooter className="p-0 border-0">
              <Link href={`/projects/${project.slug}`}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-white/55 hover:text-white transition-colors duration-200">
                View Project <ArrowRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          </CardContent>
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
    </MotionCard>
  )
}

// - Art Path -

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

// ─── Watermark ─────────────────────────────────────────────────────────────────

function JRSutharWatermark() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scaleX, setScaleX] = useState(1)

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const available = container.clientWidth * 0.96 // account for 2vw padding each side
      // Measure natural text width at base font size
      const span = container.querySelector("span[data-measure]") as HTMLElement
      if (span) {
        const natural = span.scrollWidth
        setScaleX(available / natural)
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        background: "#060606",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        paddingTop: "1vw",
        paddingBottom: "2.5vw",
        paddingLeft: "2vw",
        paddingRight: "2vw",
      }}
    >
      {/* Fade from page bg into watermark from the top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          background: "linear-gradient(to bottom, #060606 0%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Hidden span to measure natural text width */}
      <span
        data-measure="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "13vw",
          fontWeight: 900,
          letterSpacing: "-0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        JR SUTHAR & DESIGNS
      </span>

      <motion.div
        initial={{ y: "90px", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        exit={{ y: "90px", opacity: 0 }}
        viewport={{ once: false, amount: 0.05 }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transformOrigin: "bottom center",
          zIndex: 1,
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: "13vw",
            fontWeight: 900,
            letterSpacing: "-0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: "#1e1e1e",
            transformOrigin: "left center",
            transform: `scaleX(${scaleX}) scaleY(1.3)`,
            lineHeight: 0.95,
          }}
        >
          JR SUTHAR & DESIGNS
        </span>
      </motion.div>
    </div>
  )
}