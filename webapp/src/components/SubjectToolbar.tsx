import { Button } from "@/components/ui/button";
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CirclePlus, Trash2 } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDegreeContext } from "@/context/useDegreeContext";

interface SubjectToolbarProps {
    refetchData?: () => void;
    deleteSelectedSubjects?: () => void;
    selectedIds?: string[];
}

export function SubjectToolbar({ refetchData, deleteSelectedSubjects, selectedIds }: SubjectToolbarProps) {

    const { t } = useTranslation()

    const { degreeId } = useDegreeContext();

    const [open, setOpen] = useState<boolean>(false);
    const [acronym, setAcronym] = useState<string>();
    const [year, setYear] = useState<number | null>();
    const [name, setName] = useState<string>();
    const [siesCode, setSiesCode] = useState<string>();
    const [semester, setSemester] = useState<number | null>();


    const { triggerAlert } = useFloatingAlertContext()

    const handleSave = async () => {

        try {
            const response = await fetch("http://localhost:8080/subject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    acronym,
                    year,
                    name,
                    siesCode,
                    semester,
                    degree: {
                        id: degreeId
                    }
                })
            })

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

            setAcronym("")
            setName("")
            setSemester(null)
            setSiesCode("")
            setYear(null)
            setOpen(false);

            triggerAlert({
                title: "Asignatura creada",
                description: `Asignatura "${name}" creada correctamente.`,
                variant: "success"
            });

        } catch (err) {
            console.error("Error de red:", err);
        }
    }

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4" >
            <div className="flex-1 flex justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="lg" className="mr-2" onClick={deleteSelectedSubjects}
                            disabled={!selectedIds?.length}>
                            <Trash2 /> {t("toolbar.subjects.delete.selected")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.subjects.delete.selected")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
                            <CirclePlus />{t("toolbar.subjects.create")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.subjects.create")}
                    </TooltipContent>
                </Tooltip>
            </div>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>{t("drawer.subjects.create.title")}</DrawerTitle>
                        <DrawerDescription>
                            {t("drawer.subjects.create.description")}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="subjects-name">{t("drawer.subjects.create.name")}</Label>
                            <Input
                                id="subjects-name"
                                name="subjects-name"
                                value={name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^[A-ZÁÉÍÓÚÑ\s]*$/.test(value.toUpperCase())) {
                                        setName(value);
                                    }
                                }}
                                placeholder="Ej: Introducción a la Programación"
                            />
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="subjects-acronym">{t("drawer.subjects.create.acronym")}</Label>
                            <Input
                                id="subjects-acronym"
                                name="subjects-acronym"
                                value={acronym}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^[A-Z]*$/.test(value)) {
                                        setAcronym(value);
                                    }
                                }}
                                placeholder="Ej: IP (solo letras mayúsculas)"
                            />
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="subjects-year">{t("drawer.subjects.create.year")}</Label>
                            <Select
                                onValueChange={(value) => setYear(Number(value))}
                                value={year !== null ? String(year) : ""}
                            >
                                <SelectTrigger id="subjects-year" className="w-full">
                                    <SelectValue placeholder="Selecciona el año" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t("table.subjects.year.1")}</SelectItem>
                                    <SelectItem value="2">{t("table.subjects.year.2")}</SelectItem>
                                    <SelectItem value="3">{t("table.subjects.year.3")}</SelectItem>
                                    <SelectItem value="4">{t("table.subjects.year.4")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="subject-semester">{t("drawer.subjects.create.semester")}</Label>
                            <Select
                                onValueChange={(value) => setSemester(Number(value))}
                                value={semester !== null ? String(semester) : ""}
                            >
                                <SelectTrigger id="subject-semester" className="w-full">
                                    <SelectValue placeholder="Selecciona el semestre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t("table.subjects.semester.1")}</SelectItem>
                                    <SelectItem value="2">{t("table.subjects.semester.2")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="subject-sies-code">{t("drawer.subjects.create.siesCode")}</Label>
                            <Input
                                id="subject-sies-code"
                                name="subject-sies-code"
                                value={siesCode}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,4}$/.test(value)) {
                                        setSiesCode(value);
                                    }
                                }}
                                placeholder="Ej: 2234 (número de 4 dígitos)"
                            />
                        </div>
                    </div>

                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAcronym("");
                                    setYear(null);
                                    setName("");
                                    setSiesCode("");
                                    setSemester(null);
                                }}
                            >
                                {t("drawer.subjects.create.cancel")}
                            </Button>
                        </DrawerClose>
                        <Button onClick={handleSave}>{t("drawer.subjects.create.save")}</Button>
                    </div>
                </DrawerContent>
            </Drawer>



        </section >
    )
}
