import Link from "next/link"
import {
  ArrowRightIcon,
  BoxesIcon,
  PackageIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const modules = [
  {
    title: "Products",
    description: "SKU catalog, categories, pricing, and stock flags.",
    href: "/features/products",
    icon: PackageIcon,
    status: "Live",
    accent: "text-blue-600",
  },
  {
    title: "Customers",
    description: "Customer ledger, receivables, and payment history.",
    href: "/features/customers",
    icon: UsersIcon,
    status: "Live",
    accent: "text-emerald-600",
  },
  {
    title: "Suppliers",
    description: "Supplier master data, purchase history, and balances.",
    href: "/features/suppliers",
    icon: TruckIcon,
    status: "Live",
    accent: "text-cyan-700",
  },
  {
    title: "Sales",
    description: "Sales billing workflow and invoice records.",
    href: "/features/sales",
    icon: ReceiptTextIcon,
    status: "Setup",
    accent: "text-violet-600",
  },
  {
    title: "Purchases",
    description: "Supplier bills, purchase items, and payables.",
    href: "/features/purchases",
    icon: ShoppingCartIcon,
    status: "Setup",
    accent: "text-amber-600",
  },
  {
    title: "Inventory",
    description: "Stock movement, low stock, and warehouse quantities.",
    href: "/features/inventory",
    icon: WarehouseIcon,
    status: "Setup",
    accent: "text-rose-600",
  },
]

export default function DashboardPage() {
  return (
    <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
          <p className="text-sm text-muted-foreground">
            Narayani Traders ERP modules for daily trading workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Live modules</CardDescription>
              <CardTitle className="text-3xl">
                {modules.filter((module) => module.status === "Live").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Setup modules</CardDescription>
              <CardTitle className="text-3xl">
                {modules.filter((module) => module.status === "Setup").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total sections</CardDescription>
              <CardTitle className="text-3xl">{modules.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <Card key={module.href} className="flex flex-col">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md border bg-background">
                        <Icon className={`size-4 ${module.accent}`} />
                      </div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{module.status}</Badge>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    render={<Link href={module.href} />}
                    nativeButton={false}
                  >
                    Open
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border bg-background">
                <BoxesIcon className="size-4 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-base">Primary Workflow</CardTitle>
                <CardDescription>
                  Product catalog, customer ledger, and supplier ledger are ready
                  for daily operations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </main>
  )
}
