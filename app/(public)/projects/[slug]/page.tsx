import Link from "next/link"

export default function PublicProjectDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">&larr; Back to Projects</Link>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Project: {params.slug}</h1>
      <p className="text-muted-foreground mb-8">Photos and details curated specifically for the public site.</p>
    </div>
  )
}
