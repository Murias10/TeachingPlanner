import { useFloatingAlert } from "@/hooks/useFloatingAlert"
import { FloatingAlert, AlertVariant } from "@/components/FloatingAlert"
import { FloatingAlertContext } from "@/context/FloatingAlertContextInstance"

interface TriggerAlertArgs {
    title: string
    description: string
    variant: AlertVariant
}

export interface FloatingAlertContextType {
    triggerAlert: (args: TriggerAlertArgs) => void
}

export function FloatingAlertProvider({ children }: { children: React.ReactNode }) {
    const { show, alertState, triggerAlert } = useFloatingAlert()

    return (
        <FloatingAlertContext.Provider value={{ triggerAlert }}>
            {children}
            <FloatingAlert
                show={show}
                title={alertState.title}
                description={alertState.description}
                variant={alertState.variant}
            />
        </FloatingAlertContext.Provider>
    )
}


