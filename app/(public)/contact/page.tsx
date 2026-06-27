"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react"
import { ArrowRight, ArrowUpRight } from "lucide-react"

/* ─── EASING (same as AboutPage) ─────────────────────── */
const EXPO = [0.76, 0, 0.24, 1] as const
const OVERSHOOT = [0.34, 1.56, 0.64, 1] as const

/* ─── DATA ───────────────────────────────────────────── */
const INQUIRY_TYPES = [
  "Residential",
  "Commercial",
  "Interior",
  "Visualization",
  "Renovation",
  "Other",
]

const CONTACT_LINES = [
  {
    label: "Email",
    value: "rameshsuthar32@gmail.com",
    href: "mailto:rameshsuthar32@gmail.com",
  },
  {
    label: "Phone",
    value: "+91 97823 53866",
    href: "tel:+919782353866",
  },
  {
    label: "Studio",
    value: "Narayani Traders, PWD Road, Bidasar, Rajasthan",
    href: null,
  },
]

/* ─── CHAR REVEAL (shared with AboutPage) ─────────────── */
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
        viewport={{ once: true, margin: "-40px" }}
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

/* ─── LINE REVEAL ─────────────────────────────────────── */
function LineReveal({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  return (
    <motion.div
      className={`h-px bg-white/12 origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: EXPO, delay }}
    />
  )
}

/* ─── FADE UP ─────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.7, ease: EXPO, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── MAGNETIC ────────────────────────────────────────── */
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
        x.set((e.clientX - r.left - r.width / 2) * 0.08)
        y.set((e.clientY - r.top - r.height / 2) * 0.08)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── UNDERLINE INPUT ─────────────────────────────────── */
function UnderlineField({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  delay = 0,
}: {
  label: string
  id: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  required?: boolean
  delay?: number
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0

  return (
    <motion.div
      className="relative flex flex-col gap-0"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EXPO, delay }}
    >
      {/* Floating label */}
      <motion.label
        htmlFor={id}
        animate={{
          y: active ? 0 : 22,
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.95,
        }}
        transition={{ duration: 0.25, ease: EXPO }}
        className="text-[9px] font-bold tracking-[0.35em] uppercase text-white/30 mb-2 origin-left"
      >
        {label}
      </motion.label>

      <input
        required={required}
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={active ? "" : placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-0 border-b border-white/12 pb-3 pt-1 text-sm text-white/80 placeholder:text-white/20 outline-none focus:text-white transition-colors duration-300"
      />

      {/* Animated focus underline */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-white origin-left"
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EXPO }}
      />
    </motion.div>
  )
}

/* ─── UNDERLINE TEXTAREA ──────────────────────────────── */
function UnderlineTextarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  delay = 0,
}: {
  label: string
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  required?: boolean
  delay?: number
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0

  return (
    <motion.div
      className="relative flex flex-col gap-0"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EXPO, delay }}
    >
      <motion.label
        htmlFor={id}
        animate={{
          y: active ? 0 : 22,
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.95,
        }}
        transition={{ duration: 0.25, ease: EXPO }}
        className="text-[9px] font-bold tracking-[0.35em] uppercase text-white/30 mb-2 origin-left"
      >
        {label}
      </motion.label>

      <textarea
        required={required}
        rows={4}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={active ? "" : placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-0 border-b border-white/12 pb-3 pt-1 text-sm text-white/80 placeholder:text-white/20 outline-none focus:text-white transition-colors duration-300 resize-none"
      />

      <motion.div
        className="absolute bottom-0 left-0 h-px bg-white origin-left"
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EXPO }}
      />
    </motion.div>
  )
}

/* ─── PAGE ────────────────────────────────────────────── */
export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success">("idle")
  const [activeType, setActiveType] = useState(INQUIRY_TYPES[0])
  const [formData, setFormData] = useState({ name: "", email: "", budget: "", message: "" })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState("submitting")
    await new Promise((r) => setTimeout(r, 1600))
    setFormState("success")
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-24 pb-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="mb-20 md:mb-24">
          <FadeUp className="flex items-center gap-3 mb-10">
            <div className="h-px w-6 bg-white/15" />
            <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">Inquire Studio</span>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <h1 className="text-[clamp(44px,9vw,110px)] font-extralight uppercase tracking-[-0.02em] leading-[0.88] text-white">
                <CharReveal text="Get In" delay={0.05} stagger={0.04} />
                <br />
                <CharReveal text="Touch" delay={0.28} stagger={0.04} className="font-black" />
              </h1>
            </div>
            <FadeUp delay={0.5} className="md:col-span-4 text-white/40 font-light text-sm leading-relaxed pb-2">
              Have a project concept, visualization scope, or commission in mind?
              We respond within 24 hours.
            </FadeUp>
          </div>
        </div>

        <LineReveal className="mb-20" />

        {/* ══ TWO COLUMNS ═════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">

          {/* ── LEFT: Contact lines ── */}
          <div className="lg:col-span-4 flex flex-col gap-14">

            {/* Bare contact list */}
            <div className="flex flex-col gap-0">
              {CONTACT_LINES.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease: EXPO, delay: i * 0.1 }}
                  className="group flex flex-col gap-1 py-6 border-b border-white/[0.06] hover:border-white/[0.14] transition-colors duration-400 last:border-0"
                >
                  <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/20 group-hover:text-white/40 transition-colors duration-400">
                    {c.label}
                  </span>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="text-sm font-light text-white/55 hover:text-white transition-colors duration-300 flex items-center gap-1.5 group/link"
                    >
                      {c.value}
                      <ArrowUpRight className="h-3 w-3 text-white/0 group-hover/link:text-white/50 transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </a>
                  ) : (
                    <span className="text-sm font-light text-white/55 leading-relaxed">
                      {c.value}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Quiet studio note */}
            <FadeUp delay={0.35} className="flex flex-col gap-3">
              <div className="h-px w-5 bg-white/10" />
              <p className="text-[11px] font-light text-white/25 leading-relaxed">
                Jr Suthar & Designs · Bidasar Studio
                <br />
                Available Mon–Sat, 9am–7pm IST
              </p>
            </FadeUp>
          </div>

          {/* ── RIGHT: Minimal form ── */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">

              {formState !== "success" ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-10"
                >
                  {/* Project type pills */}
                  <div className="flex flex-col gap-4">
                    <FadeUp>
                      <span className="text-[9px] font-bold tracking-[0.38em] uppercase text-white/25">
                        Project Type
                      </span>
                    </FadeUp>
                    <motion.div
                      className="flex flex-wrap gap-2"
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
                      }}
                    >
                      {INQUIRY_TYPES.map((type) => (
                        <motion.button
                          key={type}
                          type="button"
                          onClick={() => setActiveType(type)}
                          variants={{
                            hidden: { opacity: 0, scale: 0.88 },
                            show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: OVERSHOOT } },
                          }}
                          className={`relative text-[10px] font-semibold tracking-[0.25em] uppercase px-4 py-2 rounded-full border transition-colors duration-300 cursor-pointer ${
                            activeType === type
                              ? "text-black border-white"
                              : "text-white/40 border-white/[0.08] hover:text-white/70 hover:border-white/20"
                          }`}
                        >
                          {activeType === type && (
                            <motion.div
                              layoutId="pill-bg"
                              className="absolute inset-0 bg-white rounded-full"
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            />
                          )}
                          <span className="relative z-10">{type}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>

                  <LineReveal />

                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                    <UnderlineField
                      label="Full Name"
                      id="name" name="name" type="text"
                      value={formData.name} onChange={handleChange}
                      placeholder="Rajan Sharma"
                      required delay={0.05}
                    />
                    <UnderlineField
                      label="Email Address"
                      id="email" name="email" type="email"
                      value={formData.email} onChange={handleChange}
                      placeholder="rajan@example.com"
                      required delay={0.12}
                    />
                  </div>

                  {/* Budget */}
                  <UnderlineField
                    label="Approx. Scale / Budget"
                    id="budget" name="budget" type="text"
                    value={formData.budget} onChange={handleChange}
                    placeholder="e.g. 5,000 sqft / ₹25L"
                    delay={0.18}
                  />

                  {/* Message */}
                  <UnderlineTextarea
                    label="Project Details"
                    id="message" name="message"
                    value={formData.message} onChange={handleChange}
                    placeholder="Describe your design goals, timeline, and context..."
                    required delay={0.24}
                  />

                  <LineReveal delay={0.1} />

                  {/* Submit */}
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <FadeUp delay={0.1} className="text-[10px] font-light text-white/20 leading-relaxed max-w-[200px]">
                      We review every inquiry personally and respond within one business day.
                    </FadeUp>

                    <Magnetic>
                      <motion.button
                        type="submit"
                        disabled={formState === "submitting"}
                        className="group relative flex items-center gap-3 text-[11px] font-bold tracking-[0.25em] uppercase border border-white/25 text-white hover:border-white px-8 py-4 rounded-full transition-colors duration-400 overflow-hidden cursor-pointer disabled:opacity-40"
                        whileTap={{ scale: 0.97 }}
                      >
                        {/* Fill wipe on hover */}
                        <motion.span
                          className="absolute inset-0 bg-white origin-left"
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.42, ease: EXPO }}
                        />
                        <span className="relative z-10 group-hover:text-black transition-colors duration-300">
                          {formState === "submitting" ? "Sending…" : "Send Inquiry"}
                        </span>
                        <motion.span
                          className="relative z-10 group-hover:text-black transition-colors duration-300"
                          animate={formState === "submitting"
                            ? { rotate: 360 }
                            : { x: [0, 4, 0] }
                          }
                          transition={formState === "submitting"
                            ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                            : { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                          }
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.span>
                      </motion.button>
                    </Magnetic>
                  </div>
                </motion.form>
              ) : (

                /* ── SUCCESS STATE ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col gap-10 py-8"
                >
                  {/* Thin line that draws across */}
                  <motion.div
                    className="h-px bg-white/30 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, ease: EXPO }}
                  />

                  <div className="flex flex-col gap-5">
                    <div className="overflow-hidden">
                      <motion.span
                        className="block text-[9px] font-bold tracking-[0.38em] uppercase text-white/30"
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        transition={{ duration: 0.6, ease: EXPO, delay: 0.2 }}
                      >
                        Inquiry Received
                      </motion.span>
                    </div>

                    <h3 className="text-4xl md:text-6xl font-extralight uppercase tracking-tight leading-none text-white">
                      <CharReveal text="Thank" delay={0.35} stagger={0.04} />
                      <br />
                      <CharReveal text="You." delay={0.55} stagger={0.06} className="font-black" />
                    </h3>

                    <FadeUp delay={0.8} className="text-sm font-light text-white/40 leading-relaxed max-w-sm">
                      Our design director will review your project and reply to{" "}
                      <span className="text-white/70">{formData.email}</span> within 24 hours.
                    </FadeUp>
                  </div>

                  <LineReveal delay={1} />

                  <motion.button
                    onClick={() => {
                      setFormState("idle")
                      setFormData({ name: "", email: "", budget: "", message: "" })
                      setActiveType(INQUIRY_TYPES[0])
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="self-start text-[10px] font-semibold tracking-[0.3em] uppercase text-white/30 hover:text-white transition-colors duration-300 flex items-center gap-2 cursor-pointer"
                  >
                    Submit another inquiry
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}