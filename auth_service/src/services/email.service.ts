import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Código de Recuperación de Contraseña - Teaching Planner',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Recuperación de Contraseña</h2>
                    <p>Hola,</p>
                    <p>Hemos recibido una solicitud para recuperar tu contraseña. Usa el siguiente código en la aplicación:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #007bff; letter-spacing: 2px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #666;">Este código expirará en 15 minutos.</p>
                    <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }
}
