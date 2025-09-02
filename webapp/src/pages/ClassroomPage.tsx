import { useEffect, useState } from "react"
import { ClassroomToolbar } from "@/components/ClassroomToolbar"
import { ClassroomTable } from "@/components/ClassroomTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useClassrooms } from "@/hooks/useClassrooms"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"

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

    const refetchData = () => {
        refetch()
    }

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    return (
        <>
            <ClassroomToolbar setOpenDrawer={setOpenDrawer} deleteSelectedClassrooms={handleDeleteSelectedClassrooms} selectedIds={selectedIds} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <ClassroomTable classrooms={classrooms} deleteClassroom={handleDelete} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
            <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>{t("drawer.classrooms.create.title")}</DrawerTitle>
                        <DrawerDescription>
                            {t("drawer.classrooms.create.description")}
                        </DrawerDescription>
                    </DrawerHeader>

                    {/* Contenido desplazable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="classroom-code">{t("drawer.classrooms.create.code")}</Label>
                            <Input
                                id="classroom-code"
                                name="classroom-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ej: A-2-01"
                            />
                        </div>
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="classroom-gis-url">{t("drawer.classrooms.create.gisUrl")}</Label>
                            <Input
                                id="classroom-gis-url"
                                name="classroom-gis-url"
                                value={gisUrl}
                                onChange={(e) => setGisUrl(e.target.value)}
                                placeholder="Ej: gis.uniovi.es/GISUniovi/GeoLoc.do?codEspacio=..."
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline" onClick={() => {
                                setCode("")
                                setGisUrl("")
                            }}>{t("drawer.classrooms.create.cancel")}</Button>
                        </DrawerClose>
                        <Button onClick={handleSaveClassroom} disabled={!code || !gisUrl}>  {t("drawer.classrooms.create.save")}</Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}
