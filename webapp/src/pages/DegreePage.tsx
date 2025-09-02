
import { DegreeToolbar } from "@/components/DegreeToolbar"
import { DegreeTable } from "@/components/DegreeTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDegrees } from "@/hooks/useDegrees"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useFloatingAlert } from "@/hooks/useFloatingAlert"
import { useLocation } from "react-router-dom"

export default function DegreePage() {

    const { t } = useTranslation()

    const location = useLocation()
    const view = location.state?.view

    const { triggerAlert } = useFloatingAlert()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" }
        ])
    }, [setItems, t])

    const { data: degrees = [], isLoading, error, refetch } = useDegrees()

    const refetchData = () => {
        refetch()
    }

    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const deleteSelectedDegrees = async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(
                selectedIds.map(async (id) => {
                    const response = await fetch(`http://localhost:8080/degree/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        throw new Error(`Error al eliminar titulación con ID ${id}`);
                    }
                })
            );

            refetchData();
            setSelectedIds([]);

        } catch (err) {
            console.error("Error al eliminar titulaciones:", err);

        }
    };

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.degree.error.title"),
                description: t("alerts.degree.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    return (
        <>
            {view === "degrees" && (
                <DegreeToolbar refetchData={refetchData} deleteSelectedDegrees={deleteSelectedDegrees} selectedIds={selectedIds} />
            )}
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <DegreeTable degrees={degrees} refetchData={refetchData} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
        </>
    )
}