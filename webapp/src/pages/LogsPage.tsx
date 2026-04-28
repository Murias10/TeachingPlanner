import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

const LogPage = () => {
    const { t } = useTranslation()
    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home", shortLabel: t("breadcrumb.home") },
            { label: t("breadcrumb.logs"), href: "/logs", icon: FileText },
        ])
    }, [setItems, t])

    return (
        <>
            <h1>SYSTEM LOGS PAGE</h1>

        </>
    );
};

export default LogPage;
