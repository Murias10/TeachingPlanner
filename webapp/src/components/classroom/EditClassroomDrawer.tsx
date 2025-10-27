// components/classroom/EditClassroomDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";

export interface EditClassroomFormData {
    classroomId: string;
    code: string;
    gisUrl: string;
}

interface EditClassroomDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: EditClassroomFormData) => Promise<void>;
    classroomData?: {
        id: string;
        code: string;
        gisUrl: string;
    };
}

export const EditClassroomDrawer = ({
    open,
    onOpenChange,
    onSave,
    classroomData
}: EditClassroomDrawerProps) => {
    const { t } = useTranslation();
    const [gisUrl, setGisUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when drawer closes or classroomData changes
    useEffect(() => {
        if (open && classroomData) {
            setGisUrl(classroomData.gisUrl);
        } else if (!open) {
            setGisUrl("");
            setIsLoading(false);
        }
    }, [open, classroomData]);

    const handleSave = async () => {
        if (!classroomData) return;

        setIsLoading(true);

        try {
            await onSave({
                classroomId: classroomData.id,
                code: classroomData.code,
                gisUrl: gisUrl.trim()
            });
        } catch (error) {
            console.error('Error saving classroom:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    const isFormValid = gisUrl.trim() !== "" && gisUrl.trim() !== classroomData?.gisUrl;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("drawer.classrooms.edit.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.classrooms.edit.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Código de aula (desactivado) */}
                    {classroomData && (
                        <div className="space-y-3 max-w-sm mx-auto">
                            <Label htmlFor="classroom-code">
                                {t("drawer.classrooms.edit.code")}
                            </Label>
                            <Input
                                id="classroom-code"
                                value={classroomData.code}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Campo GIS URL */}
                    <div className="space-y-3 max-w-sm mx-auto">
                        <Label htmlFor="classroom-gis-url">
                            {t("drawer.classrooms.edit.gisUrl")}
                        </Label>
                        <Input
                            id="classroom-gis-url"
                            type="text"
                            value={gisUrl}
                            onChange={(e) => setGisUrl(e.target.value)}
                            placeholder={t("drawer.classrooms.edit.gisUrl.placeholder")}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t("drawer.classrooms.edit.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button
                        disabled={!isFormValid || isLoading}
                        onClick={handleSave}
                    >
                        {t("drawer.classrooms.edit.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
