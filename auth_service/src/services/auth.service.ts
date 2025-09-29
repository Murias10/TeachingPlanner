import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import { LoginDTO, RegisterDTO, AuthResponse, JwtPayload } from '../types/auth.types';
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

    async register(registerData: RegisterDTO): Promise<AuthResponse> {
        // Verificar si el email ya existe
        const existingUser = await this.userRepository.findOne({
            where: { email: registerData.email }
        });

        if (existingUser) {
            throw new Error('Email already exists');
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(registerData.password, 10);

        // Crear usuario
        const user = this.userRepository.create({
            ...registerData,
            password: hashedPassword
        });

        const savedUser = await this.userRepository.save(user);

        // Generar token
        const token = this.generateToken(savedUser);

        return {
            user: this.mapToUserResponse(savedUser),
            token
        };
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