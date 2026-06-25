export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Project details</h1>
      <p className="text-muted-foreground text-sm">Edit project record and manage media for ID: {params.id}</p>
    </div>
  )
}
