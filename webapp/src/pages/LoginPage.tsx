// pages/login.tsx
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/AuthContext"
import { Navigate, useLocation } from "react-router-dom"

export default function LoginPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Si ya está autenticado, redirigir
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    // Mostrar loading mientras verifica
    if (isLoading) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    )
}