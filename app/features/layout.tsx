import { AppShell } from "@/components/app-shell"

export default function FeaturesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppShell>{children}</AppShell>
}
