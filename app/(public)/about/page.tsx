"use client"

import { useRef } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "motion/react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react"

/* ─── EASING ─────────────────────────────────────────── */
const EXPO = [0.76, 0, 0.24, 1] as const
const OVERSHOOT = [0.34, 1.56, 0.64, 1] as const

/* ─── DATA ───────────────────────────────────────────── */
const PILLARS = [
  { num: "01", title: "Spatial\nIntelligence",   body: "Every line serves functional intent — maximizing airflows, daylight paths, and ergonomic efficiency within minimalist shells." },
  { num: "02", title: "Cinematic\nVisualization", body: "High-fidelity photorealistic rendering is our second language. We iterate in digital space before a single wall is raised." },
  { num: "03", title: "Material\nAuthenticity",   body: "Board-formed concrete, local clay, warm timber, slate stone. True textures need no decoration." },
  { num: "04", title: "Process\nTransparency",    body: "Clients stay aligned on specifications and scope adjustments through our dedicated tracking workspace." },
]

const PROCESS = [
  { num: "01", phase: "Ideation & Spatial Study",  body: "Site solar paths, wind direction, structural boundaries, client requirements — distilled into fundamental floor layouts." },
  { num: "02", phase: "3D Visualization",           body: "Layouts enter 3D. Materials, light maps, and interior specs are iterated in digital space until the spaces breathe." },
  { num: "03", phase: "Technical Blueprinting",     body: "Architectural working drawings, material catalogs, scheduling documents — every dimension locked for construction teams." },
  { num: "04", phase: "Curation & Handover",        body: "Structural reviews and scope refinements continue transparently through construction, until keys change hands." },
]

const MARQUEE = ["Spatial Intelligence","Material Honesty","Cinematic Renders","Structural Clarity","Rajasthan","Bidasar Studio","Architectural Drafting","3D Visualization"]

const DISCIPLINES = ["Architectural Design","Photorealistic Rendering","Technical Drafting","Spatial Planning","Material Sourcing","Site Analysis"]

/* ─── CHAR REVEAL ────────────────────────────────────── */
function CharReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.028,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <span className={`inline-block overflow-hidden leading-none ${className}`}>
      <motion.span
        className="inline-flex"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {text.split("").map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
            variants={{
              hidden: { y: "105%", opacity: 0 },
              show: {
                y: "0%",
                opacity: 1,
                transition: { duration: 0.65, ease: EXPO, delay: delay + i * stagger },
              },
            }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.span>
    </span>
  )
}

