import { useEffect, useState } from "react"
import { ClassroomToolbar } from "@/components/ClassroomToolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import { useClassrooms } from "@/hooks/useClassrooms"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import clsx from "clsx"

export default function ClassroomPage() {
    const { setItems } = useBreadcrumb()
    const { data: classrooms = [], isLoading, error, refetch } = useClassrooms()

    const [showError, setShowError] = useState(false)

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Aulas", href: "/classrooms" },
        ])
    }, [setItems])

    useEffect(() => {
        if (error) {
            setShowError(true)
            const timer = setTimeout(() => setShowError(false), 7500)
            return () => clearTimeout(timer)
        }
    }, [error])

    const handleClassroomAdded = () => {
        refetch()
    }

    return (
        <>
            <ClassroomToolbar onClassroomAdded={handleClassroomAdded} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <ClassroomTable classrooms={classrooms} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>

            <div
                className={clsx(
                    "fixed left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 transition-all duration-1000",
                    showError ? "bottom-4 opacity-100" : "-bottom-20 opacity-0"
                )}
            >
                <Alert variant="destructive" className="shadow-lg">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {"Ha ocurrido un error al cargar las aulas. Inténtalo de nuevo más tarde."}
                    </AlertDescription>
                </Alert>
            </div>
        </>
    )
}
