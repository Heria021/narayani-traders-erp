import Link from "next/link"

export default function PublicProjectsGridPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Our Projects</h1>
      <p className="text-muted-foreground mb-8">Browse our complete collection of public listings.</p>
      
      {/* Placeholder for projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-border rounded-lg p-6 bg-card flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-bold text-lg">Sample Project</h3>
            <p className="text-sm text-muted-foreground mt-1">This is a placeholder for public listing</p>
          </div>
          <Link href="/projects/sample-project" className="text-primary text-sm font-medium hover:underline self-start">
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
