import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ClassroomDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    code: string;
    setCode: (value: string) => void;
    gisUrl: string;
    setGisUrl: (value: string) => void;
    onSave: () => void;
}

export function CreateClassroomDrawer({
    open,
    onOpenChange,
    code,
    setCode,
    gisUrl,
    setGisUrl,
    onSave,
}: ClassroomDrawerProps) {
    const { t } = useTranslation();

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
                        <Label htmlFor="classroom-code">
                            {t("drawer.classrooms.create.code")}
                        </Label>
                        <Input
                            id="classroom-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Ej: A-2-01"
                        />
                    </div>
                    <div className="space-y-2 max-w-sm mx-auto">
                        <Label htmlFor="classroom-gis-url">
                            {t("drawer.classrooms.create.gisUrl")}
                        </Label>
                        <Input
                            id="classroom-gis-url"
                            value={gisUrl}
                            onChange={(e) => setGisUrl(e.target.value)}
                            placeholder="Ej: gis.uniovi.es/GISUniovi/GeoLoc.do?codEspacio=..."
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCode("");
                                setGisUrl("");
                            }}
                        >
                            {t("drawer.classrooms.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button onClick={onSave} disabled={!code || !gisUrl}>
                        {t("drawer.classrooms.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
