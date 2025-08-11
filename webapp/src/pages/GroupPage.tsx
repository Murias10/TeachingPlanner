
import { Toolbar } from "@/components/Toolbar"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useEffect } from "react"


export default function GroupPage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Cursos", href: "/courses" },
            { label: "Grupos", href: "/groups" }
        ])
    }, [setItems])

    return (
        <>
            <Toolbar showDegreeSelector addButtonLabel="Añadir curso" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Página de Grupos</h1>
                </div>
            </section>
        </>
    )
}