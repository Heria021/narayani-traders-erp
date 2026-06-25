'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Phone, Mail, MapPin, Users,
  MoreHorizontal, Pencil, Trash2, Briefcase, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClients } from './_components/useClients'
import { ClientForm } from './_components/ClientForm'
import type { ClientFormValues, ClientWithStats } from './_components/types'

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PortfolioClientsPage() {
  const router = useRouter()
  const {
    clients, search, loading, selectedClient, setSelectedId,
    handleSearchChange, addClient, updateClient, deleteClient
  } = useClients()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() {
    setEditMode(false)
    setFormOpen(true)
  }

  function openEdit(clientId: string) {
    setSelectedId(clientId)
    setEditMode(true)
    setFormOpen(true)
  }

  async function handleSubmit(values: ClientFormValues) {
    if (editMode && selectedClient) {
      return updateClient(selectedClient.id, values)
    }
    return addClient(values)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 bg-background">
      
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="size-6 text-muted-foreground" />
            Clients Manager
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Manage your studio's client profiles, contact information, and project histories.
          </p>
        </div>
        <Button onClick={openAdd} size="default" className="px-4 shrink-0 font-medium rounded-lg">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          Create Client
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b pb-4">
        <div className="relative min-w-0 w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, phone, city, GST..."
            className={cn(
              'w-full h-9 rounded-lg border border-input bg-transparent pl-10 pr-3 text-sm',
              'placeholder:text-muted-foreground/50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring',
              'transition-colors',
            )}
          />
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border rounded-xl p-5 space-y-4 bg-card">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card">
            <Users className="size-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg">No clients found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {search ? 'No clients match your current search query.' : 'Register your first client to start linking projects and logs.'}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" className="mt-4 rounded-lg">
                <Plus className="size-4 mr-1.5" /> Add Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(c => {
              const location = [c.city, c.state].filter(Boolean).join(', ')

              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/portfolio/clients/${c.id}`)}
                  className={cn(
                    "group relative border border-border/80 rounded-xl p-5 bg-card flex flex-col justify-between cursor-pointer",
                    "hover:shadow-md hover:border-foreground/20 hover:bg-muted/10 transition-all duration-200"
                  )}
                >
                  <div>
                    {/* Initials & Actions dropdown */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground group-hover:bg-foreground/5 transition-colors">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                            {c.name}
                          </h3>
                          <span className="text-[10px] text-muted-foreground block mt-1 tracking-wider uppercase">
                            Client ID: #{c.id.substring(0, 5)}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="size-4 text-muted-foreground" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => router.push(`/portfolio/clients/${c.id}`)}>
                              <Briefcase className="size-4 mr-2" /> View Details & Projects
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(c.id)}>
                              <Pencil className="size-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => deleteClient(c)}>
                              <Trash2 className="size-4 mr-2" /> Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Contacts and details */}
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground/60 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                      
                      {c.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}

                      {location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      )}

                      {c.gstin && (
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="font-mono bg-muted px-1 rounded text-[10px]">{c.gstin}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes Preview */}
                    {c.notes && (
                      <p className="mt-4 text-xs text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/40 line-clamp-2">
                        {c.notes}
                      </p>
                    )}
                  </div>

                  {/* Project Count Badge at bottom */}
                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Recorded Projects</span>
                    <Badge variant={c.project_count > 0 ? "secondary" : "outline"} className="rounded-full px-2 py-0">
                      {c.project_count} {c.project_count === 1 ? 'project' : 'projects'}
                    </Badge>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Form Sheet */}
      <ClientForm
        open={formOpen}
        client={editMode ? selectedClient : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

    </div>
  )
}
