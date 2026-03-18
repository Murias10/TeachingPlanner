import nodemailer from 'nodemailer';
import { emailConfig, appConfig } from '@/config/email.config';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass,
            },
        });
    }

    async sendActivationEmail(email: string, name: string, activationToken: string): Promise<void> {
        const activationUrl = `${appConfig.frontendUrl}/activate?token=${activationToken}`;

        const mailOptions = {
            from: emailConfig.from,
            to: email,
            subject: `Bienvenido a ${appConfig.appName} - Activa tu cuenta`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media only screen and (max-width: 600px) {
                            .email-wrapper { width: 100% !important; }
                            .content-td { padding: 30px 20px !important; }
                            .greeting { font-size: 20px !important; }
                            .header-title { font-size: 24px !important; }
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5" style="background-color: #f5f5f5;">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <!-- Wrapper -->
                                <table class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; max-width: 600px;">

                                    <!-- Header -->
                                    <tr>
                                        <td bgcolor="#1976d2" align="center" style="padding: 40px 30px; background-color: #1976d2;">
                                            <h1 class="header-title" style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0; font-family: Arial, Helvetica, sans-serif; letter-spacing: -0.5px;">${appConfig.appName}</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td class="content-td" bgcolor="#ffffff" style="padding: 40px 30px; background-color: #ffffff;">

                                            <p class="greeting" style="font-size: 24px; font-weight: 600; color: #1976d2; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">¡Hola ${name}!</p>
                                            <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">Se ha creado una cuenta para ti en ${appConfig.appName}. Para comenzar a utilizar la plataforma, necesitas activar tu cuenta y establecer tu contraseña.</p>

                                            <!-- Button -->
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding: 35px 0;">
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td bgcolor="#1976d2" style="border-radius: 8px; background-color: #1976d2;">
                                                                    <a href="${activationUrl}" style="display: block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; white-space: nowrap;">Activar mi cuenta</a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Fallback link -->
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 25px 0;">
                                                <tr>
                                                    <td bgcolor="#f8f9fa" style="padding: 20px; border-radius: 8px; background-color: #f8f9fa;">
                                                        <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif;">O copia y pega este enlace en tu navegador:</p>
                                                        <a href="${activationUrl}" style="word-break: break-all; color: #1976d2; font-size: 14px; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">${activationUrl}</a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Requirements -->
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 25px 0;">
                                                <tr>
                                                    <td bgcolor="#e8f4fd" style="padding: 25px; border-left: 4px solid #1976d2; border-radius: 8px; background-color: #e8f4fd;">
                                                        <p style="font-weight: 600; color: #1976d2; margin: 0 0 15px 0; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Tu contraseña debe cumplir los siguientes requisitos:</p>
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555; font-family: Arial, Helvetica, sans-serif;">&#10003;&nbsp;&nbsp;Mínimo 8 caracteres</td></tr>
                                                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555; font-family: Arial, Helvetica, sans-serif;">&#10003;&nbsp;&nbsp;Al menos una letra mayúscula</td></tr>
                                                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555; font-family: Arial, Helvetica, sans-serif;">&#10003;&nbsp;&nbsp;Al menos una letra minúscula</td></tr>
                                                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555; font-family: Arial, Helvetica, sans-serif;">&#10003;&nbsp;&nbsp;Al menos un número</td></tr>
                                                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555; font-family: Arial, Helvetica, sans-serif;">&#10003;&nbsp;&nbsp;Al menos un carácter especial (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;)</td></tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td bgcolor="#f8f9fa" style="padding: 30px; border-top: 1px solid #e0e0e0; background-color: #f8f9fa;">

                                            <!-- Note -->
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td bgcolor="#fff3cd" style="padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; background-color: #fff3cd;">
                                                        <p style="font-weight: 600; color: #856404; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">Nota importante:</p>
                                                        <p style="font-size: 14px; color: #856404; margin: 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">Este enlace expirará en 48 horas por seguridad.</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="font-size: 13px; color: #666666; text-align: center; margin: 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                                                Si no solicitaste esta cuenta, puedes ignorar este correo.
                                            </p>
                                            <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #dddddd; font-size: 12px; color: #999999; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                                                © ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                                <!-- End Wrapper -->
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            text: `
                ¡Hola ${name},

                Se ha creado una cuenta para ti en ${appConfig.appName}. Para comenzar a utilizar la plataforma, necesitas activar tu cuenta y establecer tu contraseña.

                Activar mi cuenta:
                ${activationUrl}

                O copia y pega este enlace en tu navegador:
                ${activationUrl}

                Tu contraseña debe cumplir los siguientes requisitos:
                1. Mínimo 8 caracteres
                2. Al menos una letra mayúscula
                3. Al menos una letra minúscula
                4. Al menos un número
                5. Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)

                Nota importante: Este enlace expirará en 48 horas por seguridad

                Si no solicitaste esta cuenta, puedes ignorar este correo.

                © ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Activation email sent to ${email}`);
        } catch (error) {
            console.error('Error sending activation email:', error);
            throw new Error('Failed to send activation email');
        }
    }

    async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
        const resetUrl = `${appConfig.frontendUrl}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: emailConfig.from,
            to: email,
            subject: `${appConfig.appName} - Recuperación de contraseña`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5" style="background-color: #f5f5f5;">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; max-width: 600px;">

                                    <!-- Header -->
                                    <tr>
                                        <td bgcolor="#1976d2" align="center" style="padding: 30px 20px; background-color: #1976d2;">
                                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; font-family: Arial, Helvetica, sans-serif;">${appConfig.appName}</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td bgcolor="#ffffff" style="padding: 30px; background-color: #ffffff;">
                                            <h2 style="color: #333333; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">Hola ${name},</h2>
                                            <p style="color: #333333; margin: 0 0 20px 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.</p>

                                            <!-- Button -->
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding: 20px 0;">
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td bgcolor="#1976d2" style="border-radius: 5px; background-color: #1976d2;">
                                                                    <a href="${resetUrl}" style="display: block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; white-space: nowrap;">Restablecer contraseña</a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #333333; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">O copia y pega este enlace en tu navegador:</p>
                                            <p style="word-break: break-all; color: #1976d2; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">${resetUrl}</p>

                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid #dddddd;">
                                                <tr>
                                                    <td style="padding-top: 20px;">
                                                        <p style="font-size: 12px; color: #666666; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;"><strong>Nota importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
                                                        <p style="font-size: 12px; color: #666666; margin: 0; font-family: Arial, Helvetica, sans-serif;">© ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }
}
