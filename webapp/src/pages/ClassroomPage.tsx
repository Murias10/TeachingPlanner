import { ClassroomToolbar } from "@/components/ClassroomToolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useClassrooms } from "@/hooks/useClassrooms"

export default function ClassroomPage() {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Aulas", href: "/classrooms" },
        ])

    }, [setItems])

    const { data: classrooms = [], isLoading, error, refetch } = useClassrooms();

    const handleClassroomAdded = () => {
        refetch(); // recarga después de añadir
    };

    return (
        <>
            <ClassroomToolbar onClassroomAdded={handleClassroomAdded} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <ClassroomTable classrooms={classrooms} />
                    {isLoading && (
                        <div className="text-sm text-muted-foreground py-4">Loading classrooms...</div>
                    )}
                    {error && (
                        <div className="text-sm text-red-500 py-4">Error: {error.message}</div>
                    )}
                </div>
            </section>
        </>
    )
}