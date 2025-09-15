// components/CreateCourseDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    SelectItem,
} from "@/components/ui/select";

interface CourseFormData {
    startYear: string;
    endYear: string;
    state: string;
}

interface CreateCourseDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: CourseFormData) => Promise<void>;
}

const STATES = ["active", "inactive", "archived"];

const generateYearOptions = (): string[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => {
        const start = currentYear + i;
        return `${start}-${start + 1}`;
    });
};

export const CreateCourseDrawer = ({
    open,
    onOpenChange,
    onSave
}: CreateCourseDrawerProps) => {
    const { t } = useTranslation();
    const [selectedYearRange, setSelectedYearRange] = useState("");
    const [state, setState] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const yearOptions = generateYearOptions();

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setSelectedYearRange("");
            setState("");
            setIsLoading(false);
        }
    }, [open]);

    const handleSave = async () => {
        if (!selectedYearRange || !state) return;

        setIsLoading(true);

        try {
            // Extraer startYear y endYear del formato "YYYY-YYYY"
            const [startYear, endYear] = selectedYearRange.split('-');

            await onSave({
                startYear: startYear.trim(),
                endYear: endYear.trim(),
                state
            });
        } catch (error) {
            console.error('Error saving course:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    const isFormValid = selectedYearRange.trim() !== "" && state.trim() !== "";

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("drawer.courses.create.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.courses.create.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Select de año académico */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="course-start-end-year">
                            {t("drawer.courses.create.start.end.year")}
                        </Label>
                        <Select
                            value={selectedYearRange}
                            onValueChange={setSelectedYearRange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("drawer.courses.create.start.end.year.placeholder")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-55">
                                {yearOptions.map((yearOption) => (
                                    <SelectItem key={yearOption} value={yearOption}>
                                        {yearOption}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Select de estado */}
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="course-state">
                            {t("drawer.courses.create.state")}
                        </Label>
                        <Select
                            value={state}
                            onValueChange={setState}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("drawer.courses.create.state.placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                {STATES.map((stateOption) => (
                                    <SelectItem key={stateOption} value={stateOption}>
                                        {t(`drawer.courses.create.states.${stateOption}`) ||
                                            stateOption.charAt(0).toUpperCase() + stateOption.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            {t("drawer.courses.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button
                        disabled={!isFormValid || isLoading}
                        onClick={handleSave}
                    >
                        {t("drawer.courses.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};