import MyCalendar from "@/components/MyCalendar";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect } from "react"

export default function CoursePage() {

    const { setItems } = useBreadcrumbContext()

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

            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <MyCalendar />
            </section>
        </>
    )
}