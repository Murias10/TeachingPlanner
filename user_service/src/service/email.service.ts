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
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: #1976d2;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: white;
                            padding: 30px;
                            border-radius: 0 0 5px 5px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 30px;
                            margin: 20px 0;
                            background-color: #1976d2;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #666;
                        }
                        .password-requirements {
                            background-color: #f5f5f5;
                            padding: 15px;
                            border-left: 4px solid #1976d2;
                            margin: 15px 0;
                        }
                        .password-requirements ul {
                            margin: 10px 0;
                            padding-left: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${appConfig.appName}</h1>
                        </div>
                        <div class="content">
                            <h2>¡Hola ${name}!</h2>
                            <p>Se ha creado una cuenta para ti en ${appConfig.appName}. Para comenzar a utilizar la plataforma, necesitas activar tu cuenta y establecer tu contraseña.</p>

                            <p style="text-align: center;">
                                <a href="${activationUrl}" class="button">Activar mi cuenta</a>
                            </p>

                            <p>O copia y pega este enlace en tu navegador:</p>
                            <p style="word-break: break-all; color: #1976d2;">${activationUrl}</p>

                            <div class="password-requirements">
                                <strong>Tu contraseña debe cumplir los siguientes requisitos:</strong>
                                <ul>
                                    <li>Mínimo 8 caracteres</li>
                                    <li>Al menos una letra mayúscula</li>
                                    <li>Al menos una letra minúscula</li>
                                    <li>Al menos un número</li>
                                    <li>Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)</li>
                                </ul>
                            </div>

                            <div class="footer">
                                <p><strong>Nota importante:</strong> Este enlace expirará en 48 horas por seguridad.</p>
                                <p>Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
                                <p>© ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Hola ${name},

                Se ha creado una cuenta para ti en ${appConfig.appName}. Para comenzar a utilizar la plataforma, necesitas activar tu cuenta y establecer tu contraseña.

                Haz clic en el siguiente enlace para activar tu cuenta:
                ${activationUrl}

                Tu contraseña debe cumplir los siguientes requisitos:
                - Mínimo 8 caracteres
                - Al menos una letra mayúscula
                - Al menos una letra minúscula
                - Al menos un número
                - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)

                Nota importante: Este enlace expirará en 48 horas por seguridad.

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
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: #1976d2;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: white;
                            padding: 30px;
                            border-radius: 0 0 5px 5px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 30px;
                            margin: 20px 0;
                            background-color: #1976d2;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${appConfig.appName}</h1>
                        </div>
                        <div class="content">
                            <h2>Hola ${name},</h2>
                            <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.</p>

                            <p style="text-align: center;">
                                <a href="${resetUrl}" class="button">Restablecer contraseña</a>
                            </p>

                            <p>O copia y pega este enlace en tu navegador:</p>
                            <p style="word-break: break-all; color: #1976d2;">${resetUrl}</p>

                            <div class="footer">
                                <p><strong>Nota importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
                                <p>© ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </div>
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
