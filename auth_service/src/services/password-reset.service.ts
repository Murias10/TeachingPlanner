import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EmailService } from './email.service';

interface PasswordResetRequest {
    email: string;
    otp: string;
    resetToken: string;
    expiresAt: number;
    createdAt: number;
}

export class PasswordResetService {
    private userRepository: Repository<User>;
    private emailService: EmailService;
    private resetRequests: Map<string, PasswordResetRequest> = new Map();
    private otpCooldown: Map<string, number> = new Map();

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.emailService = new EmailService();
    }

    async requestPasswordReset(email: string): Promise<{ message: string }> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            // No revelar si el email existe o no por seguridad
            return { message: 'Si el email existe en el sistema, recibirás un código' };
        }

        // Verificar cooldown (60 segundos entre intentos)
        const lastRequestTime = this.otpCooldown.get(email);
        if (lastRequestTime && Date.now() - lastRequestTime < 60000) {
            const remainingSeconds = Math.ceil((60000 - (Date.now() - lastRequestTime)) / 1000);
            throw new Error(`Espera ${remainingSeconds} segundos antes de solicitar otro código`);
        }

        // Generar OTP de 6 dígitos
        const otp = crypto.randomInt(100000, 999999).toString();

        // Generar reset token
        const resetToken = this.generateResetToken(user.id);

        // Guardar request en memoria (en producción usar Redis)
        const otpKey = `otp:${email}`;
        this.resetRequests.set(otpKey, {
            email,
            otp,
            resetToken,
            expiresAt: Date.now() + 900000, // 15 minutos
            createdAt: Date.now()
        });

        // Actualizar cooldown
        this.otpCooldown.set(email, Date.now());

        // Enviar email
        await this.emailService.sendPasswordResetEmail(email, otp);

        return { message: 'Código de recuperación enviado a tu email' };
    }

    async verifyOTP(email: string, otp: string): Promise<{ resetToken: string }> {
        const otpKey = `otp:${email}`;
        const request = this.resetRequests.get(otpKey);

        if (!request) {
            throw new Error('Solicitud de recuperación no encontrada. Por favor, solicita un nuevo código');
        }

        if (Date.now() > request.expiresAt) {
            this.resetRequests.delete(otpKey);
            throw new Error('El código ha expirado. Por favor, solicita uno nuevo');
        }

        if (request.otp !== otp) {
            throw new Error('Código incorrecto');
        }

        // OTP verificado exitosamente
        this.resetRequests.delete(otpKey);

        return { resetToken: request.resetToken };
    }

    async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
        try {
            const secret = process.env.JWT_SECRET || 'fallback-secret-key';
            const decoded = jwt.verify(resetToken, secret) as { userId: string };

            // Verificar que la contraseña tenga mínimo 6 caracteres
            if (newPassword.length < 6) {
                throw new Error('La contraseña debe tener mínimo 6 caracteres');
            }

            // Obtener usuario
            const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Hash nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar contraseña
            user.password = hashedPassword;
            await this.userRepository.save(user);

            return { message: 'Contraseña actualizada correctamente' };
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('El link de recuperación ha expirado. Por favor, solicita uno nuevo');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Link de recuperación inválido');
            }
            throw error;
        }
    }

    private generateResetToken(userId: string): string {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';
        const expiryTime = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1800000'); // 30 minutos

        return jwt.sign(
            { userId },
            secret,
            { expiresIn: `${expiryTime / 1000}s` }
        );
    }
}
