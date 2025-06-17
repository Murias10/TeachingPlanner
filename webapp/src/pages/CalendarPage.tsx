// src/app/calendar/page.tsx
"use client"

import { useState } from "react"
import { DegreeSelect, Degree } from "@/components/DegreeSelect"
import { CourseTable, CourseRecord } from "@/components/CourseTable"

export default function CalendarPage() {
    const degrees: Degree[] = [
        { value: "software", label: "Grado en Ingeniería Informática del Software" },
        { value: "bioinfo", label: "Grado en Bioinformática" },
        // …
    ]
    const [selectedDegree, setSelectedDegree] = useState<string>(degrees[0].value)

    // Simula tu fetch según el grado seleccionado
    const courses: CourseRecord[] = [
        { course: "2021-2022", status: "Finished" },
        { course: "2022-2023", status: "Finished" },
        { course: "2023-2024", status: "Finished" },
        { course: "2024-2025", status: "Ongoing" },
    ]

    function handleSemester(course: string, sem: 1 | 2) {
        console.log("Ir a:", { selectedDegree, course, sem })
        // router.push(`/calendar/${selectedDegree}/${course}/semester-${sem}`)
    }

    return (
        <>
            <section className="flex-1 h-14 rounded-xl bg-muted/50 flex items-center justify-start mt-2 mr-2 ml-2 p-3">
                <DegreeSelect
                    degrees={degrees}
                    value={selectedDegree}
                    onChange={setSelectedDegree}
                />
            </section>

            <section className=" h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <CourseTable
                        data={courses}
                        onSemesterClick={handleSemester}
                    />
                </div>
            </section >
        </>
    )
}
