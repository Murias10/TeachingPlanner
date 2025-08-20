import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { CirclePlus, Trash2 } from "lucide-react";
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext";

interface ClassroomToolbarProps {
    refetchData?: () => void;
    deleteSelectedClassrooms?: () => void;
    selectedIds?: string[];
}

export function ClassroomToolbar({ refetchData, deleteSelectedClassrooms, selectedIds }: ClassroomToolbarProps) {

    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");
    const [gisUrl, setGisUrl] = useState("");
    const { t } = useTranslation();
    const { triggerAlert } = useFloatingAlertContext()


    const handleSave = async () => {
        try {
            const response = await fetch("http://localhost:8080/classroom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, gisUrl })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Error al guardar aula:", errorBody);
                return;
            }

            const result = await response.json();
            console.log("Aula guardada:", result);

            if (refetchData) {
                refetchData();
            }

            setCode("");
            setGisUrl("");
            setOpen(false);
            triggerAlert({
                title: "Aula creada",
                description: `Aula ${code} creada correctamente.`,
                variant: "success"
            });

        } catch (error) {
            console.error("Error de red:", error);
        }
    };

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="sm" className="mr-2" onClick={deleteSelectedClassrooms}
                            disabled={!selectedIds?.length}>
                            <Trash2 /> {t("toolbar.classrooms.delete.selected")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.delete.selected")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                            <CirclePlus />{t("toolbar.classrooms.create")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.create")}
                    </TooltipContent>
                </Tooltip>
            </div>

            <Drawer open={open} onOpenChange={setOpen}>
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
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ej: A-2-01"
                            />
                        </div>
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="classroom-gis-url">{t("drawer.classrooms.create.gisUrl")}</Label>
                            <Input
                                id="classroom-gis-url"
                                value={gisUrl}
                                onChange={(e) => setGisUrl(e.target.value)}
                                placeholder="Ej: gis.uniovi.es/GISUniovi/GeoLoc.do?codEspacio=..."
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline">{t("drawer.classrooms.create.cancel")}</Button>
                        </DrawerClose>
                        <Button onClick={handleSave}>{t("drawer.classrooms.create.save")}</Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </section>
    );
}
