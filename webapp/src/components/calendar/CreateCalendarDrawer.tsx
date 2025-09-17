// components/calendar/CreateCalendarDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";

interface CalendarFormData {
    courseId: string;
    semester: number;
}

interface CreateCalendarDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: CalendarFormData) => Promise<void>;
    courseId?: string;
    semester?: number;
    courseYear?: string; // Para mostrar en el título
}

export const CreateCalendarDrawer = ({
    open,
    onOpenChange,
    onSave,
    courseId,
    semester,
    courseYear
}: CreateCalendarDrawerProps) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setIsLoading(false);
        }
    }, [open]);

    const handleSave = async () => {
        if (!courseId || !semester) return;

        setIsLoading(true);

        try {
            await onSave({
                courseId,
                semester
            });
        } catch (error) {
            console.error('Error saving calendar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    const isFormValid = courseId && semester;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>
                        {t("drawer.calendar.create.title")}
                    </DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.calendar.create.description", {
                            year: courseYear,
                            semester: semester
                        })}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Por ahora vacío, se puede añadir contenido futuro aquí */}
                    <div className="text-center text-muted-foreground">
                        {t("drawer.calendar.create.content.placeholder")}
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
                            {t("drawer.calendar.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button
                        disabled={!isFormValid || isLoading}
                        onClick={handleSave}
                    >
                        {isLoading
                            ? t("drawer.calendar.create.saving")
                            : t("drawer.calendar.create.save")
                        }
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};