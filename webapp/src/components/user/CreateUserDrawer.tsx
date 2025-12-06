import { useState } from "react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateUser } from "@/hooks/user/useCreateUser";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";

interface CreateUserDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateUserDrawer({ open, onOpenChange, onSuccess }: CreateUserDrawerProps) {
    const { createUser } = useCreateUser();
    const { triggerAlert } = useFloatingAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        unioviUser: "",
        firstSurname: "",
        secondSurname: "",
        email: "",
        password: "",
        role: "PROFESSOR",
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            triggerAlert({
                title: "Error",
                description: "El nombre es requerido",
                variant: "destructive"
            });
            return false;
        }
        if (!formData.firstSurname.trim()) {
            triggerAlert({
                title: "Error",
                description: "El primer apellido es requerido",
                variant: "destructive"
            });
            return false;
        }
        if (!formData.secondSurname.trim()) {
            triggerAlert({
                title: "Error",
                description: "El segundo apellido es requerido",
                variant: "destructive"
            });
            return false;
        }
        if (!formData.email.trim()) {
            triggerAlert({
                title: "Error",
                description: "El email es requerido",
                variant: "destructive"
            });
            return false;
        }
        if (!formData.password || formData.password.length < 6) {
            triggerAlert({
                title: "Error",
                description: "La contraseña debe tener al menos 6 caracteres",
                variant: "destructive"
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        const result = await createUser(formData);

        if (result.success) {
            triggerAlert({
                title: "Éxito",
                description: "Usuario creado exitosamente",
                variant: "success"
            });
            setFormData({
                name: "",
                unioviUser: "",
                firstSurname: "",
                secondSurname: "",
                email: "",
                password: "",
                role: "PROFESSOR",
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

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>Crear Nuevo Usuario</DrawerTitle>
                    <DrawerDescription>
                        Completa los datos para crear un nuevo usuario en la aplicación
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="unioviUser">Usuario Uniovi</Label>
                        <Input
                            id="unioviUser"
                            placeholder="uo123456"
                            value={formData.unioviUser}
                            onChange={(e) => handleInputChange("unioviUser", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            placeholder="Juan"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="firstSurname">Primer Apellido *</Label>
                        <Input
                            id="firstSurname"
                            placeholder="García"
                            value={formData.firstSurname}
                            onChange={(e) => handleInputChange("firstSurname", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="secondSurname">Segundo Apellido *</Label>
                        <Input
                            id="secondSurname"
                            placeholder="López"
                            value={formData.secondSurname}
                            onChange={(e) => handleInputChange("secondSurname", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="juan@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="password">Contraseña *</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="role">Rol *</Label>
                        <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                            <SelectTrigger id="role" disabled={isSubmitting} className="w-full">
                                <SelectValue placeholder="Selecciona un rol">
                                    <div className="flex items-center gap-2">
                                        <Badge className={formData.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                            {formData.role}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {formData.role === "ADMIN"
                                                ? "Acceso completo al sistema"
                                                : "Solicitar creación y cancelación de eventos"}
                                        </span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">
                                    <div className="flex items-center gap-3 py-1">
                                        <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
                                        <div className="flex flex-col">
                                            <span className="font-medium">ADMIN</span>
                                            <span className="text-xs text-muted-foreground">
                                                Acceso completo al sistema
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="PROFESSOR">
                                    <div className="flex items-center gap-3 py-1">
                                        <Badge className="bg-blue-100 text-blue-800">PROFESSOR</Badge>
                                        <div className="flex flex-col">
                                            <span className="font-medium">PROFESSOR</span>
                                            <span className="text-xs text-muted-foreground">
                                                Solicitar creación y cancelación de eventos
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
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
                        {isSubmitting ? "Creando..." : "Crear Usuario"}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
