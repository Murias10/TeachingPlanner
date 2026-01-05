import { Link } from "react-router-dom"
import {
  CircleHelp,
  UserRoundCog,
  Warehouse,
  CalendarDays,
  Home,
  ClipboardList,
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
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuth()

  const data = {
    user: {
      name: isAuthenticated && user ? `${user.name} ${user.firstSurname} ${user.secondSurname}` : "Invitado",
      email: isAuthenticated && user ? user.email : "No autenticado",
      avatar: "/avatars/shadcn.jpg",
    },
    main: [
      {
        title: t("sidebar.main.home.title"),
        url: "/home",
        icon: Home,
        isActive: false,
        items: [],
        requiredAuth: false,
      },
      {
        title: t("sidebar.main.degrees.title"),
        url: "/degrees",
        icon: CalendarDays,
        isActive: true,
        items: [],
        requiredAuth: false,
      },
      {
        title: t("sidebar.main.classrooms.title"),
        url: "/classrooms",
        icon: Warehouse,
        items: [],
        requiredAuth: false,
      },
    ],
    system: [
      {
        name: t("sidebar.system.users.title"),
        url: "/users",
        icon: UserRoundCog,
        requiredAuth: true,
      },
      {
        name: t("sidebar.system.requests.title"),
        url: "/solicitudes",
        icon: ClipboardList,
        requiredAuth: true,
      },
    ],
    extra: [
      {
        title: t("sidebar.extra.faq.title"),
        url: "#",
        icon: CircleHelp,
        requiredAuth: false,
      }
    ],
  }

  // Filtrar items según la autenticación del usuario
  const filteredMain = data.main.filter(item => !item.requiredAuth || isAuthenticated);
  const filteredSystem = data.system.filter(item => !item.requiredAuth || isAuthenticated);
  const filteredExtra = data.extra.filter(item => !item.requiredAuth || isAuthenticated);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/degrees" className="flex items-center gap-3">
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
        <NavMain items={filteredMain} />
        <NavSystem projects={filteredSystem} />
        <NavExtra items={filteredExtra} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
