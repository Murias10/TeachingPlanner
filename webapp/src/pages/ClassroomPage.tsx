import { useCallback, useEffect, useState } from "react"
import { ClassroomToolbar } from "@/components/ClassroomToolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useClassrooms } from "@/hooks/useClassrooms"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"
import { CreateClassroomDrawer } from "@/components/CreateClassroomDrawer"

export default function ClassroomPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.classrooms"), href: "/classrooms" },
        ])
    }, [setItems, t])

    const { data: classrooms = [], isLoading, error, refetch } = useClassrooms()

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [openDrawer, setOpenDrawer] = useState(false);
    const [code, setCode] = useState("");
    const [gisUrl, setGisUrl] = useState("");

    const handleDeleteSelectedClassrooms = async () => {
        if (selectedIds.length === 0) return;

        for (const id of selectedIds) {
            await handleDelete(id);
        }

        refetchData();
        setSelectedIds([]);
    };

    const handleDelete = async (classroomId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/classroom/${classroomId}`, {
                method: "DELETE"
            });

            if (!res.ok) {

                switch (res.status) {
                    case 404:
                        triggerAlert({
                            title: t("alerts.classroom.error.title"),
                            description: t("alerts.classroom.error.notFound"),
                            variant: "destructive"
                        });
                        break;

                    case 409:
                        triggerAlert({
                            title: t("alerts.classroom.error.title"),
                            description: t("alerts.classroom.error.hasEvents"),
                            variant: "destructive"
                        });
                        break;

                    default:
                        triggerAlert({
                            title: t("alerts.classroom.error.title"),
                            description: t("alerts.classroom.error.default"),
                            variant: "destructive"
                        });
                        break;
                }

                return;
            }

            triggerAlert({
                title: t("alerts.classroom.success.delete.title"),
                description: t("alerts.classroom.success.delete.description"),
                variant: "success"
            });

            refetchData();

        } catch {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.network"),
                variant: "destructive"
            });
        }
    };

    const handleSaveClassroom = async () => {
        try {
            const response = await fetch("http://localhost:8080/classroom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, gisUrl })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Error al guardar aula:", errorBody);

                if (response.status === 409) {
                    triggerAlert({
                        title: "Error",
                        description: "Ya existe un aula con ese código.",
                        variant: "destructive"
                    });
                }
                return;
            }

            if (refetchData) {
                refetchData();
            }

            setCode("");
            setGisUrl("");
            setOpenDrawer(false);

            triggerAlert({
                title: "Aula creada",
                description: `Aula ${code} creada correctamente.`,
                variant: "success"
            });

        } catch (error) {
            console.error("Error de red:", error);
        }
    };

    const refetchData = useCallback(() => {
        refetch()
    }, [refetch])

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
        refetchData();
    }, [error, t, triggerAlert, refetchData])

    return (
        <>
            <ClassroomToolbar setOpenDrawer={setOpenDrawer} deleteSelectedClassrooms={handleDeleteSelectedClassrooms} selectedIds={selectedIds} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <ClassroomTable classrooms={classrooms} deleteClassroom={handleDelete} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
            <CreateClassroomDrawer
                open={openDrawer}
                onOpenChange={setOpenDrawer}
                code={code}
                setCode={setCode}
                gisUrl={gisUrl}
                setGisUrl={setGisUrl}
                onSave={handleSaveClassroom}
            />
        </>
    )
}
