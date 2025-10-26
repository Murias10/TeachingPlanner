import {
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useTranslation } from "react-i18next"

export function NavSystem({
  projects: options,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {


  const { t } = useTranslation()

  // No mostrar la sección si no hay items
  if (options.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("sidebar.system.title")}</SidebarGroupLabel>
      <SidebarMenu>
        {options.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
