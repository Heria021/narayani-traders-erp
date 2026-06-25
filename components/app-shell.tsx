"use client"

import { usePathname } from "next/navigation"
import React, { createContext, useContext, useState, useEffect } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const routeTitles: Record<string, string> = {
  "/features": "Dashboard",
  "/features/sales": "Sales",
  "/features/purchases": "Purchases",
  "/features/products": "Products",
  "/features/inventory": "Inventory",
  "/features/customers": "Customers",
  "/features/suppliers": "Suppliers",
  "/portfolio/projects": "Projects Manager",
  "/portfolio/projects/new": "New Project",
  "/portfolio/clients": "Clients Manager",
  "/portfolio/clients/new": "New Client",
  "/portfolio/website": "Website Curation",
}

function getRouteTitle(pathname: string) {
  const exact = routeTitles[pathname]

  if (exact) {
    return exact
  }

  const match = Object.entries(routeTitles)
    .filter(([route]) => route !== "/features" && pathname.startsWith(route))
    .sort(([a], [b]) => b.length - a.length)[0]

  return match?.[1] ?? "Dashboard"
}

// ── Breadcrumb Context for Child Pages ────────────────────────────────────────
const BreadcrumbContext = createContext<{
  customTitle: string | null
  setCustomTitle: (title: string | null) => void
}>({
  customTitle: null,
  setCustomTitle: () => {},
})

export function useBreadcrumb() {
  return useContext(BreadcrumbContext)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [customTitle, setCustomTitle] = useState<string | null>(null)

  // Reset custom title when pathname changes to avoid title leak across pages
  useEffect(() => {
    setCustomTitle(null)
  }, [pathname])

  const baseTitle = getRouteTitle(pathname)

  // Determine parent route details if it's a dynamic sub-route
  const pathParts = pathname.split('/')
  const isSubRoute = pathParts.length > 3
  const parentPath = isSubRoute ? pathParts.slice(0, 3).join('/') : null
  const parentTitle = parentPath ? routeTitles[parentPath] : null

  const isPortfolio = pathname.startsWith('/portfolio')

  return (
    <BreadcrumbContext.Provider value={{ customTitle, setCustomTitle }}>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={isPortfolio ? "/portfolio/projects" : "/features"}>
                    {isPortfolio ? "Studio Workspace" : "Narayani Traders"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />

                {customTitle && parentTitle && parentPath ? (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={parentPath}>{parentTitle}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{customTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{baseTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbContext.Provider>
  )
}

