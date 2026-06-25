import Link from "next/link"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">HARIOM STUDIO</span>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground font-medium transition-colors">Home</Link>
            <Link href="/projects" className="hover:text-foreground font-medium transition-colors">Projects</Link>
            <Link href="/about" className="hover:text-foreground font-medium transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground font-medium transition-colors">Contact</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portfolio/projects"
            className="text-xs bg-primary text-primary-foreground font-medium px-3.5 py-2 rounded-md hover:bg-primary/95 transition-colors"
          >
            Admin Portal
          </Link>
          <Link
            href="/features"
            className="text-xs border border-border font-medium px-3.5 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            ERP Workspace
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-muted/20">
        &copy; {new Date().getFullYear()} Hariom Studio. All rights reserved.
      </footer>
    </div>
  )
}
