// components/subject/ViewSubjectDrawer.tsx
import { useTranslation } from "react-i18next";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Subject } from "@/types/Subject";

interface ViewSubjectDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjectData?: Subject;
}

export function ViewSubjectDrawer({ open, onOpenChange, subjectData }: ViewSubjectDrawerProps) {
    const { t } = useTranslation();

    if (!subjectData) return null;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("drawer.subjects.view.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.subjects.view.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-name">
                            {t("drawer.subjects.view.name")}
                        </Label>
                        <Input
                            id="view-subject-name"
                            value={subjectData.name}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Acrónimo */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-acronym">
                            {t("drawer.subjects.view.acronym")}
                        </Label>
                        <Input
                            id="view-subject-acronym"
                            value={subjectData.acronym}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Año */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-year">
                            {t("drawer.subjects.view.year")}
                        </Label>
                        <Input
                            id="view-subject-year"
                            value={t(`table.subjects.year.${subjectData.year}`)}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Semestre */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-semester">
                            {t("drawer.subjects.view.semester")}
                        </Label>
                        <Input
                            id="view-subject-semester"
                            value={t(`table.subjects.semester.${subjectData.semester}`)}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Código SIES */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-siesCode">
                            {t("drawer.subjects.view.siesCode")}
                        </Label>
                        <Input
                            id="view-subject-siesCode"
                            value={subjectData.siesCode}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Número de grupos */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="view-subject-groups">
                            {t("drawer.subjects.view.groups")}
                        </Label>
                        <Input
                            id="view-subject-groups"
                            value={`${subjectData.groups?.length || 0} ${t("drawer.subjects.view.groupsCount")}`}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>
                </div>

                {/* Botón de cerrar */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline">
                            {t("drawer.subjects.view.close")}
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
