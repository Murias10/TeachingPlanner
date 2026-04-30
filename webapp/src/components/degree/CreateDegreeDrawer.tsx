import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/ui/FormDrawer";

interface CreateDegreeDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, acronym: string) => Promise<void>;
}

export function CreateDegreeDrawer({ open, onOpenChange, onSave }: CreateDegreeDrawerProps) {
    const { t } = useTranslation();

    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");

    useEffect(() => {
        if (!open) {
            setName("");
            setAcronym("");
        }
    }, [open]);

    const handleSave = async () => {
        await onSave(name, acronym);
    };

    const handleCancel = () => {
        setName("");
        setAcronym("");
        onOpenChange(false);
    };

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.degrees.create.title")}
            description={t("drawer.degrees.create.description")}
            onSave={handleSave}
            onCancel={handleCancel}
            isValid={!!(name && acronym)}
            saveLabel={t("drawer.degrees.create.save")}
            cancelLabel={t("drawer.degrees.create.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="degree-name">{t("drawer.degrees.create.name")}</Label>
                <Input
                    id="degree-name"
                    name="degree-name"
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-ZÁÉÍÓÚÑ\s]*$/.test(value.toUpperCase())) {
                            setName(value);
                        }
                    }}
                    placeholder="Ej: Máster de Ingeniería Web"
                    maxLength={100}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="degree-acronym">{t("drawer.degrees.create.acronym")}</Label>
                <Input
                    id="degree-acronym"
                    name="degree-acronym"
                    value={acronym}
                    onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (/^[A-Z0-9]*$/.test(value)) {
                            setAcronym(value);
                        }
                    }}
                    placeholder="Ej: MIW"
                    maxLength={20}
                />
            </div>
        </FormDrawer>
    );
}
