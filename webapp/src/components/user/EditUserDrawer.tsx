import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { useUpdateUser } from "@/hooks/user/useUpdateUser";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { User } from "@/types/auth.types";

export interface EditUserFormData {
    name: string;
    firstSurname: string;
    secondSurname: string;
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
    const { triggerAlert } = useFloatingAlertContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [firstSurname, setFirstSurname] = useState("");
    const [secondSurname, setSecondSurname] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name);
            setFirstSurname(user.firstSurname);
            setSecondSurname(user.secondSurname);
            setRole(user.role);
        }
    }, [user, open]);

    const handleSubmit = async () => {
        if (!user) return;

        if (!name.trim() || !firstSurname.trim() || !secondSurname.trim()) {
            triggerAlert({ title: "Error", description: "Todos los campos son obligatorios", variant: "destructive" });
            return;
        }

        if (name === user.name && firstSurname === user.firstSurname && secondSurname === user.secondSurname && role === user.role) {
            triggerAlert({ title: "Advertencia", description: "No se ha realizado ningún cambio", variant: "default" });
            return;
        }

        setIsSubmitting(true);
        const result = await updateUser(user.id, {
            name: name.trim(),
            firstSurname: firstSurname.trim(),
            secondSurname: secondSurname.trim(),
            role
        });

        if (result.success) {
            triggerAlert({ title: "Éxito", description: "Usuario actualizado exitosamente", variant: "success" });
            onOpenChange(false);
            onSuccess?.();
        } else {
            triggerAlert({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    if (!user) return null;

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title="Editar Usuario"
            description={`Actualiza los datos del usuario ${user.email}`}
            onSave={handleSubmit}
            onCancel={() => {}}
            isValid={!isSubmitting}
            isLoading={isSubmitting}
            saveLabel={isSubmitting ? "Actualizando..." : "Actualizar Usuario"}
            cancelLabel="Cancelar"
        >
            {user.unioviUser && (
                <div className="space-y-2 max-w-sm mx-auto w-full">
                    <Label>Usuario Uniovi</Label>
                    <div className="p-2 bg-muted rounded text-sm">{user.unioviUser}</div>
                </div>
            )}
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded text-sm">{user.email}</div>
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Nombre del usuario"
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="firstSurname">Primer Apellido *</Label>
                <Input
                    id="firstSurname"
                    value={firstSurname}
                    onChange={(e) => setFirstSurname(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Primer apellido"
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="secondSurname">Segundo Apellido *</Label>
                <Input
                    id="secondSurname"
                    value={secondSurname}
                    onChange={(e) => setSecondSurname(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Segundo apellido"
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label htmlFor="role">Rol *</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" disabled={isSubmitting} className="w-full">
                        <SelectValue placeholder="Selecciona un rol">
                            {role && (
                                <div className="flex items-center gap-2">
                                    <Badge className={role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                        {role}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {role === "ADMIN" ? "Acceso completo al sistema" : "Solicitar creación y cancelación de eventos"}
                                    </span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">
                            <div className="flex items-center gap-3 py-1">
                                <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
                                <div className="flex flex-col">
                                    <span className="font-medium">ADMIN</span>
                                    <span className="text-xs text-muted-foreground">Acceso completo al sistema</span>
                                </div>
                            </div>
                        </SelectItem>
                        <SelectItem value="PROFESSOR">
                            <div className="flex items-center gap-3 py-1">
                                <Badge className="bg-blue-100 text-blue-800">PROFESSOR</Badge>
                                <div className="flex flex-col">
                                    <span className="font-medium">PROFESSOR</span>
                                    <span className="text-xs text-muted-foreground">Solicitar creación y cancelación de eventos</span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </FormDrawer>
    );
}
