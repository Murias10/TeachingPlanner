import { useEffect, useState } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateUser } from "@/hooks/user/useUpdateUser";
import { useUpdatePassword } from "@/hooks/user/useUpdatePassword";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";

const SettingsPage = () => {
    const { setItems } = useBreadcrumbContext();
    const { user, updateUser: updateUserInContext } = useAuth();
    const { updateUser } = useUpdateUser();
    const { updatePassword } = useUpdatePassword();
    const { triggerAlert } = useFloatingAlert();

    // Profile form state
    const [name, setName] = useState("");
    const [firstSurname, setFirstSurname] = useState("");
    const [secondSurname, setSecondSurname] = useState("");
    const [email, setEmail] = useState("");
    const [unioviUser, setUnioviUser] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Ajustes", href: "/settings" },
        ])
    }, [setItems]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setFirstSurname(user.firstSurname);
            setSecondSurname(user.secondSurname);
            setEmail(user.email);
            setUnioviUser(user.unioviUser || "");
        }
    }, [user]);

    const handleProfileUpdate = async () => {
        if (!user) return;

        // Validar que los campos obligatorios no estén vacíos
        if (!name.trim() || !firstSurname.trim() || !secondSurname.trim() || !email.trim()) {
            triggerAlert({
                title: "Error",
                description: "Todos los campos obligatorios deben estar completos",
                variant: "destructive"
            });
            return;
        }

        // Verificar si hubo cambios
        if (name === user.name &&
            firstSurname === user.firstSurname &&
            secondSurname === user.secondSurname &&
            email === user.email &&
            unioviUser === (user.unioviUser || "")) {
            triggerAlert({
                title: "Advertencia",
                description: "No se ha realizado ningún cambio",
                variant: "default"
            });
            return;
        }

        setIsUpdatingProfile(true);
        const result = await updateUser(user.id, {
            name: name.trim(),
            firstSurname: firstSurname.trim(),
            secondSurname: secondSurname.trim(),
            email: email.trim(),
            unioviUser: unioviUser.trim() || undefined
        });

        if (result.success) {
            // Actualizar el usuario en el contexto
            updateUserInContext({
                ...user,
                name: name.trim(),
                firstSurname: firstSurname.trim(),
                secondSurname: secondSurname.trim(),
                email: email.trim(),
                unioviUser: unioviUser.trim() || undefined
            });

            triggerAlert({
                title: "Éxito",
                description: "Perfil actualizado exitosamente",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message,
                variant: "destructive"
            });
        }
        setIsUpdatingProfile(false);
    };

    const handlePasswordUpdate = async () => {
        if (!user) return;

        // Validar campos
        if (!currentPassword || !newPassword || !confirmPassword) {
            triggerAlert({
                title: "Error",
                description: "Todos los campos son obligatorios",
                variant: "destructive"
            });
            return;
        }

        if (newPassword.length < 6) {
            triggerAlert({
                title: "Error",
                description: "La nueva contraseña debe tener al menos 6 caracteres",
                variant: "destructive"
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            triggerAlert({
                title: "Error",
                description: "Las contraseñas no coinciden",
                variant: "destructive"
            });
            return;
        }

        setIsUpdatingPassword(true);
        const result = await updatePassword(user.id, {
            currentPassword,
            newPassword
        });

        if (result.success) {
            triggerAlert({
                title: "Éxito",
                description: "Contraseña actualizada exitosamente",
                variant: "success"
            });
            // Limpiar campos
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            triggerAlert({
                title: "Error",
                description: result.message,
                variant: "destructive"
            });
        }
        setIsUpdatingPassword(false);
    };

    if (!user) return null;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Sección de Perfil */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Perfil</CardTitle>
                    <CardDescription>
                        Actualiza tu información personal
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Rol (solo lectura) */}
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <div className="flex items-center gap-2">
                            <Badge className={user.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                {user.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {user.role === "ADMIN"
                                    ? "Acceso completo al sistema"
                                    : "Solicitar creación y cancelación de eventos"}
                            </span>
                        </div>
                    </div>

                    {/* Usuario Uniovi (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="unioviUser">Usuario Uniovi</Label>
                        <Input
                            id="unioviUser"
                            value={unioviUser}
                            onChange={(e) => setUnioviUser(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder="uo123456"
                        />
                    </div>

                    {/* Email (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder="usuario@example.com"
                        />
                    </div>

                    {/* Nombre (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder="Nombre"
                        />
                    </div>

                    {/* Primer Apellido (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="firstSurname">Primer Apellido *</Label>
                        <Input
                            id="firstSurname"
                            value={firstSurname}
                            onChange={(e) => setFirstSurname(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder="Primer apellido"
                        />
                    </div>

                    {/* Segundo Apellido (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="secondSurname">Segundo Apellido *</Label>
                        <Input
                            id="secondSurname"
                            value={secondSurname}
                            onChange={(e) => setSecondSurname(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder="Segundo apellido"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            disabled={isUpdatingProfile}
                        >
                            {isUpdatingProfile && <Spinner />}
                            {isUpdatingProfile ? "Actualizando..." : "Actualizar Perfil"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sección de Contraseña */}
            <Card>
                <CardHeader>
                    <CardTitle>Cambiar Contraseña</CardTitle>
                    <CardDescription>
                        Actualiza tu contraseña de acceso
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder="Contraseña actual"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder="Confirma tu nueva contraseña"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handlePasswordUpdate}
                            disabled={isUpdatingPassword}
                        >
                            {isUpdatingPassword && <Spinner />}
                            {isUpdatingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
