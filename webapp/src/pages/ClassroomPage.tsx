import { Toolbar } from "@/components/Toolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"

export default function ClassroomPage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Aulas", href: "/classrooms" },
        ])
    }, [setItems])

    return (
        <>
            <Toolbar addButtonLabel="Añadir aula" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <ClassroomTable />
                </div>
            </section>
        </>
    )
}