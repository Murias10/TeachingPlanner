import { useEffect } from "react"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { Toolbar } from "@/components/Toolbar"
import { SubjectTable } from "@/components/SubjectTable"

export default function SubjectPage() {
    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
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
