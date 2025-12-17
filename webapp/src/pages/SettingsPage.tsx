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
import { validatePassword } from "@/utils/passwordValidation";
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from "@/hooks/google/useGoogleAuth";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

const SettingsPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { user, updateUser: updateUserInContext } = useAuth();
    const { updateUser } = useUpdateUser();
    const { updatePassword } = useUpdatePassword();
    const { triggerAlert } = useFloatingAlert();
    const navigate = useNavigate();
    const { getStatus, initiateConnection, disconnect, isLoading: isGoogleLoading } = useGoogleAuth();

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

    // Google Calendar state
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState<string | undefined>();
    const [isLoadingGoogleStatus, setIsLoadingGoogleStatus] = useState(true);

    useEffect(() => {
        setItems([
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

    // Load Google Calendar connection status
    useEffect(() => {
        const loadGoogleStatus = async () => {
            setIsLoadingGoogleStatus(true);
            const status = await getStatus();
            if (status) {
                setGoogleConnected(status.connected);
                setGoogleEmail(status.email);
            }
            setIsLoadingGoogleStatus(false);
        };

        if (user?.role === 'ADMIN') {
            loadGoogleStatus();
        } else {
            setIsLoadingGoogleStatus(false);
        }
    }, [user, getStatus]);

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

        // Validar requisitos de contraseña
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            triggerAlert({
                title: t("error.password.invalid.title"),
                description: passwordValidation.errors.map(err => t(err)).join(', '),
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

    const handleGoogleConnect = () => {
        initiateConnection();
    };

    const handleGoogleDisconnect = async () => {
        const result = await disconnect();
        if (result.success) {
            setGoogleConnected(false);
            setGoogleEmail(undefined);
            triggerAlert({
                title: "Desconectado",
                description: "Google Calendar desconectado exitosamente",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message || "Error al desconectar Google Calendar",
                variant: "destructive"
            });
        }
    };

    const handleManageSyncs = () => {
        navigate('/calendar-sync');
    };

    if (!user) return null;

    return (
        <div className="container mx-auto py-6 px-4 space-y-6">
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

            {/* Sección de Google Calendar (solo para ADMIN) */}
            {user.role === 'ADMIN' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <CardTitle>Google Calendar</CardTitle>
                        </div>
                        <CardDescription>
                            Sincroniza tus calendarios de TeachingPlanner con Google Calendar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingGoogleStatus ? (
                            <div className="flex items-center justify-center py-6">
                                <Spinner />
                                <span className="ml-2 text-sm text-muted-foreground">Cargando estado de conexión...</span>
                            </div>
                        ) : (
                            <>
                                {/* Estado de conexión */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {googleConnected ? (
                                            <>
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium">Conectado a Google Calendar</p>
                                                    {googleEmail && (
                                                        <p className="text-sm text-muted-foreground">{googleEmail}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">No conectado</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Conecta tu cuenta de Google para sincronizar calendarios
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex gap-2">
                                    {googleConnected ? (
                                        <>
                                            <Button
                                                onClick={handleManageSyncs}
                                                variant="default"
                                            >
                                                Gestionar Sincronizaciones
                                            </Button>
                                            <Button
                                                onClick={handleGoogleDisconnect}
                                                variant="outline"
                                                disabled={isGoogleLoading}
                                            >
                                                {isGoogleLoading && <Spinner />}
                                                {isGoogleLoading ? "Desconectando..." : "Desconectar"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={handleGoogleConnect}
                                            variant="default"
                                            disabled={isGoogleLoading}
                                        >
                                            {isGoogleLoading && <Spinner />}
                                            {isGoogleLoading ? "Conectando..." : "Conectar con Google Calendar"}
                                        </Button>
                                    )}
                                </div>

                                {/* Información adicional */}
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    <p className="text-sm font-medium">¿Cómo funciona?</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        <li>Conecta tu cuenta de Google para autorizar el acceso</li>
                                        <li>Selecciona qué calendarios quieres sincronizar</li>
                                        <li>Los eventos se sincronizan automáticamente cada 5 minutos</li>
                                        <li>Los cambios en cualquier plataforma se reflejan en ambas</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SettingsPage;
