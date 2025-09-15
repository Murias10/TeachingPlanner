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
import { useState } from "react";

interface CreateClassroomDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (code: string, gisUrl: string) => Promise<void>;
}

export function CreateClassroomDrawer({ open, onOpenChange, onSave }: CreateClassroomDrawerProps) {
    const { t } = useTranslation();

    const [code, setCode] = useState("");
    const [gisUrl, setGisUrl] = useState("");

    const handleSave = async () => {
        await onSave(code, gisUrl);
        setCode("");
        setGisUrl("");
    };

    const handleCancel = () => {
        setCode("");
        setGisUrl("");
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("drawer.classrooms.create.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.classrooms.create.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="classroom-code">{t("drawer.classrooms.create.code")}</Label>
                        <Input
                            id="classroom-code"
                            name="classroom-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Ej: L-15"
                        />
                    </div>
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="classroom-gisUrl">{t("drawer.classrooms.create.gisUrl")}</Label>
                        <Input
                            id="classroom-gisUrl"
                            name="classroom-gisUrl"
                            value={gisUrl}
                            onChange={(e) => setGisUrl(e.target.value)}
                            placeholder="Ej: example.com/classroom/101"
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" onClick={handleCancel}>
                            {t("drawer.classrooms.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button onClick={handleSave} disabled={!code || !gisUrl}>
                        {t("drawer.classrooms.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}