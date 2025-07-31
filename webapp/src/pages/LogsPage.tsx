import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"

const LogPage = () => {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Logs", href: "/logs" },
        ])
    }, [setItems])

    return (
        <>
            <h1>SYSTEM LOGS PAGE</h1>

        </>
    );
};

export default LogPage;
