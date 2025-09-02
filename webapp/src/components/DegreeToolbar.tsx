import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { CirclePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext";
import { useLocation } from "react-router-dom";

interface DegreeToolbarProps {
    refetchData?: () => void;
    deleteSelectedDegrees?: () => void;
    selectedIds?: string[];
}

export function DegreeToolbar({ refetchData, deleteSelectedDegrees, selectedIds }: DegreeToolbarProps) {

    const { t } = useTranslation();

    const location = useLocation()
    const view = location.state?.view

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");

    const { triggerAlert } = useFloatingAlertContext()

    const handleSave = async () => {
        try {
            const response = await fetch("http://localhost:8080/degree", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, acronym })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Error al guardar titulación:", errorBody);

                if (response.status === 409) {
                    triggerAlert({
                        title: "Error",
                        description: "Ya existe una titulación con ese nombre o acrónimo.",
                        variant: "destructive"
                    });
                }
                return;
            }

            setOpen(false);
            setName("");
            setAcronym("");

            if (refetchData) {
                refetchData();
            }

            triggerAlert({
                title: t("alerts.degree.success.title"),
                description: t("alerts.degree.success.create"),
                variant: "success"
            });

        } catch (error) {
            console.error("Error al guardar titulación:", error);
            triggerAlert({
                title: t("alerts.degree.error.title"),
                description: t("alerts.degree.error.create"),
                variant: "destructive"
            });
        }
    };

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4" >
            <div className="flex-1 flex justify-end">

                {view === "degrees" && (

                    <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" size="lg" className="mr-2" onClick={deleteSelectedDegrees}
                                    disabled={!selectedIds?.length}>
                                    <Trash2 /> {t("toolbar.degrees.delete.selected")}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("toolbar.degrees.delete.selected")}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
                                    <CirclePlus />{t("toolbar.degrees.create")}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("toolbar.degrees.create")}
                            </TooltipContent>
                        </Tooltip>
                    </>
                )}


            </div>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>{t("drawer.degrees.create.title")}</DrawerTitle>
                        <DrawerDescription>
                            {t("drawer.degrees.create.description")}
                        </DrawerDescription>
                    </DrawerHeader>

                    {/* Contenido desplazable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="degree-name">{t("drawer.degrees.create.name")}</Label>
                            <Input
                                id="degree-name"
                                name="degree-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Máster de Ingeniería Web"
                            />
                        </div>
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="degree-acronym">{t("drawer.degrees.create.acronym")}</Label>
                            <Input
                                id="degree-acronym"
                                name="degree-acronym"
                                value={acronym}
                                onChange={(e) => setAcronym(e.target.value)}
                                placeholder="Ej: MIW"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline" onClick={() => {
                                setName("")
                                setAcronym("")
                            }}>{t("drawer.degrees.create.cancel")}</Button>
                        </DrawerClose>
                        <Button onClick={handleSave}>{t("drawer.degrees.create.save")}</Button>
                    </div>
                </DrawerContent>
            </Drawer>

        </section>
    )
}
