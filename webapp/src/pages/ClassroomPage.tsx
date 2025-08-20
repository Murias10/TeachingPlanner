import { useEffect, useState } from "react"
import { ClassroomToolbar } from "@/components/ClassroomToolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useClassrooms } from "@/hooks/useClassrooms"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import { useFloatingAlert } from "@/hooks/useFloatingAlert"

export default function ClassroomPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlert()

    const { setItems } = useBreadcrumbContext()
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("breadcrumb.classrooms"), href: "/classrooms" },
        ])
    }, [setItems, t])

    const { data: classrooms = [], isLoading, error, refetch } = useClassrooms()

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const deleteSelectedClassrooms = async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(
                selectedIds.map(async (id) => {
                    const response = await fetch(`http://localhost:8080/classroom/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        throw new Error(`Error al eliminar aula con ID ${id}`);
                    }
                })
            );

            refetchData();
            setSelectedIds([]);

        } catch (err) {
            console.error("Error al eliminar aulas:", err);

        }
    };

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    const refetchData = () => {
        refetch()
    }

    return (
        <>
            <ClassroomToolbar refetchData={refetchData} deleteSelectedClassrooms={deleteSelectedClassrooms} selectedIds={selectedIds} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <ClassroomTable classrooms={classrooms} refetchData={refetchData} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
        </>
    )
}
