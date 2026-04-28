import React from "react"
import { SidebarIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
          <div
            className="flex-1 min-w-0 overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, black 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 90%, transparent 100%)",
            }}
          >
            <Breadcrumb>
              <BreadcrumbList>
                <TooltipProvider>
                  {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    const isClickable = item.href && item.href !== ""
                    const Icon = item.icon
                    const onlyOne = items.length === 1

                    const desktopContent = item.label
                    let mobileContent: React.ReactNode
                    if (onlyOne) {
                      mobileContent = item.label
                    } else if (Icon) {
                      mobileContent = (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <Icon className="size-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{item.label}</TooltipContent>
                        </Tooltip>
                      )
                    } else {
                      mobileContent = item.shortLabel ?? item.label
                    }

                    return (
                      <BreadcrumbItem
                        key={`${item.label}-${item.href ?? index}`}
                      >
                        {isLast || !isClickable ? (
                          <>
                            <BreadcrumbPage>
                              <span className="hidden sm:inline">{desktopContent}</span>
                              <span className="sm:hidden inline-flex items-center">
                                {mobileContent}
                              </span>
                            </BreadcrumbPage>
                            {!isLast && <BreadcrumbSeparator />}
                          </>
                        ) : (
                          <>
                            <BreadcrumbLink asChild>
                              <Link to={item.href}>
                                <span className="hidden sm:inline">{desktopContent}</span>
                                <span className="sm:hidden inline-flex items-center">
                                  {mobileContent}
                                </span>
                              </Link>
                            </BreadcrumbLink>
                            <BreadcrumbSeparator />
                          </>
                        )}
                      </BreadcrumbItem>
                    )
                  })}
                </TooltipProvider>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
