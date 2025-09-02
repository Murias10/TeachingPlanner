import { useEffect, useState } from "react"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { SubjectTable } from "@/components/SubjectTable"
import { SubjectToolbar } from "@/components/SubjectToolbar"
import { useTranslation } from "react-i18next"
import { useFloatingAlert } from "@/hooks/useFloatingAlert"
import { useSubjects } from "@/hooks/useSubjects"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function SubjectPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlert()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.subjects"), href: "/subjects" },
        ])
    }, [setItems, t])

    const { data: subjects = [], isLoading, error, refetch } = useSubjects()

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const deleteSelectedSubjects = async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(
                selectedIds.map(async (id) => {
                    const response = await fetch(`http://localhost:8080/subject/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        throw new Error(`Error al eliminar asignatura con ID ${id}`);
                    }
                })
            );

            refetchData();
            setSelectedIds([]);

        } catch (err) {
            console.error("Error al eliminar asignatura:", err);

        }
    };

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.subject.error.title"),
                description: t("alerts.subject.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    const refetchData = () => {
        refetch()
    }

    return (
        <>
            <SubjectToolbar refetchData={refetchData} deleteSelectedSubjects={deleteSelectedSubjects} selectedIds={selectedIds} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <SubjectTable subjects={subjects} refetchData={refetchData} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
        </>
    )
}
