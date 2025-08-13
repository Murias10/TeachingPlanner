import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CirclePlus } from "lucide-react";

interface ClassroomToolbarProps {
    onClassroomAdded?: () => void; // <- añadida aquí
}

export function ClassroomToolbar({ onClassroomAdded }: ClassroomToolbarProps) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");
    const [gisUrl, setGisUrl] = useState("");

    const handleSave = async () => {
        try {
            const response = await fetch("http://localhost:8080/classroom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, gisUrl })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Error al guardar aula:", errorBody);
                return;
            }

            const result = await response.json();
            console.log("Aula guardada:", result);

            // refrescar lista en el padre
            if (onClassroomAdded) {
                onClassroomAdded();
            }

            setOpen(false); // cerrar drawer
        } catch (error) {
            console.error("Error de red:", error);
        }
    };

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <CirclePlus /> Add classroom
                </Button>
            </div>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>Añadir nuevo aula</DrawerTitle>
                        <DrawerDescription>
                            Completa la información del aula y guarda los cambios.
                        </DrawerDescription>
                    </DrawerHeader>

                    {/* Contenido desplazable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="classroom-code">Code</Label>
                            <Input
                                id="classroom-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ej: A-2-01"
                            />
                        </div>
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="classroom-gis-url">GIS URL</Label>
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
                            <Button variant="outline">Cancelar</Button>
                        </DrawerClose>
                        <Button onClick={handleSave}>Guardar</Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </section>
    );
}
