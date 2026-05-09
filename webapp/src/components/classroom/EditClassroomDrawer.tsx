import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/RequiredLabel";
import { Input } from "@/components/ui/input";
import { FormDrawer } from "@/components/ui/FormDrawer";

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
            await onSave({ classroomId: classroomData.id, code: classroomData.code, gisUrl: gisUrl.trim() });
        } catch (error) {
            console.error('Error saving classroom:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = gisUrl.trim() !== "" && gisUrl.trim() !== classroomData?.gisUrl;

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.classrooms.edit.title")}
            description={t("drawer.classrooms.edit.description")}
            onSave={handleSave}
            onCancel={() => { if (!isLoading) onOpenChange(false); }}
            isValid={isFormValid}
            isLoading={isLoading}
            saveLabel={t("drawer.classrooms.edit.save")}
            cancelLabel={t("drawer.classrooms.edit.cancel")}
        >
            {classroomData && (
                <div className="space-y-3 max-w-sm mx-auto">
                    <Label htmlFor="classroom-code">{t("drawer.classrooms.edit.code")}</Label>
                    <Input id="classroom-code" value={classroomData.code} disabled className="bg-muted" />
                </div>
            )}
            <div className="space-y-3 max-w-sm mx-auto">
                <RequiredLabel htmlFor="classroom-gis-url" required>{t("drawer.classrooms.edit.gisUrl")}</RequiredLabel>
                <Input
                    id="classroom-gis-url"
                    type="text"
                    value={gisUrl}
                    onChange={(e) => setGisUrl(e.target.value)}
                    placeholder={t("drawer.classrooms.edit.gisUrl.placeholder")}
                    disabled={isLoading}
                />
            </div>
        </FormDrawer>
    );
};
