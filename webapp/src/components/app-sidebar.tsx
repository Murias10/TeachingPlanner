import { Link } from "react-router-dom"
import {
  CircleHelp,
  UserRoundCog,
  ScrollText,
  PieChart,
  Settings2,
  Warehouse,
  CalendarDays,
  BookMarked,
  Home,
  GraduationCap
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
        title: t("sidebar.main.home.title"),
        url: "/home",
        icon: Home,
        isActive: true,
        items: [],
      },
      {
        title: t("sidebar.main.degrees.title"),
        url: "/degrees",
        icon: GraduationCap,
        isActive: true,
        items: [],
      },
      {
        title: t("sidebar.main.calendars.title"),
        url: "/degrees",
        icon: CalendarDays,
        isActive: true,
        items: [],
      },
      {
        title: t("sidebar.main.classrooms.title"),
        url: "/classrooms",
        icon: Warehouse,
        items: [],
      },
      {
        title: t("sidebar.main.subjects.title"),
        url: "/degrees",
        icon: BookMarked,
        items: [],
      },
      {
        title: t("sidebar.main.settings.title"),
        url: "/settings",
        icon: Settings2,
        items: [],
      },
    ],
    system: [
      {
        name: t("sidebar.system.logs.title"),
        url: "/logs",
        icon: ScrollText,
      },
      {
        name: t("sidebar.system.users.title"),
        url: "/users",
        icon: UserRoundCog,
      },
      {
        name: t("sidebar.system.reports.title"),
        url: "/reports",
        icon: PieChart,
      },
    ],
    extra: [
      {
        title: t("sidebar.extra.faq.title"),
        url: "#",
        icon: CircleHelp,
      }
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
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/favicon.svg"
                  alt="Logo"
                  className="aspect-square size-11 rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="break-words whitespace-normal font-medium">Escuela de Ingeniería Informática</span>
                  <span className="truncate text-xs">Universidad de Oviedo</span>
                </div>
              </Link>
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
