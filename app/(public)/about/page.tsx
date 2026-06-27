"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { Compass, Eye, Feather, MessageSquare, ArrowRight, UserCheck, GraduationCap, Award, Briefcase, FileText } from "lucide-react"

// Stagger variant for container scroll triggers
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Fade up text items
const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 70,
      damping: 15,
      duration: 0.6,
    },
  },
}

// Left column container staggers
const leftStaggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

// Right column image reveal
const imageRevealVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 50,
      damping: 14,
      duration: 0.8,
    },
  },
}

// Pillar card animations
const pillarVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 60,
      damping: 14,
      duration: 0.7,
    },
  },
}

// Process steps entry (slide in from left)
const stepVariants = {
  hidden: { opacity: 0, x: -30, y: 10 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 70,
      damping: 15,
      duration: 0.6,
    },
  },
}

// Footer callout banner entry
const calloutVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 50,
      damping: 15,
      duration: 0.8,
    },
  },
}

const PILLARS = [
  {
    icon: Compass,
    title: "Spatial Intelligence",
    description: "Every line drawn serves a functional intent. We maximize natural airflows, daylight paths, and ergonomic efficiencies within minimalist shells.",
  },
  {
    icon: Eye,
    title: "Cinematic Visualization",
    description: "High-fidelity photorealistic rendering is our second language. We iterate with materials, lighting configurations, and layouts in digital space first.",
  },
  {
    icon: Feather,
    title: "Material Authenticity",
    description: "We lean heavily into raw honesty: board-formed concrete, textured local clay, warm timber grains, and slate stone. True textures need no decoration.",
  },
  {
    icon: MessageSquare,
    title: "Process Transparency",
    description: "Supported by our dedicated portfolio tracking and CRM workspaces, clients remain aligned on specifications, scope adjustments, and progress facts.",
  },
]

const PROCESS_STEPS = [
  {
    num: "01",
    phase: "Ideation & Spatial Study",
    description: "We analyze site solar paths, wind direction, structural boundaries, and client functional requirements. This results in fundamental floor layouts.",
  },
  {
    num: "02",
    phase: "3D Visualization",
    description: "We translate layouts into 3D environments. We experiment with physical materials, interior specifications, and custom light maps to refine the spaces.",
  },
  {
    num: "03",
    phase: "Technical Blueprinting",
    description: "Once visuals are locked, we generate meticulous architectural working drawings, material catalogs, and scheduling documents for construction teams.",
  },
  {
    num: "04",
    phase: "Curation & Handover",
    description: "Throughout construction, we review structural details and resolve scope adjustments transparently until keys are handed over.",
  },
]

