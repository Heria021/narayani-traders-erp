"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

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
} from "@/components/ui/sidebar"
import {
  Building2Icon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react"

const isRouteActive = (pathname: string, url: string) =>
  pathname === url || (url !== "/features" && pathname.startsWith(url))

const data = {
  user: {
    name: "Narayani Traders",
    email: "Admin workspace",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/features",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Sales",
      url: "/features/sales",
      icon: (
        <ReceiptTextIcon
        />
      ),
    },
    {
      title: "Purchases",
      url: "/features/purchases",
      icon: (
        <ShoppingCartIcon
        />
      ),
    },
    {
      title: "Products",
      url: "/features/products",
      icon: (
        <PackageIcon
        />
      ),
    },
    {
      title: "Inventory",
      url: "/features/inventory",
      icon: (
        <WarehouseIcon
        />
      ),
    },
    {
      title: "Customers",
      url: "/features/customers",
      icon: (
        <UsersIcon
        />
      ),
    },
    {
      title: "Suppliers",
      url: "/features/suppliers",
      icon: (
        <TruckIcon
        />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const navMain = data.navMain.map((item) => ({
    ...item,
    isActive: isRouteActive(pathname, item.url),
  }))

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/features" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Narayani Traders</span>
                <span className="truncate text-xs">ERP</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Features" items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
