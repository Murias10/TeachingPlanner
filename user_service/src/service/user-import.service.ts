import * as XLSX from 'xlsx';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppDataSource } from '@/config/data-source';
import { User } from '@/entities/user.entity';
import { EmailService } from './email.service';
import { appConfig } from '@/config/email.config';

interface ImportUserRow {
    unioviUser: string;
    name: string;
    surnames: string;
    email: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
    type: 'error' | 'warning';
}

interface ImportResult {
    totalRows: number;
    validRows: ImportUserRow[];
    invalidRows: Array<{
        row: number;
        data: ImportUserRow;
        errors: ValidationError[];
    }>;
    warningRows: Array<{
        row: number;
        data: ImportUserRow;
        warnings: ValidationError[];
    }>;
    processedCount?: number;
    createdCount?: number;
    skippedCount?: number;
    errorCount?: number;
}

export class UserImportService {
    private static userRepository = AppDataSource.getRepository(User);
    private static emailService = new EmailService();

    /**
     * Parse Excel file and validate rows
     */
    static async parseAndValidate(fileBuffer: Buffer): Promise<ImportResult> {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row
        const dataRows = data.slice(1);

        const validRows: ImportUserRow[] = [];
        const invalidRows: Array<{ row: number; data: ImportUserRow; errors: ValidationError[] }> = [];
        const warningRows: Array<{ row: number; data: ImportUserRow; warnings: ValidationError[] }> = [];

        for (let i = 0; i < dataRows.length; i++) {
            const rowIndex = i + 2; // +2 because of header and 0-indexing
            const row = dataRows[i];

            // Skip empty rows
            if (!row || row.every((cell: any) => !cell)) continue;

            const userData: ImportUserRow = {
                unioviUser: row[0]?.toString().trim() || '',
                name: row[1]?.toString().trim() || '',
                surnames: row[2]?.toString().trim() || '',
                email: row[3]?.toString().trim().toLowerCase() || ''
            };

            const validationResults = await this.validateUserRow(userData, rowIndex);
            const errors = validationResults.filter(v => v.type === 'error');
            const warnings = validationResults.filter(v => v.type === 'warning');

            if (errors.length > 0) {
                invalidRows.push({ row: rowIndex, data: userData, errors });
            } else if (warnings.length > 0) {
                warningRows.push({ row: rowIndex, data: userData, warnings });
                validRows.push(userData); // Can still be imported
            } else {
                validRows.push(userData);
            }
        }

        return {
            totalRows: dataRows.length,
            validRows,
            invalidRows,
            warningRows
        };
    }

    /**
     * Validate a single user row
     */
    private static async validateUserRow(user: ImportUserRow, rowNumber: number): Promise<ValidationError[]> {
        const validationResults: ValidationError[] = [];

        // Usuario uniovi validation
        if (!user.unioviUser || user.unioviUser.length === 0) {
            validationResults.push({ row: rowNumber, field: 'unioviUser', message: 'El usuario uniovi es obligatorio', type: 'error' });
        }

        // Name validation
        if (!user.name || user.name.length === 0) {
            validationResults.push({ row: rowNumber, field: 'name', message: 'El nombre es obligatorio', type: 'error' });
        }

        // Surnames validation
        if (!user.surnames || user.surnames.length === 0) {
            validationResults.push({ row: rowNumber, field: 'surnames', message: 'Los apellidos son obligatorios', type: 'error' });
        }

        // Email validation
        if (!user.email || user.email.length === 0) {
            validationResults.push({ row: rowNumber, field: 'email', message: 'El email es obligatorio', type: 'error' });
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user.email)) {
                validationResults.push({ row: rowNumber, field: 'email', message: 'Formato de email inválido', type: 'error' });
            } else {
                // Check if email already exists - this is a warning, not an error
                const existingUser = await this.userRepository.findOne({ where: { email: user.email } });
                if (existingUser) {
                    validationResults.push({ row: rowNumber, field: 'email', message: 'El usuario ya existe, se omitirá', type: 'warning' });
                }
            }
        }

        return validationResults;
    }

    /**
     * Capitalize each word (first letter uppercase, rest lowercase)
     */
    private static capitalizeWords(text: string): string {
        return text
            .split(' ')
            .map(word => {
                if (word.length === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    /**
     * Import users into database
     */
    static async importUsers(validRows: ImportUserRow[], sendEmail: boolean = false): Promise<ImportResult> {
        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const userData of validRows) {
            try {
                // Check if user already exists by email or unioviUser (skip duplicates)
                const existingUserByEmail = await this.userRepository.findOne({ where: { email: userData.email } });
                if (existingUserByEmail) {
                    skippedCount++;
                    continue;
                }

                // Also check by unioviUser if provided
                if (userData.unioviUser) {
                    const existingUserByUnioviUser = await this.userRepository.findOne({
                        where: { unioviUser: userData.unioviUser }
                    });
                    if (existingUserByUnioviUser) {
                        skippedCount++;
                        continue;
                    }
                }

                // Capitalize name and surnames
                const capitalizedName = this.capitalizeWords(userData.name);
                const capitalizedSurnames = this.capitalizeWords(userData.surnames);

                // Split surnames into first and second (if exists)
                const surnames = capitalizedSurnames.split(' ');
                const firstSurname = surnames[0] || '';
                const secondSurname = surnames.slice(1).join(' ') || '';

                // Generate activation token
                const activationToken = crypto.randomBytes(32).toString('hex');
                const tokenExpiry = new Date(Date.now() + appConfig.activationTokenExpiry);

                // Create temporary password (will be replaced during activation)
                const tempPassword = crypto.randomBytes(32).toString('hex');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                // Create user entity
                const user = this.userRepository.create({
                    name: capitalizedName,
                    unioviUser: userData.unioviUser,
                    firstSurname: firstSurname,
                    secondSurname: secondSurname,
                    email: userData.email,
                    role: 'PROFESSOR', // Default role for imported users
                    password: hashedPassword,
                    activationToken,
                    tokenExpiry,
                    isActive: false
                });

                await this.userRepository.save(user);

                // Send activation email only if sendEmail is true
                if (sendEmail) {
                    try {
                        await this.emailService.sendActivationEmail(
                            user.email,
                            user.name,
                            activationToken
                        );
                    } catch (emailError) {
                        console.error(`Failed to send activation email to ${user.email}:`, emailError);
                        // Don't throw error - user is created, email can be resent
                    }
                }

                createdCount++;
            } catch (error) {
                console.error(`Error creating user ${userData.email}:`, error);
                errorCount++;
            }
        }

        return {
            totalRows: validRows.length,
            validRows: [],
            invalidRows: [],
            warningRows: [],
            processedCount: validRows.length,
            createdCount,
            skippedCount,
            errorCount
        };
    }
}
