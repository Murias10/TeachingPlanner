import { Request, Response } from 'express';
import { UserService } from '@/service/user.service'
import { ApiResponse, CreateUserDTO, UpdateUserDTO } from '../types/user.types';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userData: CreateUserDTO = req.body;
            const user = await this.userService.createUser(userData);

            const response: ApiResponse = {
                status: 'success',
                message: 'User created successfully',
                data: user
            };

            res.status(201).json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to create user',
                error: error.message
            };
            res.status(400).json(response);
        }
    };

    getAllUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userService.getAllUsers();

            const response: ApiResponse = {
                status: 'success',
                message: 'Users retrieved successfully',
                data: users
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to retrieve users',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            if (!user) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'User not found'
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                status: 'success',
                message: 'User retrieved successfully',
                data: user
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to retrieve user',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userData: UpdateUserDTO = req.body;

            const user = await this.userService.updateUser(id, userData);

            if (!user) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'User not found'
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                status: 'success',
                message: 'User updated successfully',
                data: user
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to update user',
                error: error.message
            };
            res.status(400).json(response);
        }
    };

    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const deleted = await this.userService.deleteUser(id);

            if (!deleted) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'User not found'
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                status: 'success',
                message: 'User deleted successfully'
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to delete user',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    getUsersByRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const { role } = req.params;
            const users = await this.userService.getUsersByRole(role);

            const response: ApiResponse = {
                status: 'success',
                message: `Users with role '${role}' retrieved successfully`,
                data: users
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to retrieve users by role',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    searchUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'Search query is required'
                };
                res.status(400).json(response);
                return;
            }

            const users = await this.userService.searchUsers(q);

            const response: ApiResponse = {
                status: 'success',
                message: 'Search completed successfully',
                data: users
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Search failed',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    updatePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'Password must be at least 6 characters long'
                };
                res.status(400).json(response);
                return;
            }

            const updated = await this.userService.updatePassword(id, newPassword);

            if (!updated) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'User not found'
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                status: 'success',
                message: 'Password updated successfully'
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to update password',
                error: error.message
            };
            res.status(500).json(response);
        }
    };
}