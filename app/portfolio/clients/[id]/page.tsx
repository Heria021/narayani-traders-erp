export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Client Detail</h1>
      <p className="text-muted-foreground text-sm">View or edit client with ID: {params.id}</p>
    </div>
  )
}
