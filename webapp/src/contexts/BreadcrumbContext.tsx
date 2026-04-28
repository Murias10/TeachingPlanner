
import {
    useState,
    ReactNode,
    useMemo,
} from "react"
import { LucideIcon } from "lucide-react"
import { BreadcrumbContext } from "@/contexts/BreadcrumbContextInstance"

export interface BreadcrumbItem {
    label: string
    href: string
    shortLabel?: string
    icon?: LucideIcon
}

export interface BreadcrumbContextType {
    items: BreadcrumbItem[]
    setItems: (items: BreadcrumbItem[]) => void
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<BreadcrumbItem[]>([])

    const value = useMemo(() => ({ items, setItems }), [items])

    return (
        <BreadcrumbContext.Provider value={value}>
            {children}
        </BreadcrumbContext.Provider>
    )
}
