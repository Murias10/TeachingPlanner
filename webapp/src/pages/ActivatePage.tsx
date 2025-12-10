import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios, { AxiosError } from 'axios';
import { validatePassword as validatePasswordUtil, getPasswordRequirements } from '@/utils/passwordValidation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ActivatePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (!token) {
            setError('error.token.missing');
        }
    }, [token]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        if (newPassword) {
            const validation = validatePasswordUtil(newPassword);
            setValidationErrors(validation.errors.map(err => t(err)));
        } else {
            setValidationErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('error.token.missing');
            return;
        }

        if (password !== confirmPassword) {
            setError('error.passwords.do.not.match');
            return;
        }

        const passwordValidation = validatePasswordUtil(password);
        if (!passwordValidation.isValid) {
            setValidationErrors(passwordValidation.errors.map(err => t(err)));
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
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.data.message || 'error.activation.failed');
            }
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: string[] }>;
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.data?.errors) {
                setValidationErrors(error.response.data.errors.map((e: string) => t(e)));
            } else {
                setError('error.activation.failed');
            }
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
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{t(error)}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">{t('password')}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={handlePasswordChange}
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('confirm.password')}</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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

                        {validationErrors.length > 0 && (
                            <Alert>
                                <AlertDescription>
                                    <p className="font-semibold mb-2">{t('password.requirements')}:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {validationErrors.map((err, idx) => (
                                            <li key={idx} className="text-destructive">{err}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="bg-muted p-3 rounded-md text-sm">
                            <p className="font-semibold mb-2">{t('password.requirements')}:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {getPasswordRequirements().map((req, idx) => (
                                    <li key={idx}>{t(req)}</li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || validationErrors.length > 0 || !password || !confirmPassword}
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