/* ─── LINE REVEAL (thin elements) ────────────────────── */
function LineReveal({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  return (
    <motion.div
      className={`h-px bg-white/15 origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: EXPO, delay }}
    />
  )
}

/* ─── FADE LINE (paragraph) ─────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: EXPO, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── MAGNETIC ───────────────────────────────────────── */
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
        const r = ref.current!.getBoundingClientRect()
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

/* ─── MARQUEE ────────────────────────────────────────── */
function Marquee() {
  const double = [...MARQUEE, ...MARQUEE]
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] py-3.5 my-28 select-none">
      {/* Forward row */}
      <motion.div
        className="flex gap-14 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {double.map((t, i) => (
          <span key={i} className="flex items-center gap-14 text-[10px] font-bold tracking-[0.32em] uppercase text-white/25">
            {t}<span className="text-white/10">✦</span>
          </span>
        ))}
      </motion.div>
      {/* Ghost reverse row */}
      <motion.div
        className="flex gap-14 whitespace-nowrap mt-2.5 opacity-30"
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {double.map((t, i) => (
          <span key={i} className="flex items-center gap-14 text-[9px] font-light tracking-[0.25em] uppercase text-white/15">
            {t}<span className="text-white/8">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── PILLAR CARD ────────────────────────────────────── */
function PillarCard({ p, i }: { p: typeof PILLARS[0]; i: number }) {
  return (
    <Magnetic>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.75, ease: EXPO, delay: i * 0.09 }}
        className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-950 p-7 flex flex-col gap-0 cursor-default min-h-[220px]"
      >
        {/* Ghost numeral */}
        <span className="absolute -right-3 -bottom-6 text-[110px] font-black leading-none text-white/[0.025] select-none pointer-events-none transition-all duration-700 group-hover:text-white/[0.055]">
          {p.num}
        </span>

        {/* Number tag */}
        <span className="text-[9px] font-mono tracking-[0.35em] text-white/20 mb-6">{p.num}</span>

        {/* Title — always visible */}
        <h3 className="text-lg font-semibold uppercase tracking-wide leading-tight text-white whitespace-pre-line mb-0">
          {p.title}
        </h3>

        {/* Body — hidden by default, slides up on hover */}
        <div className="overflow-hidden">
          <motion.p
            className="text-xs font-light text-white/40 leading-relaxed mt-4"
            initial={{ y: "100%", opacity: 0 }}
            whileHover={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.45, ease: EXPO }}
          >
            {p.body}
          </motion.p>
        </div>

        {/* Bottom line reveal on hover */}
        <motion.div
          className="absolute bottom-0 left-0 h-[1.5px] bg-white origin-left"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: EXPO }}
        />
      </motion.div>
    </Magnetic>
  )
}

/* ─── PROCESS STEP ───────────────────────────────────── */
function ProcessStep({ s, i }: { s: typeof PROCESS[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      className="group flex gap-8 items-start py-8 border-b border-white/[0.06] last:border-0 hover:border-white/[0.12] transition-colors duration-500"
    >
      {/* Animated large number */}
      <motion.span
        className="text-[56px] md:text-[72px] font-black leading-none text-white/[0.06] group-hover:text-white/[0.14] transition-colors duration-500 shrink-0 w-20 md:w-24 select-none"
        animate={inView ? { opacity: [0, 1], scale: [0.7, 1] } : {}}
        transition={{ duration: 0.7, ease: OVERSHOOT, delay: i * 0.1 + 0.2 }}
      >
        {s.num}
      </motion.span>

      <div className="flex flex-col gap-2 pt-2">
        {/* Phase title with char reveal on hover */}
        <h3 className="text-base md:text-lg font-semibold uppercase tracking-wide text-white/80 group-hover:text-white transition-colors duration-400">
          {s.phase}
        </h3>
        <motion.p
          className="text-sm font-light text-white/35 leading-relaxed max-w-md"
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EXPO, delay: i * 0.1 + 0.25 }}
        >
          {s.body}
        </motion.p>
      </div>

      {/* Arrow — appears on hover */}
      <motion.div
        className="ml-auto mt-2 shrink-0 text-white/10 group-hover:text-white/40 transition-colors duration-400"
        initial={false}
        animate={{ x: 0, y: 0 }}
        whileHover={{ x: 2, y: -2 }}
      >
        <ArrowUpRight className="h-5 w-5" />
      </motion.div>
    </motion.div>
  )
}

/* ─── PAGE ───────────────────────────────────────────── */
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-24 pb-20 overflow-x-hidden">

      {/* ══ 1. HERO ══════════════════════════════════════ */}
      <div ref={heroRef} className="max-w-7xl mx-auto px-6 md:px-12 mb-4">
        <motion.div style={{ opacity: heroOpacity }}>

          {/* Eyebrow */}
          <FadeUp className="flex items-center gap-3 mb-10">
            <div className="h-px w-6 bg-white/20" />
            <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/30 flex items-center gap-1.5">
              <MapPin className="h-2.5 w-2.5" />
              Rajasthan, India · Est. 2019
            </span>
          </FadeUp>

          {/* Hero headline — character-level reveal */}
          <div className="mb-10 overflow-hidden">
            <h1 className="text-[clamp(52px,10vw,120px)] font-extralight uppercase tracking-[-0.02em] leading-[0.88] text-white">
              <CharReveal text="Jr Suthar" delay={0.05} stagger={0.035} />
              <br />
              <CharReveal text="& Designs" delay={0.25} stagger={0.035} className="font-black" />
            </h1>
          </div>

          <LineReveal delay={0.7} className="mb-10 w-14" />

          {/* Two-column sub area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <FadeUp delay={0.55} className="md:col-span-5 text-white/55 font-light text-base leading-relaxed">
              An architectural design, visualization, and drafting studio dedicated to sculpting space and photorealistic
              light into built realities.
            </FadeUp>

            {/* Stat trio */}
            <motion.div
              className="md:col-span-7 flex items-end justify-start md:justify-end gap-12"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.1, delayChildren: 0.65 } },
              }}
            >
              {[["6+","Years Active"],["40+","Projects"],["M.Arch","Qualification"]].map(([v, l]) => (
                <motion.div
                  key={l}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EXPO } } }}
                  className="flex flex-col gap-1"
                >
                  <span className="text-3xl font-bold text-white leading-none">{v}</span>
                  <span className="text-[9px] font-light tracking-[0.3em] uppercase text-white/30">{l}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Hero image — parallax */}
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.2, ease: EXPO, delay: 0.4 }}
            className="relative mt-14 w-full h-[52vw] max-h-[520px] rounded-xl overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-cover bg-center scale-[1.08]"
              style={{ backgroundImage: "url('/website_stock_images/pexels-ahmetcotur-27626177.jpg')", y: imgY }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060606]/70 via-transparent to-transparent" />

            {/* Corner label */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="absolute bottom-5 right-5 text-[9px] font-mono tracking-[0.3em] uppercase text-white/35"
            >
              Studio · Bidasar, Rajasthan
            </motion.span>
          </motion.div>

        </motion.div>
      </div>

      <Marquee />

      {/* ══ 2. THE VISIONARY ═════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-32">
        <FadeUp className="flex items-center gap-4 mb-16">
          <div className="h-px w-6 bg-white/15" />
          <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">The Visionary</span>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* Portrait */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              whileInView={{ clipPath: "inset(0 0 0% 0)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1.1, ease: EXPO }}
              className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900"
            >
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/ramesh.jpg')" }}
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: EXPO }}
              />
              {/* Fallback */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[90px] font-black text-white/[0.03] tracking-widest select-none">RS</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#060606]/80 via-transparent to-transparent" />
            </motion.div>

            {/* Name under photo */}
            <div className="mt-5 overflow-hidden">
              <CharReveal text="Ramesh Suthar" delay={0.2} stagger={0.025}
                className="text-2xl font-bold uppercase tracking-tight text-white" />
            </div>
            <FadeUp delay={0.35} className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-light tracking-[0.3em] uppercase text-white/30 border border-white/10 rounded-full px-2.5 py-1">
                Lead Architect
              </span>
              <span className="text-white/15 text-xs">·</span>
              <span className="text-[9px] font-mono text-white/25 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />Bidasar, RJ
              </span>
            </FadeUp>
          </div>

          {/* Editorial right */}
          <div className="lg:col-span-8 flex flex-col gap-12">

            {/* Pull quote */}
            <motion.blockquote
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.9, ease: EXPO }}
              className="pl-5 border-l border-white/12 text-xl md:text-2xl font-light italic text-white/70 leading-relaxed"
            >
              "Architecture is not built in software. It's born in the silence between a site visit and the first
              sketch."
            </motion.blockquote>

            {/* Bio */}
            <FadeUp delay={0.1} className="flex flex-col gap-4">
              <p className="text-sm font-light text-white/50 leading-relaxed">
                Ramesh Suthar is the founder and lead architect of Jr Suthar & Designs. With over six years of
                practice rooted in Rajasthan, he brings structural rigour and cinematic sensibility to every
                project — from residential dwellings to large commercial developments.
              </p>
              <p className="text-sm font-light text-white/30 leading-relaxed">
                Holding a post-graduate degree in Advanced Computational Architecture, his approach is shaped by raw
                material honesty. He believes a building should not disguise itself — it should own the land it stands on.
              </p>
            </FadeUp>

            <LineReveal delay={0.15} />

            {/* Education — minimal timeline */}
            <div className="flex flex-col gap-0">
              <FadeUp className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/20 mb-5">
                Education
              </FadeUp>
              {[
                { year: "2018–19", title: "Master of Architecture" },
                { year: "2014–19", title: "Bachelor of Architecture" },
                { year: "2010–14", title: "Higher Secondary — Science" },
              ].map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EXPO, delay: i * 0.09 }}
                  className="group flex items-center gap-6 py-3.5 border-b border-white/[0.05] hover:border-white/[0.12] transition-colors duration-400 last:border-0"
                >
                  <span className="text-[9px] font-mono text-white/20 w-12 shrink-0 group-hover:text-white/45 transition-colors duration-400">{e.year}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60 group-hover:text-white transition-colors duration-400">{e.title}</span>
                  <ArrowUpRight className="h-3 w-3 text-white/0 group-hover:text-white/30 ml-auto shrink-0 transition-all duration-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.div>
              ))}
            </div>

            {/* Discipline chips */}
            <motion.div
              className="flex flex-wrap gap-2"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {DISCIPLINES.map((d) => (
                <motion.span
                  key={d}
                  variants={{ hidden: { opacity: 0, scale: 0.88 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: OVERSHOOT } } }}
                  className="text-[10px] font-light tracking-wide text-white/35 border border-white/[0.07] rounded-full px-3 py-1.5 hover:border-white/18 hover:text-white/60 transition-all duration-300 cursor-default"
                >
                  {d}
                </motion.span>
              ))}
            </motion.div>

          </div>
        </div>
      </div>

      {/* ══ 3. PILLARS ═══════════════════════════════════ */}
      <div className="border-y border-white/[0.05] py-24 mb-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <FadeUp className="flex items-center gap-3 mb-5">
                <div className="h-px w-5 bg-white/15" />
                <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">Foundational Focus</span>
              </FadeUp>
              <h2 className="text-4xl md:text-5xl font-light uppercase tracking-tight leading-none">
                <CharReveal text="Our Core" delay={0.05} stagger={0.03} />
                {" "}
                <CharReveal text="Pillars" delay={0.3} stagger={0.03} className="font-black" />
              </h2>
            </div>
            <FadeUp delay={0.15} className="text-white/30 text-xs font-light max-w-[240px] leading-relaxed md:text-right">
              Hover each pillar to reveal the principle.
            </FadeUp>
          </div>

          {/* 4-column equal grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PILLARS.map((p, i) => <PillarCard key={i} p={p} i={i} />)}
          </div>
        </div>
      </div>

      {/* ══ 4. PROCESS ═══════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-4">
          <div>
            <FadeUp className="flex items-center gap-3 mb-5">
              <div className="h-px w-5 bg-white/15" />
              <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">How We Work</span>
            </FadeUp>
            <h2 className="text-4xl md:text-6xl font-light uppercase tracking-tight leading-none">
              <CharReveal text="The Studio" delay={0.05} stagger={0.028} />
              <br />
              <CharReveal text="Process" delay={0.32} stagger={0.028} className="font-black" />
            </h2>
          </div>
          <FadeUp delay={0.1} className="text-white/30 text-xs font-light max-w-[260px] leading-relaxed">
            From site analysis to key handover — every phase built for execution integrity.
          </FadeUp>
        </div>

        <div className="flex flex-col">
          {PROCESS.map((s, i) => <ProcessStep key={i} s={s} i={i} />)}
        </div>
      </div>

      {/* ══ 5. PHILOSOPHY ════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EXPO }}
          className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
        >
          {/* BG image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/website_stock_images/pexels-ahmetcotur-27626177.jpg')" }}
          />
          <div className="absolute inset-0 bg-[#060606]/88" />

          <div className="relative z-10 px-8 md:px-16 py-16 md:py-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
            <div className="flex flex-col gap-6 max-w-2xl">
              <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">Philosophy</span>

              {/* Char-by-char quote reveal */}
              <blockquote className="text-white/80 font-light italic text-xl md:text-[28px] leading-relaxed">
                <CharReveal
                  text="We believe that a built space should not fight its environment."
                  delay={0.1}
                  stagger={0.018}
                />
                <br />
                <CharReveal
                  text="Light should not illuminate — it should compose texture."
                  delay={0.6}
                  stagger={0.018}
                />
              </blockquote>

              <FadeUp delay={0.9} className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/30">
                — Ramesh Suthar, Jr Suthar & Designs
              </FadeUp>
            </div>

            {/* CTA */}
            <Magnetic>
              <Link
                href="/contact"
                className="group relative flex items-center gap-3 text-[11px] font-bold tracking-[0.25em] uppercase border border-white/20 text-white hover:border-white/50 px-7 py-4 rounded-full transition-all duration-400 hover:bg-white hover:text-black overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-white origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4, ease: EXPO }}
                />
                <span className="relative z-10">Start a Consultation</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </div>

    </div>
  )
}