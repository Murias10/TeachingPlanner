import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, X } from "lucide-react"
import clsx from "clsx"
import { AlertVariant } from "@/hooks/useFloatingAlert"

export interface FloatingAlertProps {
    show: boolean
    title: string
    description: string
    variant?: AlertVariant
    onClose?: () => void
}

const variantClasses: Record<AlertVariant, string> = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
}

export function FloatingAlert({
    show,
    title,
    description,
    variant = "default",
    onClose,
}: FloatingAlertProps) {
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onClose?.();
    };

    return (
        <div
            className={clsx(
                "relative transition-all duration-1000 mb-2 pointer-events-auto",
                show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <Alert className={clsx(
                "shadow-lg",
                onClose && "pr-10",
                variantClasses[variant]
            )}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
            </Alert>
            {onClose && (
                <button
                    onClick={handleClose}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring transition-transform cursor-pointer"
                    style={{ zIndex: 9999 }}
                    aria-label="Cerrar alerta"
                    type="button"
                >
                    <X className="h-3 w-3 text-gray-600 pointer-events-none" strokeWidth={2.5} />
                </button>
            )}
        </div>
    )
}