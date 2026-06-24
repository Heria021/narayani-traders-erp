"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2Icon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  PaletteIcon,
  BriefcaseIcon,
  ImageIcon,
  SettingsIcon,
  ChevronsUpDown,
} from "lucide-react"

const isRouteActive = (pathname: string, url: string) =>
  pathname === url || (url !== "/features" && pathname.startsWith(url))

const data = {
  user: {
    name: "Narayani Traders",
    email: "Admin workspace",
    avatar: "",
  },
}

const erpNavMain = [
  {
    title: "Dashboard",
    url: "/features",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Sales",
    url: "/features/sales",
    icon: <ReceiptTextIcon />,
  },
  {
    title: "Purchases",
    url: "/features/purchases",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Products",
    url: "/features/products",
    icon: <PackageIcon />,
  },
  {
    title: "Inventory",
    url: "/features/inventory",
    icon: <WarehouseIcon />,
  },
  {
    title: "Customers",
    url: "/features/customers",
    icon: <UsersIcon />,
  },
  {
    title: "Suppliers",
    url: "/features/suppliers",
    icon: <TruckIcon />,
  },
]

const portfolioNavMain = [
  {
    title: "Projects",
    url: "/portfolio/admin/projects",
    icon: <BriefcaseIcon />,
  },
  {
    title: "Media Library",
    url: "/portfolio/admin/media",
    icon: <ImageIcon />,
  },
  {
    title: "Studio Settings",
    url: "/portfolio/admin/settings",
    icon: <SettingsIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useSidebar()

  const isPortfolio = pathname.startsWith('/portfolio')
  
  const workspaces = [
    {
      name: "Narayani Traders",
      plan: "ERP Workspace",
      logo: Building2Icon,
      url: "/features",
      id: "erp",
    },
    {
      name: "Studio Workspace",
      plan: "Portfolio Admin",
      logo: PaletteIcon,
      url: "/portfolio/admin/projects",
      id: "portfolio",
    },
  ]

  const activeWorkspace = isPortfolio ? workspaces[1] : workspaces[0]

  const activeNavSource = isPortfolio ? portfolioNavMain : erpNavMain
  const navMain = activeNavSource.map((item) => ({
    ...item,
    isActive: isRouteActive(pathname, item.url),
  }))

  const user = {
    ...data.user,
    email: isPortfolio ? "Studio workspace" : "Admin workspace",
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <activeWorkspace.logo className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{activeWorkspace.name}</span>
                    <span className="truncate text-xs">{activeWorkspace.plan}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                </SidebarMenuButton>
              } />
              <DropdownMenuContent
                className="w-[calc(var(--radix-dropdown-menu-trigger-width)-8px)] min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Workspaces
                  </DropdownMenuLabel>
                  {workspaces.map((ws, index) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => router.push(ws.url)}
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <ws.logo className="size-3.5 shrink-0 text-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">{ws.name}</span>
                        <span className="text-[10px] text-muted-foreground">{ws.plan}</span>
                      </div>
                      <DropdownMenuShortcut className="text-[9px]">⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label={isPortfolio ? "Studio Portfolio" : "Features"} items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
