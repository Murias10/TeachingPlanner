import { useState, FormEvent, ChangeEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { validatePassword } from "@/utils/passwordValidation"
import { PasswordRequirements } from "@/components/ui/password-requirements"

interface RegisterFormData {
    name: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { triggerAlert } = useFloatingAlertContext();

    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        firstSurname: '',
        secondSurname: '',
        role: 'user',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validaciones
            if (formData.password !== formData.confirmPassword) {
                triggerAlert({
                    title: 'Error de validación',
                    description: 'Las contraseñas no coinciden',
                    variant: 'destructive'
                });
                return;
            }

            // Validar requisitos de contraseña
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                triggerAlert({
                    title: 'Error de validación',
                    description: passwordValidation.errors.join(', '),
                    variant: 'destructive'
                });
                return;
            }

            if (!formData.name.trim() || !formData.firstSurname.trim() || !formData.secondSurname.trim()) {
                triggerAlert({
                    title: 'Error de validación',
                    description: 'Por favor, completa todos los campos',
                    variant: 'destructive'
                });
                return;
            }

            // Preparar datos para enviar (excluir confirmPassword del objeto a enviar)
            const registerData = {
                name: formData.name,
                firstSurname: formData.firstSurname,
                secondSurname: formData.secondSurname,
                role: formData.role,
                email: formData.email,
                password: formData.password
            };

            const success = await register(registerData);

            if (success) {
                triggerAlert({
                    title: '¡Registro exitoso!',
                    description: 'Tu cuenta ha sido creada correctamente',
                    variant: 'success'
                });

                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            } else {
                triggerAlert({
                    title: 'Error al registrar',
                    description: 'No se pudo crear la cuenta. Por favor, intenta de nuevo.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
            triggerAlert({
                title: 'Error al registrar',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Crear una cuenta</CardTitle>
                    <CardDescription>
                        Completa tus datos para crear tu nueva cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Juan"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="firstSurname">Primer Apellido</Label>
                                <Input
                                    id="firstSurname"
                                    name="firstSurname"
                                    type="text"
                                    placeholder="Pérez"
                                    value={formData.firstSurname}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="secondSurname">Segundo Apellido</Label>
                                <Input
                                    id="secondSurname"
                                    name="secondSurname"
                                    type="text"
                                    placeholder="García"
                                    value={formData.secondSurname}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <PasswordRequirements
                                password={formData.password}
                                showRequirements={formData.password.length > 0}
                            />

                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirma tu contraseña"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                            </Button>
                        </div>

                        <div className="mt-4 text-center text-sm">
                            ¿Ya tienes una cuenta?{" "}
                            <Link to="/login" className="underline underline-offset-4">
                                Iniciar sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}