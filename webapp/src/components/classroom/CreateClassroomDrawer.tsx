import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/RequiredLabel";
import { FormDrawer } from "@/components/ui/FormDrawer";

interface CreateClassroomDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (code: string, gisUrl: string) => Promise<void>;
}

export function CreateClassroomDrawer({ open, onOpenChange, onSave }: CreateClassroomDrawerProps) {
    const { t } = useTranslation();

    const [code, setCode] = useState("");
    const [gisUrl, setGisUrl] = useState("");

    useEffect(() => {
        if (!open) {
            setCode("");
            setGisUrl("");
        }
    }, [open]);

    const handleSave = async () => {
        await onSave(code, gisUrl);
    };

    const handleCancel = () => {
        setCode("");
        setGisUrl("");
        onOpenChange(false);
    };

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.classrooms.create.title")}
            description={t("drawer.classrooms.create.description")}
            onSave={handleSave}
            onCancel={handleCancel}
            isValid={!!(code && gisUrl)}
            saveLabel={t("drawer.classrooms.create.save")}
            cancelLabel={t("drawer.classrooms.create.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto">
                <RequiredLabel htmlFor="classroom-code" required>{t("drawer.classrooms.create.code")}</RequiredLabel>
                <Input
                    id="classroom-code"
                    name="classroom-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej: Aula A"
                    maxLength={20}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
                <RequiredLabel htmlFor="classroom-gis-url" required>{t("drawer.classrooms.create.gisUrl")}</RequiredLabel>
                <Input
                    id="classroom-gis-url"
                    name="classroom-gis-url"
                    value={gisUrl}
                    onChange={(e) => setGisUrl(e.target.value)}
                    placeholder="Ej: https://gis.uniovi.es/aula-a"
                    maxLength={255}
                />
            </div>
        </FormDrawer>
    );
}
