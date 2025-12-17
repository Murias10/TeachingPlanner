import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { PasswordResetService } from '@/services/password-reset.service';
import { GoogleOAuthService } from '@/services/google-oauth.service';
import { ApiResponse, LoginDTO, JwtPayload, ForgotPasswordDTO, VerifyOTPDTO, ResetPasswordDTO } from '@/types/auth.types';

interface AuthRequest extends Request {
    user?: JwtPayload;
}

export class AuthController {
    private readonly authService: AuthService;
    private readonly passwordResetService: PasswordResetService;
    private readonly googleOAuthService: GoogleOAuthService;

    constructor() {
        this.authService = new AuthService();
        this.passwordResetService = new PasswordResetService();
        this.googleOAuthService = new GoogleOAuthService();
    }

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const loginData: LoginDTO = req.body;
            const authResponse = await this.authService.login(loginData);

            const response: ApiResponse = {
                success: true,
                message: 'Login successful',
                data: authResponse
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                success: false,
                message: 'Login failed',
                error: error.message
            };
            res.status(401).json(response);
        }
    };

    validateToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Token is required'
                };
                res.status(400).json(response);
                return;
            }

            const decoded = await this.authService.validateToken(token);

            const response: ApiResponse = {
                success: true,
                message: 'Token is valid',
                data: decoded
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                success: false,
                message: 'Token validation failed',
                error: error.message
            };
            res.status(401).json(response);
        }
    };

    getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated'
                };
                res.status(401).json(response);
                return;
            }

            const user = await this.authService.getUserById(req.user.userId);

            const response: ApiResponse = {
                success: true,
                message: 'Profile retrieved successfully',
                data: user
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                success: false,
                message: 'Failed to retrieve profile',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    logout = async (req: Request, res: Response): Promise<void> => {
        // En un JWT stateless, el logout se maneja en el cliente eliminando el token
        // Aquí podrías implementar una blacklist de tokens si es necesario
        const response: ApiResponse = {
            success: true,
            message: 'Logout successful'
        };

        res.json(response);
    };

    forgotPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email }: ForgotPasswordDTO = req.body;

            if (!email) {
                res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
                return;
            }

            const result = await this.passwordResetService.requestPasswordReset(email);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to request password reset'
            });
        }
    };

    verifyOTP = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, otp }: VerifyOTPDTO = req.body;

            if (!email || !otp) {
                res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
                return;
            }

            const result = await this.passwordResetService.verifyOTP(email, otp);

            res.json({
                success: true,
                message: 'OTP verified successfully',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'OTP verification failed'
            });
        }
    };

    resetPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { resetToken, newPassword }: ResetPasswordDTO = req.body;

            if (!resetToken || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Reset token and new password are required'
                });
                return;
            }

            const result = await this.passwordResetService.resetPassword(resetToken, newPassword);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Password reset failed'
            });
        }
    };

    activateAccount = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Token and password are required'
                });
                return;
            }

            const result = await this.authService.activateAccount(token, password);

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
                return;
            }

            res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Account activation failed'
            });
        }
    };

    // Google OAuth methods
    initiateGoogleOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const authUrl = this.googleOAuthService.getAuthorizationUrl(req.user.userId);

            res.json({
                success: true,
                message: 'Authorization URL generated',
                data: { authUrl }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to initiate Google OAuth'
            });
        }
    };

    handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('[DEBUG] handleGoogleCallback invoked');
            const { code, state } = req.query;
            console.log('[DEBUG] Query params - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing');

            if (!code || !state) {
                const redirectUrl = `${process.env.FRONTEND_URL}/settings?google_error=missing_params`;
                console.log('[DEBUG] Missing params, redirecting to:', redirectUrl);
                res.redirect(redirectUrl);
                return;
            }

            console.log('[DEBUG] Calling googleOAuthService.handleCallback');
            const result = await this.googleOAuthService.handleCallback(
                code as string,
                state as string
            );
            console.log('[DEBUG] handleCallback result:', result);

            if (result.success) {
                const redirectUrl = `${process.env.FRONTEND_URL}/settings?google_connected=true`;
                console.log('[DEBUG] Success! Redirecting to:', redirectUrl);
                res.redirect(redirectUrl);
            } else {
                const redirectUrl = `${process.env.FRONTEND_URL}/settings?google_error=${encodeURIComponent(result.message)}`;
                console.log('[DEBUG] Failure! Redirecting to:', redirectUrl);
                res.redirect(redirectUrl);
            }
        } catch (error: any) {
            console.error('[DEBUG] Google OAuth callback error:', error);
            const redirectUrl = `${process.env.FRONTEND_URL}/settings?google_error=callback_failed`;
            console.log('[DEBUG] Exception occurred, redirecting to:', redirectUrl);
            res.redirect(redirectUrl);
        }
    };

    disconnectGoogle = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const result = await this.googleOAuthService.disconnectGoogleAccount(req.user.userId);

            res.json({
                success: result.success,
                message: result.message
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to disconnect Google account'
            });
        }
    };

    getGoogleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const status = await this.googleOAuthService.getGoogleStatus(req.user.userId);

            res.json({
                success: true,
                message: 'Google status retrieved',
                data: status
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get Google status'
            });
        }
    };

    // Internal endpoint for service-to-service communication
    getGoogleTokenInternal = async (req: Request, res: Response): Promise<void> => {
        try {
            // Verify internal service header
            const internalService = req.headers['x-internal-service'];
            if (internalService !== 'planner_service') {
                res.status(403).json({
                    success: false,
                    message: 'Forbidden: Internal service access only'
                });
                return;
            }

            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            const accessToken = await this.googleOAuthService.getValidAccessToken(userId);

            if (!accessToken) {
                res.status(404).json({
                    success: false,
                    message: 'No valid access token available'
                });
                return;
            }

            res.json({
                success: true,
                data: { accessToken }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get access token'
            });
        }
    };
}