// src/context/BreadcrumbContext.tsx
import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useMemo,
} from "react"

export interface BreadcrumbItem {
    label: string
    href: string
}

interface BreadcrumbContextType {
    items: BreadcrumbItem[]
    setItems: (items: BreadcrumbItem[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export const useBreadcrumb = () => {
    const context = useContext(BreadcrumbContext)
    if (!context) {
        throw new Error("useBreadcrumb must be used within a BreadcrumbProvider")
    }
    return context
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
