import { FloatingAlert } from "@/components/FloatingAlert"
import { AlertItem } from "@/hooks/useFloatingAlert"

interface FloatingAlertContainerProps {
    alerts: AlertItem[]
}

export function FloatingAlertContainer({ alerts }: FloatingAlertContainerProps) {
    return (
        <div className="fixed right-4 bottom-4 z-[9999] max-w-md w-[90%] sm:w-full">
            <div className="flex flex-col-reverse gap-2">
                {alerts.map((alert) => (
                    <FloatingAlert
                        key={alert.id}
                        show={alert.show}
                        title={alert.title}
                        description={alert.description}
                        variant={alert.variant}
                    />
                ))}
            </div>
        </div>
    )
}
