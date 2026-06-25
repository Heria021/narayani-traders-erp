export default function ProjectCurationPage({ params }: { params: { project_id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Project Curation</h1>
      <p className="text-muted-foreground text-sm">Curate photos and settings for public listing of project: {params.project_id}</p>
    </div>
  )
}
