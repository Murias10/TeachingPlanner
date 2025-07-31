
import { Toolbar } from "@/components/Toolbar"
import { CourseTable } from "@/components/CourseTable"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useEffect } from "react"

export default function CoursePage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Cursos", href: "/courses" },
        ])
    }, [setItems])

    return (
        <>
            <Toolbar showDegreeSelector addButtonLabel="Añadir curso" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <CourseTable />
                </div>
            </section>
        </>
    )
}