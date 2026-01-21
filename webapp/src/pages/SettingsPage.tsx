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
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { validatePassword } from "@/utils/passwordValidation";
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from "@/hooks/google/useGoogleAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import { PasswordRequirements } from "@/components/ui/password-requirements";

const SettingsPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { user, updateUser: updateUserInContext } = useAuth();
    const { updateUser } = useUpdateUser();
    const { updatePassword } = useUpdatePassword();
    const { triggerAlert } = useFloatingAlertContext();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
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

    // Validar contraseña en tiempo real
    const passwordValidation = validatePassword(newPassword);
    const passwordsMatch = newPassword === confirmPassword;
    const isPasswordFormValid =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        passwordValidation.isValid &&
        passwordsMatch;

    // Google Calendar state
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState<string | undefined>();
    const [isLoadingGoogleStatus, setIsLoadingGoogleStatus] = useState(true);

    useEffect(() => {
        setItems([
            { label: t("settings.title"), href: "/settings" },
        ])
    }, [setItems, t]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setFirstSurname(user.firstSurname);
            setSecondSurname(user.secondSurname);
            setEmail(user.email);
            setUnioviUser(user.unioviUser || "");
        }
    }, [user]);

    // Handle Google OAuth callback params
    useEffect(() => {
        console.log('[DEBUG] OAuth callback useEffect triggered');
        console.log('[DEBUG] Current URL:', globalThis.location.href);
        console.log('[DEBUG] searchParams object:', searchParams.toString());

        const googleConnected = searchParams.get('google_connected');
        const googleError = searchParams.get('google_error');

        console.log('[DEBUG] google_connected param:', googleConnected);
        console.log('[DEBUG] google_error param:', googleError);

        const handleOAuthCallback = async () => {
            if (googleConnected === 'true') {
                console.log('[DEBUG] Google connected === true, showing success alert');
                triggerAlert({
                    title: t('success.title'),
                    description: t('settings.google.connectSuccess'),
                    variant: 'success'
                });

                // Reload the Google status from the API
                console.log('[DEBUG] Reloading Google status from API...');
                const status = await getStatus();
                console.log('[DEBUG] Reloaded status:', status);
                if (status) {
                    setGoogleConnected(status.connected);
                    setGoogleEmail(status.email);
                }

                // Limpiar parámetros de la URL
                setSearchParams({});
            } else if (googleError) {
                console.log('[DEBUG] Google error detected:', googleError);
                triggerAlert({
                    title: t('error.title'),
                    description: `${t('error.title')}: ${googleError}`,
                    variant: 'destructive'
                });
                // Limpiar parámetros de la URL
                setSearchParams({});
            } else {
                console.log('[DEBUG] No google_connected or google_error params found');
            }
        };

        handleOAuthCallback();
    }, [searchParams, setSearchParams, triggerAlert, getStatus]);

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
                title: t("error.title"),
                description: t("settings.profile.allFieldsRequired"),
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
                title: t("warning.title"),
                description: t("settings.profile.noChanges"),
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
                title: t("success.title"),
                description: t("settings.profile.success"),
                variant: "success"
            });
        } else {
            triggerAlert({
                title: t("error.title"),
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
                title: t("error.title"),
                description: t("settings.password.allFieldsRequired"),
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
                title: t("error.title"),
                description: t("settings.password.mismatch"),
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
                title: t("success.title"),
                description: t("settings.password.success"),
                variant: "success"
            });
            // Limpiar campos
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            triggerAlert({
                title: t("error.title"),
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
                title: t("success.title"),
                description: t("settings.google.disconnectSuccess"),
                variant: "success"
            });
        } else {
            triggerAlert({
                title: t("error.title"),
                description: result.message || t("error.title"),
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
                    <CardTitle>{t("settings.profile.title")}</CardTitle>
                    <CardDescription>
                        {t("settings.profile.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Rol (solo lectura) */}
                    <div className="space-y-2">
                        <Label>{t("settings.profile.role")}</Label>
                        <div className="flex items-center gap-2">
                            <Badge className={user.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                {user.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {user.role === "ADMIN"
                                    ? t("settings.profile.roleAdmin")
                                    : t("settings.profile.roleProfessor")}
                            </span>
                        </div>
                    </div>

                    {/* Usuario Uniovi (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="unioviUser">{t("settings.profile.unioviUser")}</Label>
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
                        <Label htmlFor="email">{t("settings.profile.email")} {t("settings.profile.requiredField")}</Label>
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
                        <Label htmlFor="name">{t("settings.profile.name")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder={t("settings.profile.name")}
                        />
                    </div>

                    {/* Primer Apellido (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="firstSurname">{t("settings.profile.firstSurname")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="firstSurname"
                            value={firstSurname}
                            onChange={(e) => setFirstSurname(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder={t("settings.profile.firstSurname")}
                        />
                    </div>

                    {/* Segundo Apellido (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="secondSurname">{t("settings.profile.secondSurname")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="secondSurname"
                            value={secondSurname}
                            onChange={(e) => setSecondSurname(e.target.value)}
                            disabled={isUpdatingProfile}
                            placeholder={t("settings.profile.secondSurname")}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            disabled={isUpdatingProfile}
                        >
                            {isUpdatingProfile && <Spinner />}
                            {isUpdatingProfile ? t("settings.profile.updating") : t("settings.profile.updateButton")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sección de Contraseña */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.password.title")}</CardTitle>
                    <CardDescription>
                        {t("settings.password.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t("settings.password.current")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder={t("settings.password.current")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">{t("settings.password.new")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder={t("settings.password.minChars")}
                        />
                    </div>

                    <PasswordRequirements
                        password={newPassword}
                        showRequirements={newPassword.length > 0}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t("settings.password.confirm")} {t("settings.profile.requiredField")}</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder={t("settings.password.confirmPlaceholder")}
                        />
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <p className="text-sm text-destructive">{t("settings.password.mismatch")}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handlePasswordUpdate}
                            disabled={isUpdatingPassword || !isPasswordFormValid}
                        >
                            {isUpdatingPassword && <Spinner />}
                            {isUpdatingPassword ? t("settings.password.updating") : t("settings.password.changeButton")}
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
                            <CardTitle>{t("settings.google.title")}</CardTitle>
                        </div>
                        <CardDescription>
                            {t("settings.google.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingGoogleStatus ? (
                            <div className="flex items-center justify-center py-6">
                                <Spinner />
                                <span className="ml-2 text-sm text-muted-foreground">{t("settings.google.loadingStatus")}</span>
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
                                                    <p className="font-medium">{t("settings.google.connected")}</p>
                                                    {googleEmail && (
                                                        <p className="text-sm text-muted-foreground">{googleEmail}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{t("settings.google.notConnected")}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t("settings.google.notConnectedDescription")}
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
                                                {t("settings.google.manageButton")}
                                            </Button>
                                            <Button
                                                onClick={handleGoogleDisconnect}
                                                variant="outline"
                                                disabled={isGoogleLoading}
                                            >
                                                {isGoogleLoading && <Spinner />}
                                                {isGoogleLoading ? t("settings.google.disconnecting") : t("settings.google.disconnectButton")}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={handleGoogleConnect}
                                            variant="default"
                                            disabled={isGoogleLoading}
                                        >
                                            {isGoogleLoading && <Spinner />}
                                            {isGoogleLoading ? t("settings.google.connecting") : t("settings.google.connectButton")}
                                        </Button>
                                    )}
                                </div>

                                {/* Información adicional actualizada */}
                                <div className="bg-muted p-4 rounded-lg space-y-3">
                                    <p className="text-sm font-semibold">{t("settings.google.howItWorks")}</p>
                                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                        <li>{t("settings.google.step1")}</li>
                                        <li>{t("settings.google.step2")}</li>
                                        <li>{t("settings.google.step3")}</li>
                                        <li>{t("settings.google.step4")}</li>
                                        <li>{t("settings.google.step5")}</li>
                                        <li>{t("settings.google.step6")}</li>
                                    </ol>
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {t("settings.google.note")}
                                        </p>
                                    </div>
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
