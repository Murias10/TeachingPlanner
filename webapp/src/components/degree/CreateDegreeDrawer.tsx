import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

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
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("drawer.degrees.create.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.degrees.create.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto">
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
                    <div className="space-y-2 max-w-sm mx-auto">
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
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" onClick={handleCancel}>
                            {t("drawer.degrees.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button onClick={handleSave} disabled={!name || !acronym}>
                        {t("drawer.degrees.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}