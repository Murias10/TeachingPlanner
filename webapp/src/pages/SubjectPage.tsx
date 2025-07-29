import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { Toolbar } from "@/components/Toolbar"
import { SubjectTable } from "@/components/SubjectTable"

export default function SubjectPage() {
    const { setItems } = useBreadcrumb()

    useEffect(() => {
        console.log("Setting breadcrumb items for SubjectPage")
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Asignaturas", href: "/subjects" },
        ])
    }, [setItems])

    return (
        <>
            <Toolbar showDegreeSelector addButtonLabel="Añadir asignatura" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <SubjectTable />
                </div>
            </section>
        </>
    )
}
