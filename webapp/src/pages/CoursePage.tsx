
import { CourseToolbar } from "@/components/CourseToolbar"
import { CourseTable } from "@/components/CourseTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useEffect } from "react"

export default function CoursePage() {

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Títulos", href: "/degrees" },
            { label: "Cursos", href: "/courses" },
        ])
    }, [setItems])

    return (
        <>
            <CourseToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <CourseTable />
                </div>
            </section>
        </>
    )
}