const DESIGNER_TABS = ["Education", "Software Skills", "Strengths"]

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("Education")

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-32 pb-20 overflow-x-hidden">
      
      {/* 1. Hero / Split-Screen Story Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-28">
        
        {/* Left Column Story */}
        <motion.div 
          variants={leftStaggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="lg:col-span-7 flex flex-col gap-6 md:gap-8"
        >
          <motion.span variants={fadeUpVariants} className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/50 uppercase">
            Our Identity
          </motion.span>
          <motion.h1 variants={fadeUpVariants} className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-none">
            Jr Suthar <span className="font-bold block">& Designs</span>
          </motion.h1>
          <motion.div variants={fadeUpVariants} className="h-[2px] w-16 bg-white/20" />
          <motion.p variants={fadeUpVariants} className="text-white/80 font-light text-base md:text-lg leading-relaxed max-w-xl">
            We are an architectural design, visualization, and drafting studio based in Rajasthan, India. Led by Ramesh Suthar, our practice is dedicated to sculpting space, structural details, and photorealistic lighting into beautiful, built realities.
          </motion.p>
          <motion.p variants={fadeUpVariants} className="text-white/60 font-light text-sm md:text-base leading-relaxed max-w-xl">
            Supported by Narayani Traders' project supply structures, we provide end-to-end design coordination: combining raw structural honesty with absolute material sourcing transparency.
          </motion.p>
        </motion.div>

        {/* Right Column Image */}
        <motion.div 
          variants={imageRevealVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="lg:col-span-5 relative h-[350px] md:h-[480px] w-full rounded-2xl overflow-hidden border border-white/10 group bg-zinc-950"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
            style={{ backgroundImage: `url('/website_stock_images/pexels-ahmetcotur-27626177.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
              STUDIO INTERIOR CONCEPT
            </span>
          </div>
        </motion.div>

      </div>

      {/* 2. Designer Profile Section (Ramesh Suthar) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-32">
        <div className="flex flex-col gap-4 mb-16 text-center md:text-left">
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">
            The Visionary
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight uppercase leading-none">
            Ramesh <span className="font-bold">Suthar</span>
          </h2>
          <p className="text-white/40 text-xs md:text-sm font-light">
            Lead Architect, Visualizer & Director of Jr Suthar & Designs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Profile Photo Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className="lg:col-span-4 flex flex-col items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border border-white/20 bg-zinc-950 group">
              {/* Profile Image (points to /ramesh.jpg, with elegant fallback) */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
                style={{ 
                  backgroundImage: "url('/ramesh.jpg')", 
                  // If image is missing, it will display the initials layout below
                }}
              />
              {/* Fallback Display if image file is not found yet */}
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/5 group-hover:bg-zinc-800 transition-colors">
                <span className="text-4xl font-extralight tracking-widest text-white/30">RS</span>
              </div>
            </div>

            <div className="text-center flex flex-col gap-1.5">
              <span className="text-xl font-medium tracking-wide">Ramesh Suthar</span>
              <span className="text-xs font-light text-white/50 uppercase tracking-widest">Lead Architect</span>
              <span className="text-[10px] text-white/40 font-mono">Bidasar, Rajasthan, India</span>
            </div>

            <div className="w-full h-[1px] bg-white/5 my-2" />

            {/* Resume Button */}
            <a
              href="/resume.pdf"
              target="_blank"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white text-black hover:bg-white/90 py-3.5 rounded-full transition-all duration-300 active:scale-98 shadow-md hover:scale-102"
            >
              <FileText className="h-4 w-4" />
              View Resume
            </a>
          </motion.div>

          {/* Details & Tabs Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.15 }}
            className="lg:col-span-8 p-6 md:p-8 rounded-3xl bg-zinc-950 border border-white/5 min-h-[380px] flex flex-col gap-8"
          >
            {/* Tab Toggles */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
              {DESIGNER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 text-xs md:text-sm font-light rounded-full transition-all duration-300 cursor-pointer ${
                    activeTab === tab ? "text-black z-10 font-medium" : "text-white/60 hover:text-white"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeDesignerTab"
                      className="absolute inset-0 bg-white rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {activeTab === "Education" && (
                  <motion.div
                    key="education"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium tracking-wide text-white uppercase">Master's Degree</span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full font-mono text-white/80">2018–19</span>
                        </div>
                        <p className="text-xs font-light text-white/50">Post-graduate study specializing in Advanced Computational Architecture & Spatial Curation.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium tracking-wide text-white uppercase">Bachelor's Degree</span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full font-mono text-white/80">2014–19</span>
                        </div>
                        <p className="text-xs font-light text-white/50">Comprehensive studies in spatial planning, architectural detailing, structural systems, and landscaping.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium tracking-wide text-white uppercase">High School Certificate</span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full font-mono text-white/80">2010–14</span>
                        </div>
                        <p className="text-xs font-light text-white/50">Secondary education centered on science, high mathematics, and technical drafting foundations.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "Software Skills" && (
                  <motion.div
                    key="software"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-5 w-full justify-center"
                  >
                    {/* Skill 1 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider">
                        <span>Revit</span>
                        <span className="text-white/60 font-mono">Expert (95%)</span>
                      </div>
                      <div className="h-[4px] w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "95%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-white"
                        />
                      </div>
                    </div>

                    {/* Skill 2 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider">
                        <span>ArchiCAD</span>
                        <span className="text-white/60 font-mono">Intermediate (80%)</span>
                      </div>
                      <div className="h-[4px] w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "80%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-white/80"
                        />
                      </div>
                    </div>

                    {/* Skill 3 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider">
                        <span>Adobe Creative Suite</span>
                        <span className="text-white/60 font-mono">Intermediate (75%)</span>
                      </div>
                      <div className="h-[4px] w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "75%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-white/65"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "Strengths" && (
                  <motion.div
                    key="strengths"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {[
                      "Passion for design",
                      "3D rendering & lighting",
                      "Attention to detail",
                      "Problem solving",
                      "Critical thinking",
                      "Project management",
                    ].map((strength, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-colors">
                        <Briefcase className="h-4 w-4 text-white/50 shrink-0" />
                        <span className="text-xs md:text-sm font-light text-white/80">{strength}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 3. Core Pillars Section */}
      <div className="bg-[#0a0a0a] border-y border-white/5 py-24 mb-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center gap-16">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full text-center max-w-xl flex flex-col gap-4"
          >
            <span className="text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
              Foundational Focus
            </span>
            <h2 className="text-3xl md:text-4xl font-light tracking-wide uppercase">
              Our Core Pillars
            </h2>
            <p className="text-white/50 text-xs md:text-sm font-light leading-relaxed">
              Every detail is engineered to blend high-fidelity visuals with clear communication systems.
            </p>
          </motion.div>

          {/* Pillars Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{ perspective: 1000 }}
          >
            {PILLARS.map((pillar, idx) => (
              <motion.div
                key={idx}
                variants={pillarVariants}
                className="group relative p-6 md:p-8 rounded-2xl bg-zinc-950/50 hover:bg-zinc-950 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col gap-5 hover:translate-y-[-6px] hover:shadow-2xl hover:shadow-black/40"
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 group-hover:bg-white text-white/70 group-hover:text-black flex items-center justify-center transition-all duration-300">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-light tracking-wide text-white uppercase mt-2">
                  {pillar.title}
                </h3>
                <p className="text-white/50 font-light text-xs md:text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 4. The Design Process Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-28 flex flex-col gap-16">
        
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8"
        >
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase">
              How We Work
            </span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight uppercase">
              The Studio <span className="font-bold">Process</span>
            </h2>
          </div>
          <p className="text-white/50 font-light text-xs md:text-sm max-w-md leading-relaxed">
            From initial structural parameters to physical materials styling, our workflow is structured to guarantee execution integrity.
          </p>
        </motion.div>

        {/* Process Steps Stagger */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {PROCESS_STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              variants={stepVariants}
              className="flex flex-col gap-4 border-l border-white/10 pl-6 relative group"
            >
              {/* Highlight number */}
              <span className="text-3xl md:text-4xl font-bold tracking-tight text-white/10 group-hover:text-white/30 transition-colors duration-300">
                {step.num}
              </span>
              <h3 className="text-base md:text-lg font-semibold tracking-wide text-white uppercase group-hover:text-white transition-colors duration-300">
                {step.phase}
              </h3>
              <p className="text-white/50 font-light text-xs md:text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 5. Large Philosophy Quote Callout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          variants={calloutVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="relative w-full py-16 md:py-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-12"
        >
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-white/50" />
              Philosophy in Action
            </span>
            <p className="text-white/90 font-light italic text-base md:text-2xl leading-relaxed">
              "We believe that a built space should not fight its environment. Light should not just illuminate a room; it should compose its texture."
            </p>
            <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase mt-2">
              &mdash; Ramesh Suthar, Jr Suthar & Designs
            </span>
          </div>

          <Link
            href="/contact"
            className="group flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wider uppercase bg-white text-black hover:bg-white/90 px-6 md:px-8 py-3.5 md:py-4 rounded-full transition-all duration-300 shadow-lg hover:scale-105 shrink-0"
          >
            Start a Consultation
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

    </div>
  )
}
