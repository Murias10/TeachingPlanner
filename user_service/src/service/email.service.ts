import nodemailer from 'nodemailer';
import { emailConfig, appConfig } from '@/config/email.config';

type Language = 'es' | 'en';

interface EmailTranslations {
    subject: string;
    greeting: string;
    intro: string;
    buttonText: string;
    copyLink: string;
    requirementsTitle: string;
    requirements: string[];
    noteTitle: string;
    noteExpiry: string;
    noteIgnore: string;
    copyright: string;
}

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

    private getActivationTranslations(lang: Language): EmailTranslations {
        const translations = {
            es: {
                subject: `Bienvenido a ${appConfig.appName} - Activa tu cuenta`,
                greeting: '¡Hola',
                intro: `Se ha creado una cuenta para ti en ${appConfig.appName}. Para comenzar a utilizar la plataforma, necesitas activar tu cuenta y establecer tu contraseña.`,
                buttonText: 'Activar mi cuenta',
                copyLink: 'O copia y pega este enlace en tu navegador:',
                requirementsTitle: 'Tu contraseña debe cumplir los siguientes requisitos:',
                requirements: [
                    'Mínimo 8 caracteres',
                    'Al menos una letra mayúscula',
                    'Al menos una letra minúscula',
                    'Al menos un número',
                    'Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
                ],
                noteTitle: 'Nota importante:',
                noteExpiry: 'Este enlace expirará en 48 horas por seguridad.',
                noteIgnore: 'Si no solicitaste esta cuenta, puedes ignorar este correo.',
                copyright: `© ${new Date().getFullYear()} ${appConfig.appName}. Todos los derechos reservados.`
            },
            en: {
                subject: `Welcome to ${appConfig.appName} - Activate your account`,
                greeting: 'Hello',
                intro: `An account has been created for you on ${appConfig.appName}. To start using the platform, you need to activate your account and set your password.`,
                buttonText: 'Activate my account',
                copyLink: 'Or copy and paste this link into your browser:',
                requirementsTitle: 'Your password must meet the following requirements:',
                requirements: [
                    'Minimum 8 characters',
                    'At least one uppercase letter',
                    'At least one lowercase letter',
                    'At least one number',
                    'At least one special character (!@#$%^&*(),.?":{}|<>)'
                ],
                noteTitle: 'Important note:',
                noteExpiry: 'This link will expire in 48 hours for security.',
                noteIgnore: 'If you did not request this account, you can ignore this email.',
                copyright: `© ${new Date().getFullYear()} ${appConfig.appName}. All rights reserved.`
            }
        };

        return translations[lang];
    }

    async sendActivationEmail(email: string, name: string, activationToken: string, language: Language = 'es'): Promise<void> {
        const activationUrl = `${appConfig.frontendUrl}/activate?token=${activationToken}`;
        const t = this.getActivationTranslations(language);

        const mailOptions = {
            from: emailConfig.from,
            to: email,
            subject: t.subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f5f5f5;
                        }
                        .email-wrapper {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                        }
                        .header {
                            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
                            color: white;
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            font-size: 28px;
                            font-weight: 600;
                            margin: 0;
                            letter-spacing: -0.5px;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .greeting {
                            font-size: 24px;
                            font-weight: 600;
                            color: #1976d2;
                            margin-bottom: 20px;
                        }
                        .intro {
                            font-size: 16px;
                            color: #555;
                            margin-bottom: 30px;
                            line-height: 1.8;
                        }
                        .button-container {
                            text-align: center;
                            margin: 35px 0;
                        }
                        .button {
                            display: inline-block;
                            padding: 16px 40px;
                            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
                            color: white !important;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            font-size: 16px;
                            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
                            transition: all 0.3s ease;
                        }
                        .button:hover {
                            box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
                            transform: translateY(-2px);
                        }
                        .link-section {
                            background-color: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 25px 0;
                        }
                        .link-label {
                            font-size: 14px;
                            color: #666;
                            margin-bottom: 10px;
                        }
                        .link-url {
                            word-break: break-all;
                            color: #1976d2;
                            font-size: 14px;
                            text-decoration: none;
                        }
                        .requirements {
                            background: linear-gradient(to right, #e3f2fd, #f8f9fa);
                            padding: 25px;
                            border-left: 4px solid #1976d2;
                            border-radius: 8px;
                            margin: 25px 0;
                        }
                        .requirements-title {
                            font-weight: 600;
                            color: #1976d2;
                            margin-bottom: 15px;
                            font-size: 15px;
                        }
                        .requirements ul {
                            list-style: none;
                            padding-left: 0;
                        }
                        .requirements li {
                            padding: 8px 0;
                            padding-left: 25px;
                            position: relative;
                            font-size: 14px;
                            color: #555;
                        }
                        .requirements li:before {
                            content: "✓";
                            position: absolute;
                            left: 0;
                            color: #1976d2;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .footer {
                            background-color: #f8f9fa;
                            padding: 30px;
                            border-top: 1px solid #e0e0e0;
                        }
                        .note {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            border-radius: 4px;
                            margin-bottom: 20px;
                        }
                        .note-title {
                            font-weight: 600;
                            color: #856404;
                            margin-bottom: 8px;
                        }
                        .note-text {
                            font-size: 14px;
                            color: #856404;
                            line-height: 1.6;
                        }
                        .footer-text {
                            font-size: 13px;
                            color: #666;
                            text-align: center;
                            line-height: 1.6;
                        }
                        .copyright {
                            margin-top: 15px;
                            padding-top: 15px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #999;
                        }
                        @media only screen and (max-width: 600px) {
                            .content {
                                padding: 30px 20px;
                            }
                            .header {
                                padding: 30px 20px;
                            }
                            .header h1 {
                                font-size: 24px;
                            }
                            .greeting {
                                font-size: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="email-wrapper">
                        <div class="header">
                            <h1>${appConfig.appName}</h1>
                        </div>
                        <div class="content">
                            <div class="greeting">${t.greeting} ${name}!</div>
                            <p class="intro">${t.intro}</p>

                            <div class="button-container">
                                <a href="${activationUrl}" class="button">${t.buttonText}</a>
                            </div>

                            <div class="link-section">
                                <div class="link-label">${t.copyLink}</div>
                                <a href="${activationUrl}" class="link-url">${activationUrl}</a>
                            </div>

                            <div class="requirements">
                                <div class="requirements-title">${t.requirementsTitle}</div>
                                <ul>
                                    ${t.requirements.map(req => `<li>${req}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="footer">
                            <div class="note">
                                <div class="note-title">${t.noteTitle}</div>
                                <div class="note-text">${t.noteExpiry}</div>
                            </div>
                            <div class="footer-text">
                                ${t.noteIgnore}
                                <div class="copyright">${t.copyright}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                ${t.greeting} ${name},

                ${t.intro}

                ${t.buttonText}:
                ${activationUrl}

                ${t.copyLink}
                ${activationUrl}

                ${t.requirementsTitle}
                ${t.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

                ${t.noteTitle} ${t.noteExpiry}

                ${t.noteIgnore}

                ${t.copyright}
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Activation email sent to ${email} in ${language}`);
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
