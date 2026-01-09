// pages/login.tsx
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/AuthContext"
import { Navigate, useLocation } from "react-router-dom"
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function LoginPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    // Si ya está autenticado, redirigir
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/home';
        return <Navigate to={from} replace />;
    }

    // Mostrar loading mientras verifica
    if (isLoading) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center">
                <LoadingSpinner />
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