import { Request, Response } from 'express';
import { validate as isValidUUID } from 'uuid';
import { UserService } from '@/service/user.service';
import { UserImportService } from '@/service/user-import.service';
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
            const { currentPassword, newPassword } = req.body;

            const updated = await this.userService.updatePassword(id, currentPassword, newPassword);

            if (!updated) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'User not found or invalid current password'
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

    /**
     * Preview import: Validate Excel file and return validation results
     */
    previewImport = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'No file uploaded'
                };
                res.status(400).json(response);
                return;
            }

            const result = await UserImportService.parseAndValidate(req.file.buffer);

            const response: ApiResponse = {
                status: 'success',
                message: 'File validated successfully',
                data: result
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to validate file',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    /**
     * Import users: Create users from validated data
     */
    importUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'No file uploaded'
                };
                res.status(400).json(response);
                return;
            }

            // First validate
            const validation = await UserImportService.parseAndValidate(req.file.buffer);

            if (validation.invalidRows.length > 0) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'File contains invalid rows. Please fix errors and try again.',
                    data: validation
                };
                res.status(400).json(response);
                return;
            }

            // Get sendEmail parameter from body
            const sendEmail = req.body.sendEmail === true || req.body.sendEmail === 'true';

            // Then import
            const result = await UserImportService.importUsers(validation.validRows, sendEmail);

            const response: ApiResponse = {
                status: 'success',
                message: `Import completed. Created: ${result.createdCount}, Errors: ${result.errorCount}`,
                data: result
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to import users',
                error: error.message
            };
            res.status(500).json(response);
        }
    };

    /**
     * Send activation email to a user
     */
    sendActivationEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Validate UUID format
            if (!isValidUUID(id)) {
                const response: ApiResponse = {
                    status: 'error',
                    message: 'Invalid user ID format'
                };
                res.status(400).json(response);
                return;
            }

            const result = await this.userService.sendActivationEmail(id);

            if (!result.success) {
                const response: ApiResponse = {
                    status: 'error',
                    message: result.message
                };
                res.status(400).json(response);
                return;
            }

            const response: ApiResponse = {
                status: 'success',
                message: result.message
            };

            res.json(response);
        } catch (error: any) {
            const response: ApiResponse = {
                status: 'error',
                message: 'Failed to send activation email',
                error: error.message
            };
            res.status(500).json(response);
        }
    };
}