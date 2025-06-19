"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

// Define the shape of each degree option
export interface Degree {
    value: string
    label: string
}

// Define the shape of our context
interface DegreeContextType {
    degrees: Degree[]
    loading: boolean
    error: string | null
    selectedDegree: string
    setSelectedDegree: (value: string) => void
}

// Create context
const DegreeContext = createContext<DegreeContextType | undefined>(undefined)

// Provider that fetches degrees via React Query
export function DegreeProvider({ children }: { children: ReactNode }) {
    const [selectedDegree, setSelectedDegree] = useState<string>("")

    const {
        data: degrees = [],
        isLoading,
        error: queryError,
    } = useQuery<Degree[], Error>({
        queryKey: ["degrees"],
        queryFn: () =>
            fetch('/api/degrees').then(res => {
                if (!res.ok) throw new Error(`Error ${res.status}`)
                return res.json()
            }),
    })

    // Initialize selection
    useEffect(() => {
        if (!isLoading && degrees.length > 0 && !selectedDegree) {
            setSelectedDegree(degrees[0].value)
        }
    }, [isLoading, degrees, selectedDegree])

    return (
        <DegreeContext.Provider
            value={{
                degrees,
                loading: isLoading,
                error: queryError ? queryError.message : null,
                selectedDegree,
                setSelectedDegree,
            }}
        >
            {children}
        </DegreeContext.Provider>
    )
}

export function useDegree() {
    const context = useContext(DegreeContext)
    if (!context) throw new Error('useDegree must be used within DegreeProvider')
    return context
}