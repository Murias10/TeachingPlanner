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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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
                title: t('common.error'),
                description: t('forgotPassword.stepEmail.emailRequired'),
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });

            if (response.data.success) {
                triggerAlert({
                    title: t('common.success'),
                    description: t('forgotPassword.stepEmail.codeSent'),
                    variant: 'success'
                });
                setCurrentStep('otp');
                startCooldown();
            }
        } catch {
            triggerAlert({
                title: t('common.error'),
                description: t('forgotPassword.stepEmail.sendError'),
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
                title: t('common.error'),
                description: t('forgotPassword.stepOtp.otpLengthError'),
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
                    title: t('common.success'),
                    description: t('forgotPassword.stepOtp.otpSuccess'),
                    variant: 'success'
                });
            }
        } catch {
            triggerAlert({
                title: t('common.error'),
                description: t('forgotPassword.stepOtp.otpError'),
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
                title: t('common.error'),
                description: t('forgotPassword.stepPassword.fieldsRequired'),
                variant: 'destructive'
            });
            return;
        }

        // Validar requisitos de contraseña
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            triggerAlert({
                title: t('login.validation.title'),
                description: t('forgotPassword.stepPassword.passwordRequirementsError'),
                variant: 'destructive'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            triggerAlert({
                title: t('common.error'),
                description: t('forgotPassword.stepPassword.passwordMismatch'),
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
                    title: t('forgotPassword.stepPassword.success.title'),
                    description: t('forgotPassword.stepPassword.success.description'),
                    variant: 'success'
                });
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch {
            triggerAlert({
                title: t('common.error'),
                description: t('forgotPassword.stepPassword.error'),
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
                    <CardTitle>{t('forgotPassword.title')}</CardTitle>
                    <CardDescription>
                        {currentStep === 'email' && t('forgotPassword.stepEmail.description')}
                        {currentStep === 'otp' && t('forgotPassword.stepOtp.description')}
                        {currentStep === 'password' && t('forgotPassword.stepPassword.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Step 1: Email */}
                    {currentStep === 'email' && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('forgotPassword.stepEmail.emailLabel')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('forgotPassword.stepEmail.emailPlaceholder')}
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
                                {isLoading ? t('forgotPassword.stepEmail.submitting') : t('forgotPassword.stepEmail.submit')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                {t('forgotPassword.stepEmail.backToLogin')}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {currentStep === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('forgotPassword.stepOtp.otpLabel')}</Label>
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
                                {isLoading ? t('forgotPassword.stepOtp.submitting') : t('forgotPassword.stepOtp.submit')}
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
                                {otpCooldown > 0 ? t('forgotPassword.stepOtp.resendCooldown', { seconds: otpCooldown }) : t('forgotPassword.stepOtp.resend')}
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
                                {t('forgotPassword.stepOtp.changeEmail')}
                            </Button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {currentStep === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">{t('forgotPassword.stepPassword.newPasswordLabel')}</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder={t('forgotPassword.stepPassword.newPasswordPlaceholder')}
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
                                <Label htmlFor="confirmPassword">{t('forgotPassword.stepPassword.confirmPasswordLabel')}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder={t('forgotPassword.stepPassword.confirmPasswordPlaceholder')}
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
                                {isLoading ? t('forgotPassword.stepPassword.submitting') : t('forgotPassword.stepPassword.submit')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                {t('forgotPassword.stepPassword.backToLogin')}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
