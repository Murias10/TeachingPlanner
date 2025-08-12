
import { DegreeToolbar } from "@/components/DegreeToolbar"
import { DegreeTable } from "@/components/DegreeTable"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useEffect } from "react"


export default function DegreePage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Títulos", href: "/degrees" }
        ])
    }, [setItems])

    return (
        <>
            <DegreeToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <DegreeTable />
                </div>
            </section>
        </>
    )
}