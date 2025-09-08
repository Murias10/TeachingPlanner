import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import clsx from "clsx"
import { AlertVariant } from "@/hooks/useFloatingAlert"

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
        <Alert className={clsx(
            "shadow-lg transition-all duration-1000 mb-2",
            variantClasses[variant],
            show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
        </Alert>
    )
}