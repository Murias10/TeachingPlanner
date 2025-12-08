import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import { LoginDTO, AuthResponse, JwtPayload } from '../types/auth.types';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export class AuthService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async login(loginData: LoginDTO): Promise<AuthResponse> {
        const { email, password } = loginData;

        // Buscar usuario por email
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verificar si el usuario está activo
        if (!user.isActive) {
            throw new Error('Account not activated. Please check your email for the activation link.');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generar token
        const token = this.generateToken(user);

        return {
            user: this.mapToUserResponse(user),
            token
        };
    }

    async activateAccount(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            // Find user by activation token
            const user = await this.userRepository.findOne({
                where: { activationToken: token }
            });

            if (!user) {
                return { success: false, message: 'error.token.invalid' };
            }

            // Check if token is expired
            if (!user.tokenExpiry || new Date() > user.tokenExpiry) {
                return { success: false, message: 'error.token.expired' };
            }

            // Check if already activated
            if (user.isActive) {
                return { success: false, message: 'error.account.already.activated' };
            }

            // Hash new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update user - activate account and set password
            user.password = hashedPassword;
            user.isActive = true;
            user.activationToken = null;
            user.tokenExpiry = null;

            await this.userRepository.save(user);

            return { success: true, message: 'account.activated.successfully' };
        } catch (error) {
            console.error('Error activating account:', error);
            throw new Error('Failed to activate account');
        }
    }

    async validateToken(token: string): Promise<JwtPayload> {
        try {
            const secret = process.env.JWT_SECRET || 'fallback-secret-key';
            const decoded = jwt.verify(token, secret) as JwtPayload;

            // Verificar que el usuario aún existe
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async getUserById(userId: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        return this.mapToUserResponse(user);
    }

    private generateToken(user: User): string {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    private mapToUserResponse(user: User) {
        return {
            id: user.id,
            name: user.name,
            firstSurname: user.firstSurname,
            secondSurname: user.secondSurname,
            role: user.role,
            email: user.email
        };
    }
}