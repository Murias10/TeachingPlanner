import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";

const ReportPage = () => {

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Registros de uso", href: "/reports" },
        ])
    }, [setItems])

    return (
        <>
            <h1>REPORTS PAGE</h1>

        </>
    );
};

export default ReportPage;
