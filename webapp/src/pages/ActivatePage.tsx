import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios, { AxiosError } from 'axios';
import { validatePassword as validatePasswordUtil } from '@/utils/passwordValidation';
import { PasswordRequirements } from '@/components/ui/password-requirements';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';

const API_URL = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8080';

export default function ActivatePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { triggerAlert } = useFloatingAlertContext();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            triggerAlert({
                title: t('error'),
                description: t('error.token.missing'),
                variant: 'destructive'
            });
            return;
        }

        if (password !== confirmPassword) {
            triggerAlert({
                title: t('error'),
                description: t('error.passwords.do.not.match'),
                variant: 'destructive'
            });
            return;
        }

        const passwordValidation = validatePasswordUtil(password);
        if (!passwordValidation.isValid) {
            triggerAlert({
                title: t('error.password.invalid.title'),
                description: passwordValidation.errors.map(err => t(err)).join(', '),
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/activate`, {
                token,
                password
            });

            if (response.data.success) {
                setSuccess(true);
                triggerAlert({
                    title: t('activation.success.title'),
                    description: t('activation.success.description'),
                    variant: 'success'
                });
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                triggerAlert({
                    title: t('error'),
                    description: response.data.message || t('error.activation.failed'),
                    variant: 'destructive'
                });
            }
        } catch (err) {
            console.error('Error en activación:', err);
            const error = err as AxiosError<{ message?: string; errors?: string[]; status?: string }>;
            let errorMessage = t('error.activation.failed');

            // Log detallado para debugging
            console.log('Error response:', error.response);
            console.log('Error status:', error.response?.status);
            console.log('Error data:', error.response?.data);

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                errorMessage = error.response.data.errors.map((e: string) => t(e)).join(', ');
            } else if (error.response?.status) {
                // Mostrar el código de estado HTTP si no hay mensaje
                errorMessage = `Error ${error.response.status}: ${error.response.statusText || 'Error en la activación'}`;
            } else if (error.message) {
                // Si es un error de red o axios
                errorMessage = `Error de conexión: ${error.message}`;
            }

            triggerAlert({
                title: 'Error de activación',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-destructive" />
                            {t('activation.invalid.token.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('activation.invalid.token.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            {t('go.to.login')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            {t('activation.success.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('activation.success.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {t('activation.redirecting')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t('activation.title')}</CardTitle>
                    <CardDescription>
                        {t('activation.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('password')}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <PasswordRequirements
                            password={password}
                            showRequirements={password.length > 0}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('confirm.password')}</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirma tu contraseña"
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !password || !confirmPassword}
                        >
                            {isLoading ? (
                                <>
                                    <span className="mr-2 h-4 w-4">
                                        <LoadingSpinner />
                                    </span>
                                    {t('activating')}
                                </>
                            ) : (
                                t('activate.account')
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
