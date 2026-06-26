"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

interface ProjectSlide {
  id: number
  image: string
  title: string
  subtitle: string
  category: string
  location: string
}

const PROJECTS: ProjectSlide[] = [
  {
    id: 1,
    image: "/website_stock_images/pexels-aksinfo7-31387268.jpg",
    title: "The Glass Pavilion",
    subtitle: "Minimalist woodland retreat merging nature and modern structure.",
    category: "Residential Architecture",
    location: "Portland, Oregon",
  },
  {
    id: 2,
    image: "/website_stock_images/pexels-ahmetcotur-27626177.jpg",
    title: "Vapor Residence",
    subtitle: "Brutalist concrete architecture softened by lighting and water elements.",
    category: "Luxury Living",
    location: "Kyoto, Japan",
  },
  {
    id: 3,
    image: "/website_stock_images/pexels-ahmetcotur-31817155.jpg",
    title: "Luminous Penthouse",
    subtitle: "High-end interior visualization showcasing light-flooded spaces.",
    category: "Interior Design",
    location: "New York, USA",
  },
  {
    id: 4,
    image: "/website_stock_images/pexels-abid-ali-150086727-10647324.jpg",
    title: "Desert Oasis Villa",
    subtitle: "Stunning desert retreat using organic materials and expansive glass facades.",
    category: "Sustainable Villa",
    location: "Sonoran Desert, AZ",
  },
  {
    id: 5,
    image: "/website_stock_images/pexels-ahmetcotur-27626174.jpg",
    title: "Monolithic Museum",
    subtitle: "Sleek sculptural architecture designed to redefine public spaces.",
    category: "Commercial Concept",
    location: "Berlin, Germany",
  },
  {
    id: 6,
    image: "/website_stock_images/pexels-ahmetcotur-28054849.jpg",
    title: "Coastal Sanctuary",
    subtitle: "Bespoke oceanfront luxury living crafted with natural materials.",
    category: "Private Residence",
    location: "Malibu, California",
  },
  {
    id: 7,
    image: "/website_stock_images/pexels-keeganjchecks-12715585.jpg",
    title: "Urban High-Rise",
    subtitle: "Cutting-edge commercial tower facade blending aesthetics and sustainability.",
    category: "Urban Development",
    location: "London, UK",
  },
]

const SLIDE_DURATION = 6000 // 6 seconds

export default function PublicHomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Reset and restart autoplay timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = Date.now()
    setProgress(0)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed >= SLIDE_DURATION) {
        setActiveIndex((prev) => (prev + 1) % PROJECTS.length)
        startTimeRef.current = Date.now()
        setProgress(0)
      } else {
        setProgress((elapsed / SLIDE_DURATION) * 100)
      }
    }, 50)
  }

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeIndex])

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % PROJECTS.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length)
  }

  const handleSelect = (idx: number) => {
    setActiveIndex(idx)
  }

  const currentProject = PROJECTS[activeIndex]

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Background Slideshow */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000, ease: "linear" },
            }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${currentProject.image}')` }}
          />
        </AnimatePresence>
        {/* Soft elegant gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 container mx-auto px-6 md:px-12 w-full h-full flex flex-col justify-center min-h-screen pt-24 pb-20">
        <div className="max-w-3xl flex flex-col gap-6 md:gap-8">
          {/* Tagline / Category */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`cat-${activeIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-3 text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-white/60"
            >
              <span>{currentProject.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{currentProject.location}</span>
            </motion.div>
          </AnimatePresence>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${activeIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none uppercase"
            >
              {currentProject.title.split(" ").map((word, i) => (
                <span key={i} className={i % 2 === 1 ? "font-bold block mt-1" : "font-extralight"}>
                  {word}{" "}
                </span>
              ))}
            </motion.h1>
          </AnimatePresence>

          {/* Subtitle */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-white/70 text-base sm:text-lg md:text-xl font-light max-w-xl leading-relaxed"
            >
              {currentProject.subtitle}
            </motion.p>
          </AnimatePresence>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-4 mt-4"
          >
            <Link
              href="/projects"
              className="group flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wider uppercase bg-white text-black hover:bg-white/90 px-6 md:px-8 py-3.5 md:py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-white/10 hover:scale-105"
            >
              Explore Portfolio
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="text-xs md:text-sm font-semibold tracking-wider uppercase border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 px-6 md:px-8 py-3.5 md:py-4 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              Inquire
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Control Navigation - Progress & Numbers */}
      <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-12 z-30 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Navigation Indicators with Progress Bar */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {PROJECTS.map((project, idx) => (
            <button
              key={project.id}
              onClick={() => handleSelect(idx)}
              className="group relative flex items-center justify-center py-4 cursor-pointer"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div className="flex flex-col gap-1">
                {/* Horizontal Bar */}
                <div className="h-[2px] w-8 sm:w-12 bg-white/20 overflow-hidden relative transition-colors group-hover:bg-white/40">
                  {idx === activeIndex && (
                    <motion.div
                      className="absolute top-0 left-0 bottom-0 bg-white"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[10px] font-mono tracking-wider transition-colors duration-300 ${
                    idx === activeIndex ? "text-white" : "text-white/40 group-hover:text-white/60"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 hover:border-white/40 bg-black/20 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
            aria-label="Previous Project"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 hover:border-white/40 bg-black/20 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
            aria-label="Next Project"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
