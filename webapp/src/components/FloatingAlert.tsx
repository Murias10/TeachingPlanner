// components/FloatingAlert.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import clsx from "clsx"

export type AlertVariant = "default" | "destructive" | "success" | "warning"

export interface FloatingAlertProps {
    show: boolean
    title: string
    description: string
    variant?: AlertVariant
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
}: FloatingAlertProps) {
    return (
        <div
            className={clsx(
                "fixed left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[9999] transition-all duration-1000",
                show ? "bottom-4 opacity-100" : "-bottom-20 opacity-0"
            )}
        >
            <Alert className={clsx("shadow-lg", variantClasses[variant])}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
            </Alert>
        </div>
    )
}
