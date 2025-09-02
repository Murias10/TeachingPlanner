
import { GroupToolbar } from "@/components/GroupToolbar"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useEffect } from "react"
import { GroupTable } from "@/components/GroupTable"
import { useTranslation } from "react-i18next"

export default function GroupPage() {

    const { t } = useTranslation()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: "/courses" },
            { label: t("breadcrumb.groups"), href: "/groups" }
        ])
    }, [setItems, t])



    return (
        <>
            <GroupToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <GroupTable />

                </div>
            </section>
        </>
    )
}