import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import { CreateUserDTO, UpdateUserDTO, UserResponse } from '../types/user.types';
import bcrypt from 'bcrypt';

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createUser(userData: CreateUserDTO): Promise<UserResponse> {
        try {
            // Verificar si el email ya existe
            const existingUser = await this.userRepository.findOne({
                where: { email: userData.email }
            });

            if (existingUser) {
                throw new Error('Email already exists');
            }

            // Encriptar password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            const user = this.userRepository.create({
                ...userData,
                password: hashedPassword
            });

            const savedUser = await this.userRepository.save(user);
            return this.mapToUserResponse(savedUser);
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers(): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.find();
            return users.map(user => this.mapToUserResponse(user));
        } catch (error) {
            throw error;
        }
    }

    async getUserById(id: string): Promise<UserResponse | null> {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            return user ? this.mapToUserResponse(user) : null;
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({ where: { email } });
        } catch (error) {
            throw error;
        }
    }

    async updateUser(id: string, userData: UpdateUserDTO): Promise<UserResponse | null> {
        try {
            const user = await this.userRepository.findOne({ where: { id } });

            if (!user) {
                return null;
            }

            // Verificar email único si se está actualizando
            if (userData.email && userData.email !== user.email) {
                const existingUser = await this.userRepository.findOne({
                    where: { email: userData.email }
                });
                if (existingUser) {
                    throw new Error('Email already exists');
                }
            }

            Object.assign(user, userData);
            const updatedUser = await this.userRepository.save(user);
            return this.mapToUserResponse(updatedUser);
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        try {
            const result = await this.userRepository.delete(id);
            return result.affected === 1;
        } catch (error) {
            throw error;
        }
    }

    async getUsersByRole(role: string): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.find({ where: { role } });
            return users.map(user => this.mapToUserResponse(user));
        } catch (error) {
            throw error;
        }
    }

    async searchUsers(searchTerm: string): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository
                .createQueryBuilder('user')
                .where('user.NAME ILIKE :search', { search: `%${searchTerm}%` })
                .orWhere('user.FIRST_SURNAME ILIKE :search', { search: `%${searchTerm}%` })
                .orWhere('user.SECOND_SURNAME ILIKE :search', { search: `%${searchTerm}%` })
                .orWhere('user.EMAIL ILIKE :search', { search: `%${searchTerm}%` })
                .getMany();

            return users.map(user => this.mapToUserResponse(user));
        } catch (error) {
            throw error;
        }
    }

    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            // Buscar usuario
            const user = await this.userRepository.findOne({ where: { id } });

            if (!user) {
                return false;
            }

            // Verificar contraseña actual
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordValid) {
                return false;
            }

            // Hash de la nueva contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const result = await this.userRepository.update(id, {
                password: hashedPassword
            });

            return result.affected === 1;
        } catch (error) {
            throw error;
        }
    }

    private mapToUserResponse(user: User): UserResponse {
        return {
            id: user.id,
            name: user.name,
            unioviUser: user.unioviUser,
            firstSurname: user.firstSurname,
            secondSurname: user.secondSurname,
            role: user.role,
            email: user.email
        };
    }
}