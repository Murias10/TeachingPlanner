import { useState } from "react"
import { AlertVariant } from "@/components/FloatingAlert"

interface AlertState {
    title: string
    description: string
    variant: AlertVariant
}

export function useFloatingAlert(timeout = 5000) {
    const [show, setShow] = useState(false)
    const [alertState, setAlertState] = useState<AlertState>({
        title: "",
        description: "",
        variant: "default",
    })

    const triggerAlert = (state: AlertState) => {
        setAlertState(state)
        setShow(true)
        setTimeout(() => setShow(false), timeout)
    }

    return {
        show,
        alertState,
        triggerAlert,
    }
}
