import { FloatingAlert } from "@/components/FloatingAlert"
import { AlertItem } from "@/hooks/useFloatingAlert"

interface FloatingAlertContainerProps {
    alerts: AlertItem[]
    onCloseAlert: (id: string) => void
}

export function FloatingAlertContainer({ alerts, onCloseAlert }: FloatingAlertContainerProps) {
    return (
        <div className="fixed right-4 bottom-4 z-[9999] max-w-md w-[90%] sm:w-full">
            <div className="flex flex-col-reverse">
                {alerts.map((alert) => (
                    <FloatingAlert
                        key={alert.id}
                        show={alert.show}
                        title={alert.title}
                        description={alert.description}
                        variant={alert.variant}
                        onClose={() => onCloseAlert(alert.id)}
                    />
                ))}
            </div>
        </div>
    )
}
