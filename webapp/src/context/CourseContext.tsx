// src/context/CourseContext.tsx
import React, { createContext, useContext, useState } from "react"

type CourseContextType = {
    courseId: string | null
    semester: number
    setCourseId: (id: string) => void
    setSemester: (semester: number) => void
}

const CourseContext = createContext<CourseContextType | undefined>(undefined)

export function CourseProvider({ children }: { children: React.ReactNode }) {
    const [courseId, setCourseId] = useState<string | null>(null)
    const [semester, setSemester] = useState<number>(1)

    return (
        <CourseContext.Provider
            value={{
                courseId,
                semester,
                setCourseId,
                setSemester,
            }}
        >
            {children}
        </CourseContext.Provider>
    )
}

export function useCourseContext() {
    const ctx = useContext(CourseContext)
    if (!ctx) {
        throw new Error("useCourseContext must be used within CourseProvider")
    }
    return ctx
}
