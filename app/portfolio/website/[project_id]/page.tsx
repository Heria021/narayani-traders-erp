export default function ProjectShowcasePage({ params }: { params: { project_id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Project Showcase</h1>
      <p className="text-muted-foreground text-sm">Manage photos and settings for public listing of project: {params.project_id}</p>
    </div>
  )
}
