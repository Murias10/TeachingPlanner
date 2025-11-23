import { useState, useEffect } from "react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUpdateUser } from "@/hooks/user/useUpdateUser";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";
import { User } from "@/types/auth.types";

export interface EditUserFormData {
    role: string;
}

interface EditUserDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User;
    onSuccess?: () => void;
}

export function EditUserDrawer({ open, onOpenChange, user, onSuccess }: EditUserDrawerProps) {
    const { updateUser } = useUpdateUser();
    const { triggerAlert } = useFloatingAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [role, setRole] = useState("");

    useEffect(() => {
        if (user) {
            setRole(user.role);
        }
    }, [user, open]);

    const handleSubmit = async () => {
        if (!user) return;

        if (role === user.role) {
            triggerAlert({
                title: "Advertencia",
                description: "No se ha realizado ningún cambio",
                variant: "default"
            });
            return;
        }

        setIsSubmitting(true);
        const result = await updateUser(user.id, { role });

        if (result.success) {
            triggerAlert({
                title: "Éxito",
                description: "Usuario actualizado exitosamente",
                variant: "success"
            });
            onOpenChange(false);
            onSuccess?.();
        } else {
            triggerAlert({
                title: "Error",
                description: result.message,
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    if (!user) return null;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>Editar Usuario</DrawerTitle>
                    <DrawerDescription>
                        Actualiza los datos del usuario {user.email}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Email</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                            {user.email}
                        </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Nombre</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                            {user.name}
                        </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Primer Apellido</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                            {user.firstSurname}
                        </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Segundo Apellido</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                            {user.secondSurname}
                        </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="role">Rol *</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="role" disabled={isSubmitting}>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="TEACHER">TEACHER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                    </DrawerClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Actualizando..." : "Actualizar Usuario"}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
