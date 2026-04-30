// components/course/CreateCourseDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { CourseState, CourseStateManager, CourseFormData } from "@/types/Course";

interface CreateCourseDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: CourseFormData) => Promise<void>;
}

const generateYearOptions = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = -10; i <= 10; i++) {
        const start = currentYear + i;
        years.push(`${start}-${start + 1}`);
    }
    return years;
};

export const CreateCourseDrawer = ({
    open,
    onOpenChange,
    onSave
}: CreateCourseDrawerProps) => {
    const { t } = useTranslation();
    const [selectedYearRange, setSelectedYearRange] = useState("");
    const [state, setState] = useState<CourseState>(CourseState.PLANIFICADO);
    const [isLoading, setIsLoading] = useState(false);

    const yearOptions = generateYearOptions();

    useEffect(() => {
        if (!open) {
            setSelectedYearRange("");
            setState(CourseState.PLANIFICADO);
            setIsLoading(false);
        }
    }, [open]);

    const handleSave = async () => {
        if (!selectedYearRange) return;
        setIsLoading(true);
        try {
            const [startYear, endYear] = selectedYearRange.split('-');
            await onSave({ startYear: startYear.trim(), endYear: endYear.trim(), state });
        } catch (error) {
            console.error('Error saving course:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.courses.create.title")}
            description={t("drawer.courses.create.description")}
            onSave={handleSave}
            onCancel={() => { if (!isLoading) onOpenChange(false); }}
            isValid={selectedYearRange.trim() !== ""}
            isLoading={isLoading}
            saveLabel={t("drawer.courses.create.save")}
            cancelLabel={t("drawer.courses.create.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto">
                <Label htmlFor="course-start-end-year">
                    {t("drawer.courses.create.start.end.year.title")}
                </Label>
                <Select value={selectedYearRange} onValueChange={setSelectedYearRange} disabled={isLoading}>
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

            <div className="space-y-3 max-w-sm mx-auto">
                <Label htmlFor="course-state">{t("drawer.courses.create.state.title")}</Label>
                <Select value={state} onValueChange={(value: CourseState) => setState(value)} disabled={true}>
                    <SelectTrigger className="w-full">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`text-xs ${CourseStateManager.getStateColor(state)}`}>
                                    {t(`drawer.courses.create.states.${state.toLowerCase()}`)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {CourseStateManager.getStateDescription(state)}
                                </span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(CourseState).map((stateOption) => (
                            <SelectItem key={stateOption} value={stateOption}>
                                <div className="flex items-center gap-3 py-1">
                                    <Badge variant="secondary" className={`text-xs ${CourseStateManager.getStateColor(stateOption)}`}>
                                        {t(`drawer.courses.create.states.${stateOption.toLowerCase()}`)}
                                    </Badge>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {t(`drawer.courses.create.states.${stateOption.toLowerCase()}`)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {CourseStateManager.getStateDescription(stateOption)}
                                        </span>
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{t("drawer.courses.create.state.info.title")}:</p>
                            <p className="text-xs text-muted-foreground">
                                {t("drawer.courses.create.states.planificado")} → {t("drawer.courses.create.states.activo")} → {t("drawer.courses.create.states.finalizado")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t("drawer.courses.create.state.info.description")}
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        </FormDrawer>
    );
};
