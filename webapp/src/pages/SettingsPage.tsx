import { useEffect, useState } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUpdateUser } from "@/hooks/user/useUpdateUser"
import { useUpdatePassword } from "@/hooks/user/useUpdatePassword"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { validatePassword } from "@/utils/passwordValidation"
import { useTranslation } from "react-i18next"
import { useGoogleAuth } from "@/hooks/google/useGoogleAuth"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Calendar, CheckCircle2, XCircle, Settings, User, Lock, Info } from "lucide-react"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { cn } from "@/lib/utils"

const SettingsPage = () => {
    const { t } = useTranslation()
    const { setItems } = useBreadcrumbContext()
    const { user, updateUser: updateUserInContext } = useAuth()
    const { updateUser } = useUpdateUser()
    const { updatePassword } = useUpdatePassword()
    const { triggerAlert } = useFloatingAlertContext()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { getStatus, initiateConnection, disconnect, isLoading: isGoogleLoading } = useGoogleAuth()

    // Profile form state
    const [name, setName] = useState("")
    const [firstSurname, setFirstSurname] = useState("")
    const [secondSurname, setSecondSurname] = useState("")
    const [email, setEmail] = useState("")
    const [unioviUser, setUnioviUser] = useState("")
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    const passwordValidation = validatePassword(newPassword)
    const passwordsMatch = newPassword === confirmPassword
    const isPasswordFormValid =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        passwordValidation.isValid &&
        passwordsMatch

    // Google Calendar state
    const [googleConnected, setGoogleConnected] = useState(false)
    const [googleEmail, setGoogleEmail] = useState<string | undefined>()
    const [isLoadingGoogleStatus, setIsLoadingGoogleStatus] = useState(true)

    // Avatar initials derived from form state
    const initials = [name, firstSurname]
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2) || "?"

    useEffect(() => {
        setItems([{ label: t("settings.title"), href: "/settings", icon: Settings }])
    }, [setItems, t])

    useEffect(() => {
        if (user) {
            setName(user.name)
            setFirstSurname(user.firstSurname)
            setSecondSurname(user.secondSurname)
            setEmail(user.email)
            setUnioviUser(user.unioviUser || "")
        }
    }, [user])

    // Handle Google OAuth callback params
    useEffect(() => {
        console.log('[DEBUG] OAuth callback useEffect triggered')
        console.log('[DEBUG] Current URL:', globalThis.location.href)
        console.log('[DEBUG] searchParams object:', searchParams.toString())

        const googleConnectedParam = searchParams.get('google_connected')
        const googleError = searchParams.get('google_error')

        console.log('[DEBUG] google_connected param:', googleConnectedParam)
        console.log('[DEBUG] google_error param:', googleError)

        const handleOAuthCallback = async () => {
            if (googleConnectedParam === 'true') {
                console.log('[DEBUG] Google connected === true, showing success alert')
                triggerAlert({
                    title: t('success.title'),
                    description: t('settings.google.connectSuccess'),
                    variant: 'success'
                })
                console.log('[DEBUG] Reloading Google status from API...')
                const status = await getStatus()
                console.log('[DEBUG] Reloaded status:', status)
                if (status) {
                    setGoogleConnected(status.connected)
                    setGoogleEmail(status.email)
                }
                setSearchParams({})
            } else if (googleError) {
                console.log('[DEBUG] Google error detected:', googleError)
                triggerAlert({
                    title: t('error.title'),
                    description: `${t('error.title')}: ${googleError}`,
                    variant: 'destructive'
                })
                setSearchParams({})
            } else {
                console.log('[DEBUG] No google_connected or google_error params found')
            }
        }

        handleOAuthCallback()
    }, [searchParams, setSearchParams, triggerAlert, getStatus])

    // Load Google Calendar connection status
    useEffect(() => {
        const loadGoogleStatus = async () => {
            setIsLoadingGoogleStatus(true)
            const status = await getStatus()
            if (status) {
                setGoogleConnected(status.connected)
                setGoogleEmail(status.email)
            }
            setIsLoadingGoogleStatus(false)
        }

        if (user?.role === 'ADMIN') {
            loadGoogleStatus()
        } else {
            setIsLoadingGoogleStatus(false)
        }
    }, [user, getStatus])

    const handleProfileUpdate = async () => {
        if (!user) return
        if (!name.trim() || !firstSurname.trim() || !secondSurname.trim() || !email.trim()) {
            triggerAlert({ title: t("error.title"), description: t("settings.profile.allFieldsRequired"), variant: "destructive" })
            return
        }
        if (
            name === user.name &&
            firstSurname === user.firstSurname &&
            secondSurname === user.secondSurname &&
            email === user.email &&
            unioviUser === (user.unioviUser || "")
        ) {
            triggerAlert({ title: t("warning.title"), description: t("settings.profile.noChanges"), variant: "default" })
            return
        }
        setIsUpdatingProfile(true)
        const result = await updateUser(user.id, {
            name: name.trim(),
            firstSurname: firstSurname.trim(),
            secondSurname: secondSurname.trim(),
            email: email.trim(),
            unioviUser: unioviUser.trim() || undefined
        })
        if (result.success) {
            updateUserInContext({
                ...user,
                name: name.trim(),
                firstSurname: firstSurname.trim(),
                secondSurname: secondSurname.trim(),
                email: email.trim(),
                unioviUser: unioviUser.trim() || undefined
            })
            triggerAlert({ title: t("success.title"), description: t("settings.profile.success"), variant: "success" })
        } else {
            triggerAlert({ title: t("error.title"), description: result.message, variant: "destructive" })
        }
        setIsUpdatingProfile(false)
    }

    const handlePasswordUpdate = async () => {
        if (!user) return
        if (!currentPassword || !newPassword || !confirmPassword) {
            triggerAlert({ title: t("error.title"), description: t("settings.password.allFieldsRequired"), variant: "destructive" })
            return
        }
        const passwordValidation = validatePassword(newPassword)
        if (!passwordValidation.isValid) {
            triggerAlert({ title: t("error.password.invalid.title"), description: passwordValidation.errors.map(err => t(err)).join(', '), variant: "destructive" })
            return
        }
        if (newPassword !== confirmPassword) {
            triggerAlert({ title: t("error.title"), description: t("settings.password.mismatch"), variant: "destructive" })
            return
        }
        setIsUpdatingPassword(true)
        const result = await updatePassword(user.id, { currentPassword, newPassword })
        if (result.success) {
            triggerAlert({ title: t("success.title"), description: t("settings.password.success"), variant: "success" })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } else {
            triggerAlert({ title: t("error.title"), description: result.message, variant: "destructive" })
        }
        setIsUpdatingPassword(false)
    }

    const handleGoogleConnect = () => { initiateConnection() }

    const handleGoogleDisconnect = async () => {
        const result = await disconnect()
        if (result.success) {
            setGoogleConnected(false)
            setGoogleEmail(undefined)
            triggerAlert({ title: t("success.title"), description: t("settings.google.disconnectSuccess"), variant: "success" })
        } else {
            triggerAlert({ title: t("error.title"), description: result.message || t("error.title"), variant: "destructive" })
        }
    }

    const handleManageSyncs = () => { navigate('/calendar-sync') }

    if (!user) return null

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Two-column row: Profile (left, fluid) + Password (right, fixed 380px) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-stretch">

                {/* ─── Profile Card ─────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <User className="size-4" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <CardTitle>{t("settings.profile.title")}</CardTitle>
                                <CardDescription>{t("settings.profile.description")}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Avatar header strip */}
                        <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
                            <Avatar className="size-14">
                                <AvatarFallback className="text-base font-semibold bg-primary/15 text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-base leading-tight">
                                    {[name, firstSurname, secondSurname].filter(Boolean).join(" ") || "—"}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <Badge className={cn(
                                        "border text-xs",
                                        user.role === "ADMIN"
                                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                    )}>
                                        {user.role}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {user.role === "ADMIN" ? t("settings.profile.roleAdmin") : t("settings.profile.roleProfessor")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Form grid */}
                        <div className="space-y-4">
                            {/* Row 1: name + firstSurname */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t("settings.profile.name")}
                                        <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isUpdatingProfile}
                                        placeholder={t("settings.profile.name")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstSurname">
                                        {t("settings.profile.firstSurname")}
                                        <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                    </Label>
                                    <Input
                                        id="firstSurname"
                                        value={firstSurname}
                                        onChange={(e) => setFirstSurname(e.target.value)}
                                        disabled={isUpdatingProfile}
                                        placeholder={t("settings.profile.firstSurname")}
                                    />
                                </div>
                            </div>

                            {/* Row 2: secondSurname + email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="secondSurname">
                                        {t("settings.profile.secondSurname")}
                                        <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                    </Label>
                                    <Input
                                        id="secondSurname"
                                        value={secondSurname}
                                        onChange={(e) => setSecondSurname(e.target.value)}
                                        disabled={isUpdatingProfile}
                                        placeholder={t("settings.profile.secondSurname")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        {t("settings.profile.email")}
                                        <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isUpdatingProfile}
                                        placeholder={t("settings.profile.emailPlaceholder")}
                                    />
                                </div>
                            </div>

                            {/* Row 3: unioviUser full width */}
                            <div className="space-y-2">
                                <Label htmlFor="unioviUser">{t("settings.profile.unioviUser")}</Label>
                                <Input
                                    id="unioviUser"
                                    value={unioviUser}
                                    onChange={(e) => setUnioviUser(e.target.value)}
                                    disabled={isUpdatingProfile}
                                    placeholder={t("settings.profile.unioviUserPlaceholder")}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                            <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
                                {isUpdatingProfile && <Spinner />}
                                {isUpdatingProfile ? t("settings.profile.updating") : t("settings.profile.updateButton")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── Password Card ─────────────────────────────── */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Lock className="size-4" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <CardTitle>{t("settings.password.title")}</CardTitle>
                                <CardDescription>{t("settings.password.description")}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                        <div className="space-y-4 flex-1">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">
                                    {t("settings.password.current")}
                                    <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                </Label>
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
                                <Label htmlFor="newPassword">
                                    {t("settings.password.new")}
                                    <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                </Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    placeholder={t("settings.password.minChars")}
                                />
                            </div>

                            {newPassword.length > 0 && (
                                <div className="rounded-md border bg-muted/30 p-3">
                                    <PasswordRequirements password={newPassword} showRequirements={true} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    {t("settings.password.confirm")}
                                    <span className="text-destructive ml-0.5">{t("settings.profile.requiredField")}</span>
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    placeholder={t("settings.password.confirmPlaceholder")}
                                />
                                {confirmPassword.length > 0 && !passwordsMatch && (
                                    <div className="flex items-center gap-1.5 text-sm text-destructive">
                                        <XCircle className="size-3.5 shrink-0" />
                                        <span>{t("settings.password.mismatch")}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <Separator />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handlePasswordUpdate}
                                    disabled={isUpdatingPassword || !isPasswordFormValid}
                                >
                                    {isUpdatingPassword && <Spinner />}
                                    {isUpdatingPassword ? t("settings.password.updating") : t("settings.password.changeButton")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Google Calendar Card (ADMIN only, full-width) ─── */}
            {user.role === 'ADMIN' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Calendar className="size-4" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <CardTitle>{t("settings.google.title")}</CardTitle>
                                <CardDescription>{t("settings.google.description")}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingGoogleStatus ? (
                            <div className="flex items-center justify-center gap-2 py-8">
                                <Spinner />
                                <span className="text-sm text-muted-foreground">{t("settings.google.loadingStatus")}</span>
                            </div>
                        ) : (
                            <>
                                {/* Connection status with color accent */}
                                <div className={cn(
                                    "flex items-center rounded-lg border p-4 w-fit",
                                    googleConnected
                                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                        : "bg-muted/40 border-border"
                                )}>
                                    <div className="flex items-center gap-3">
                                        {googleConnected ? (
                                            <>
                                                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">{t("settings.google.connected")}</p>
                                                    {googleEmail && (
                                                        <p className="text-sm text-muted-foreground">{googleEmail}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="size-5 text-muted-foreground shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">{t("settings.google.notConnected")}</p>
                                                    <p className="text-sm text-muted-foreground">{t("settings.google.notConnectedDescription")}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {googleConnected ? (
                                        <>
                                            <Button onClick={handleManageSyncs} variant="default">
                                                {t("settings.google.manageButton")}
                                            </Button>
                                            <Button onClick={handleGoogleDisconnect} variant="outline" disabled={isGoogleLoading}>
                                                {isGoogleLoading && <Spinner />}
                                                {isGoogleLoading ? t("settings.google.disconnecting") : t("settings.google.disconnectButton")}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={handleGoogleConnect} variant="default" disabled={isGoogleLoading}>
                                            {isGoogleLoading && <Spinner />}
                                            {isGoogleLoading ? t("settings.google.connecting") : t("settings.google.connectButton")}
                                        </Button>
                                    )}
                                </div>

                                <Separator />

                                {/* How it works info box */}
                                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="size-4 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-semibold">{t("settings.google.howItWorks")}</p>
                                    </div>
                                    <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside pl-1">
                                        <li>{t("settings.google.step1")}</li>
                                        <li>{t("settings.google.step2")}</li>
                                        <li>{t("settings.google.step3")}</li>
                                        <li>{t("settings.google.step4")}</li>
                                        <li>{t("settings.google.step5")}</li>
                                        <li>{t("settings.google.step6")}</li>
                                    </ol>
                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
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
    )
}

export default SettingsPage
