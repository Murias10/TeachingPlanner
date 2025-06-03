import * as React from "react"
import {
  Command,
  CircleHelp,
  UserRoundCog,
  ScrollText,
  PieChart,
  Send,
  Settings2,
  Warehouse,
  CalendarDays,
  BookMarked
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSystem } from "@/components/nav-system"
import { NavExtra } from "@/components/nav-extra"
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

import { useTranslation } from "react-i18next"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { t } = useTranslation()

  const data = {
    user: {
      name: "Diego Murias Suárez",
      email: "uo290009@uniovi.es",
      avatar: "/avatars/shadcn.jpg",
    },
    main: [
      {
        title: t("sidebar.main.calendars.title"),
        url: "/about",
        icon: CalendarDays,
        isActive: true,
        items: [
          {
            title: t("sidebar.main.calendars.list"),
            url: "/",
          }
        ],
      },
      {
        title: t("sidebar.main.classrooms.title"),
        url: "#",
        icon: Warehouse,
        items: [
          {
            title: t("sidebar.main.classrooms.list"),
            url: "#",
          }
        ],
      },
      {
        title: t("sidebar.main.subjects.title"),
        url: "#",
        icon: BookMarked,
        items: [
          {
            title: t("sidebar.main.subjects.list"),
            url: "#",
          }
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
    ],
    system: [
      {
        name: t("sidebar.system.logs.title"),
        url: "#",
        icon: ScrollText,
      },
      {
        name: t("sidebar.system.users.title"),
        url: "#",
        icon: UserRoundCog,
      },
      {
        name: t("sidebar.system.reports.title"),
        url: "#",
        icon: PieChart,
      },
    ],
    extra: [
      {
        title: "FAQs",
        url: "#",
        icon: CircleHelp,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.main} />
        <NavSystem projects={data.system} />
        <NavExtra items={data.extra} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
