import { SidebarIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { Link } from "react-router-dom"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { items } = useBreadcrumbContext()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>

        <Separator orientation="vertical" className="mr-2 h-4" />

        {items.length > 0 && (
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {items.map((item, index) => {
                const isLast = index === items.length - 1

                return (
                  <BreadcrumbItem key={index}>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </BreadcrumbItem>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex flex-1 items-center justify-end gap-2">
          <LanguageSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
