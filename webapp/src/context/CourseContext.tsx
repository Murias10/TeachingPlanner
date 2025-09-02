import React, { useState } from "react"
import { CourseContext } from "@/context/CourseContextInstance"

export type CourseContextType = {
    courseId: string | null
    semester: number
    setCourseId: (id: string) => void
    setSemester: (semester: number) => void
}

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

