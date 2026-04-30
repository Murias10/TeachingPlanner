import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/ui/FormDrawer";

export interface EditDegreeFormData {
    degreeId: string;
    name: string;
    acronym: string;
}

interface EditDegreeDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: EditDegreeFormData) => Promise<void>;
    degreeData?: {
        id: string;
        name: string;
        acronym: string;
    };
}

export function EditDegreeDrawer({ open, onOpenChange, onSave, degreeData }: EditDegreeDrawerProps) {
    const { t } = useTranslation();

    const [name, setName] = useState<string>("");
    const [acronym, setAcronym] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && degreeData) {
            setName(degreeData.name);
            setAcronym(degreeData.acronym);
        } else if (!open) {
            setName("");
            setAcronym("");
            setIsLoading(false);
        }
    }, [open, degreeData]);

    const handleSave = async () => {
        if (!name || !acronym || !degreeData) return;
        setIsLoading(true);
        try {
            await onSave({ degreeId: degreeData.id, name, acronym });
        } catch (error) {
            console.error('Error saving degree:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid =
        name &&
        acronym &&
        degreeData && (name !== degreeData.name || acronym !== degreeData.acronym);

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.degrees.edit.title")}
            description={t("drawer.degrees.edit.description")}
            onSave={handleSave}
            onCancel={() => { if (!isLoading) onOpenChange(false); }}
            isValid={!!isFormValid}
            isLoading={isLoading}
            saveLabel={t("drawer.degrees.edit.save")}
            cancelLabel={t("drawer.degrees.edit.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="edit-degree-name">{t("drawer.degrees.edit.name")}</Label>
                <Input
                    id="edit-degree-name"
                    name="edit-degree-name"
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-ZÁÉÍÓÚÑ\s]*$/.test(value.toUpperCase())) {
                            setName(value);
                        }
                    }}
                    placeholder="Ej: Ingeniería Informática"
                    disabled={isLoading}
                    maxLength={100}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="edit-degree-acronym">{t("drawer.degrees.edit.acronym")}</Label>
                <Input
                    id="edit-degree-acronym"
                    name="edit-degree-acronym"
                    value={acronym}
                    onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (/^[A-Z0-9]*$/.test(value)) {
                            setAcronym(value);
                        }
                    }}
                    placeholder="Ej: II"
                    disabled={isLoading}
                    maxLength={20}
                />
            </div>
        </FormDrawer>
    );
}
