// components/auth/ProtectedComponent.tsx
import { ReactNode, cloneElement, isValidElement, ReactElement } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProtectedComponentProps {
    children: ReactNode;
    requiredRoles?: string[]; // ["ADMIN", "TEACHER"] - roles en MAYÚSCULAS como en la BD
    requireAuth?: boolean;
    fallback?: ReactNode; // Qué mostrar si no tiene permisos
    hideIfNoAccess?: boolean; // true = ocultar, false = deshabilitar
    disabledTooltip?: string;
}

export function ProtectedComponent({
    children,
    requiredRoles,
    requireAuth = true,
    fallback = null,
    hideIfNoAccess = true, // Por defecto oculta
    disabledTooltip = "No tienes permisos para esta acción"
}: ProtectedComponentProps) {
    const { user, isAuthenticated } = useAuth();

    const hasAccess = () => {
        // Verificar autenticación
        if (requireAuth && !isAuthenticated) {
            return false;
        }

        // Verificar roles
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRequiredRole = requiredRoles.some(role =>
                user?.role === role
            );
            return hasRequiredRole;
        }

        return true;
    };

    // Si no tiene acceso
    if (!hasAccess()) {
        // Si debe ocultar, retornar fallback
        if (hideIfNoAccess) {
            return <>{fallback}</>;
        }

        // Si debe deshabilitar, clonar el children y agregar disabled
        if (isValidElement<{ disabled?: boolean; className?: string }>(children)) {
            const child = children as ReactElement<{ disabled?: boolean; className?: string }>;
            const disabledChild = cloneElement(child, {
                disabled: true,
                className: `${child.props.className || ''} cursor-not-allowed opacity-50`
            });

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-block">
                            {disabledChild}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{disabledTooltip}</p>
                    </TooltipContent>
                </Tooltip>
            );
        }

        return <>{fallback}</>;
    }

    return <>{children}</>;
}