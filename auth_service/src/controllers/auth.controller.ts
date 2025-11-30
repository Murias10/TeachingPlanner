import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { PasswordResetService } from '@/services/password-reset.service';
import { ApiResponse, LoginDTO, RegisterDTO, JwtPayload, ForgotPasswordDTO, VerifyOTPDTO, ResetPasswordDTO } from '@/types/auth.types';

interface AuthRequest extends Request {
    user?: JwtPayload;
}

export class AuthController {
    private authService: AuthService;
    private passwordResetService: PasswordResetService;

    constructor() {
        this.authService = new AuthService();
        this.passwordResetService = new PasswordResetService();
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

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const registerData: RegisterDTO = req.body;
            const authResponse = await this.authService.register(registerData);

            const response: ApiResponse = {
                success: true,
                message: 'Registration successful',
                data: authResponse
            };

            res.status(201).json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                success: false,
                message: 'Registration failed',
                error: error.message
            };
            res.status(400).json(response);
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
}