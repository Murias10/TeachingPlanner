import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { BarChart } from "lucide-react";

const ReportPage = () => {
    const { t } = useTranslation()
    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home", shortLabel: t("breadcrumb.home") },
            { label: t("breadcrumb.reports"), href: "/reports", icon: BarChart },
        ])
    }, [setItems, t])

    return (
        <>
            <h1>REPORTS PAGE</h1>

        </>
    );
};

export default ReportPage;
