"use client"

import { usePathname } from "next/navigation"

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentTitle = getRouteTitle(pathname)

  return (
    <SidebarProvider>
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
                <BreadcrumbLink href="/features">Narayani Traders</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
