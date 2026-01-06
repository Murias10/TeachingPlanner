import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { validatePassword } from '@/utils/passwordValidation';
import { PasswordRequirements } from '@/components/ui/password-requirements';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const { triggerAlert } = useFloatingAlertContext();
    const navigate = useNavigate();

    const apiClient = axios.create({
        baseURL: import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8080'
    });

    const startCooldown = () => {
        setOtpCooldown(60);
        const interval = setInterval(() => {
            setOtpCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor ingresa tu email',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });

            if (response.data.success) {
                triggerAlert({
                    title: 'Éxito',
                    description: response.data.message,
                    variant: 'success'
                });
                setCurrentStep('otp');
                startCooldown();
            }
        } catch {
            triggerAlert({
                title: 'Error',
                description: 'Error al solicitar código',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor ingresa un código de 6 dígitos',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/verify-otp', { email, otp });

            if (response.data.success) {
                setResetToken(response.data.data.resetToken);
                setCurrentStep('password');
                triggerAlert({
                    title: 'Éxito',
                    description: 'Código verificado correctamente',
                    variant: 'success'
                });
            }
        } catch {
            triggerAlert({
                title: 'Error',
                description: 'Código incorrecto',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor completa todos los campos',
                variant: 'destructive'
            });
            return;
        }

        // Validar requisitos de contraseña
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            triggerAlert({
                title: 'Error de validación',
                description: passwordValidation.errors.join(', '),
                variant: 'destructive'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            triggerAlert({
                title: 'Error',
                description: 'Las contraseñas no coinciden',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/reset-password', {
                resetToken,
                newPassword
            });

            if (response.data.success) {
                triggerAlert({
                    title: 'Éxito',
                    description: 'Contraseña actualizada correctamente',
                    variant: 'success'
                });
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch {
            triggerAlert({
                title: 'Error',
                description: 'Error al actualizar contraseña',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        {currentStep === 'email' && 'Ingresa tu email para recibir un código de recuperación'}
                        {currentStep === 'otp' && 'Ingresa el código que recibiste en tu email'}
                        {currentStep === 'password' && 'Crea una nueva contraseña'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Step 1: Email */}
                    {currentStep === 'email' && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Enviando...' : 'Solicitar Código'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                Volver al Login
                            </Button>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {currentStep === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Código de 6 dígitos</Label>
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={isLoading}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? 'Verificando...' : 'Verificar Código'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={otpCooldown > 0 || isLoading}
                                onClick={() => {
                                    setOtp('');
                                    handleRequestOTP(new Event('submit') as unknown as React.FormEvent);
                                }}
                            >
                                {otpCooldown > 0 ? `Reenviar en ${otpCooldown}s` : 'Reenviar Código'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setCurrentStep('email');
                                    setEmail('');
                                    setOtp('');
                                    setOtpCooldown(0);
                                }}
                            >
                                Cambiar Email
                            </Button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {currentStep === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <PasswordRequirements
                                password={newPassword}
                                showRequirements={newPassword.length > 0}
                            />

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirma tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                Volver al Login
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
