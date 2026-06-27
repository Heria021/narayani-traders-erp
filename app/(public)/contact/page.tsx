"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Mail, Phone, MapPin, CheckCircle2, Loader2, ArrowRight } from "lucide-react"

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

// Right column form slide-in
const formContainerVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.97 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 55,
      damping: 14,
      duration: 0.8,
    },
  },
}

const INQUIRY_TYPES = [
  "Residential Project",
  "Commercial Project",
  "Interior Design",
  "Visualization Only",
  "Renovation",
  "Other Curation",
]

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success">("idle")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: INQUIRY_TYPES[0],
    budget: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState("submitting")

    // Simulate database write / api call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setFormState("success")
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-32 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* 1. Left Column: Contact Details */}
        <motion.div
          variants={leftStaggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="lg:col-span-5 flex flex-col gap-8"
        >
          <div className="flex flex-col gap-4">
            <motion.span variants={fadeUpVariants} className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/50 uppercase">
              Inquire Studio
            </motion.span>
            <motion.h1 variants={fadeUpVariants} className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-none">
              Get In <span className="font-bold block">Touch</span>
            </motion.h1>
            <motion.div variants={fadeUpVariants} className="h-[2px] w-12 bg-white/20 mt-2" />
          </div>

          <motion.p variants={fadeUpVariants} className="text-white/60 font-light text-sm md:text-base leading-relaxed max-w-md">
            Have a project concept, visualization scope, or commission request in mind? Leave a message here and we will return an estimate or schedule a call.
          </motion.p>

          {/* Contact Details Grid */}
          <motion.div variants={containerVariants} className="flex flex-col gap-6 mt-4">
            
            <motion.div variants={fadeUpVariants} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-zinc-950/45 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Email Us</span>
                <a href="mailto:rameshsuthar32@gmail.com" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                  rameshsuthar32@gmail.com
                </a>
              </div>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-zinc-950/45 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Call Office</span>
                <a href="tel:+919782353866" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                  +91 97823 53866
                </a>
              </div>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-zinc-950/45 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Office Address</span>
                <span className="text-sm font-light text-white/80">
                  Narayani Traders, PWD Road, Bidasar, Rajasthan, India
                </span>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>

        {/* 2. Right Column: Glassmorphic Inquiry Form */}
        <motion.div
          variants={formContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="lg:col-span-7 w-full p-8 md:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden min-h-[500px] flex items-center"
        >
          <AnimatePresence mode="wait">
            {formState !== "success" ? (
              <motion.form
                key="contact-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl md:text-2xl font-light tracking-wide uppercase text-white/90">
                    Project Inquiry
                  </h2>
                  <p className="text-white/40 text-xs font-light">
                    Provide project specs and we will get back to you with conceptual layouts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajan Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder:text-white/20"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. rajan@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Type */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="projectType" className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Project Type
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 focus:ring-1 focus:ring-white/20 outline-none transition-all text-white/80"
                    >
                      {INQUIRY_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-zinc-950 text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget scale */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="budget" className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Approx. Scale / Budget
                    </label>
                    <input
                      type="text"
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 5,000 sqft / ₹25L"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Message text area */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                    Project details
                  </label>
                  <textarea
                    required
                    rows={4}
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your design goals, timeline, context..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder:text-white/20 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/40 font-semibold tracking-wider uppercase text-xs md:text-sm py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5 active:scale-98"
                >
                  {formState === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      Sending Inquiry...
                    </>
                  ) : (
                    <>
                      Send Inquiry
                      <ArrowRight className="h-4 w-4 text-black" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring" as const, stiffness: 80, damping: 15 }}
                className="w-full flex flex-col items-center justify-center text-center gap-5 py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 10 }}
                  className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-black shadow-xl"
                >
                  <CheckCircle2 className="h-8 w-8 text-black" />
                </motion.div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-light tracking-wide uppercase text-white">
                    Inquiry Received
                  </h3>
                  <p className="text-white/50 font-light text-xs md:text-sm max-w-sm leading-relaxed">
                    Thank you, <span className="text-white font-medium">{formData.name}</span>. Our design director will review your project details and get back to you at <span className="text-white font-medium">{formData.email}</span> within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => setFormState("idle")}
                  className="mt-4 text-xs font-semibold tracking-widest uppercase border border-white/20 hover:border-white text-white/60 hover:text-white px-6 py-2.5 rounded-full transition-all duration-200"
                >
                  Submit Another Inquiry
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  )
}
