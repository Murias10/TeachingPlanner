import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";

const LogPage = () => {

    const { setItems } = useBreadcrumbContext()

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
