import Link from "next/link"
import PageTransition from "./_components/page-transition"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-sm px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-bold text-sm md:text-base tracking-[0.2em] text-white hover:opacity-85 transition-opacity uppercase">
            JR SUTHAR & DESIGNS
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="text-white/70 hover:text-white font-medium transition-colors">Home</Link>
            <Link href="/#projects" className="text-white/70 hover:text-white font-medium transition-colors">Projects</Link>
            <Link href="/about" className="text-white/70 hover:text-white font-medium transition-colors">About</Link>
            <Link href="/contact" className="text-white/70 hover:text-white font-medium transition-colors">Contact</Link>
          </nav>
        </div>
        <div>
          <Link
            href="/contact"
            className="text-xs bg-white text-black hover:bg-white/90 font-medium tracking-wider uppercase px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Let's Talk
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
