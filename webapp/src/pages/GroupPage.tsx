
import { GroupToolbar } from "@/components/GroupToolbar"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useEffect } from "react"
import { GroupTable } from "@/components/GroupTable"

export default function GroupPage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Títulos", href: "/degrees" },
            { label: "Cursos", href: "/courses" },
            { label: "Grupos", href: "/groups" }
        ])
    }, [setItems])



    return (
        <>
            <GroupToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <GroupTable />
                </div>
            </section>
        </>
    )
}