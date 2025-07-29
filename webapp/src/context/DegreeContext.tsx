import { createContext, useState, useEffect, ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

// Define the shape of each degree option
export interface Degree {
    id: string
    name: string
    acronym: string
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
export const DegreeContext = createContext<DegreeContextType | undefined>(undefined)

// Provider that fetches degrees via React Query
export function DegreeProvider({ children }: { children: ReactNode }) {
    const [selectedDegree, setSelectedDegree] = useState<string>("all")

    const {
        data: degrees = [],
        isLoading,
        error: queryError,
    } = useQuery<Degree[], Error>({
        queryKey: ["degrees"],
        queryFn: () =>
            fetch("http://localhost:8080/degrees")
                .then(res => {
                    if (!res.ok) throw new Error(`Network error: ${res.status}`);
                    return res.json();
                })
                .then((body: { status: string; data: { degrees: Degree[] } }) => {
                    return body.data.degrees;
                }),
        staleTime: 5 * 60_000,
        retry: 1,
    });

    // Initialize selection
    useEffect(() => {
        if (!isLoading && degrees.length > 0 && !selectedDegree) {
            setSelectedDegree(degrees[0].id)
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

