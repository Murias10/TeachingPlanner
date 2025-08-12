import MyCalendar from "@/components/MyCalendar";
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useEffect } from "react"

export default function CoursePage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Títulos", href: "/degrees" },
            { label: "Cursos", href: "/courses" },
            { label: "Calendario", href: "/calendar" },
        ])
    }, [setItems])

    return (
        <>

            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <MyCalendar />
                </div>
            </section>
        </>
    )
}