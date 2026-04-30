// components/course/EditCourseDrawer.tsx
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
import { CourseState, CourseStateManager } from "@/types/Course";

export interface EditCourseFormData {
    courseId: string;
    startYear: number;
    endYear: number;
    state: CourseState;
}

interface EditCourseDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: EditCourseFormData) => Promise<void>;
    courseData?: {
        id: string;
        startYear: number;
        endYear: number;
        state: CourseState;
    };
}

export const EditCourseDrawer = ({
    open,
    onOpenChange,
    onSave,
    courseData
}: EditCourseDrawerProps) => {
    const { t } = useTranslation();
    const [state, setState] = useState<CourseState>(CourseState.PLANIFICADO);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && courseData) {
            setState(courseData.state);
        } else if (!open) {
            setState(CourseState.PLANIFICADO);
            setIsLoading(false);
        }
    }, [open, courseData]);

    const handleSave = async () => {
        if (!courseData) return;
        setIsLoading(true);
        try {
            await onSave({ courseId: courseData.id, startYear: courseData.startYear, endYear: courseData.endYear, state });
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
            title={t("drawer.courses.edit.title")}
            description={t("drawer.courses.edit.description")}
            onSave={handleSave}
            onCancel={() => { if (!isLoading) onOpenChange(false); }}
            isValid={state !== courseData?.state}
            isLoading={isLoading}
            saveLabel={t("drawer.courses.edit.save")}
            cancelLabel={t("drawer.courses.edit.cancel")}
        >
            {courseData && (
                <div className="space-y-3 max-w-sm mx-auto">
                    <Label htmlFor="course-year">{t("drawer.courses.edit.course.year")}</Label>
                    <Select value={`${courseData.startYear}-${courseData.endYear}`} disabled={true}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={`${courseData.startYear}-${courseData.endYear}`}>
                                {courseData.startYear}-{courseData.endYear}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-3 max-w-sm mx-auto">
                <Label htmlFor="course-state">{t("drawer.courses.edit.state.title")}</Label>
                <Select value={state} onValueChange={(value: CourseState) => setState(value)} disabled={isLoading}>
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
