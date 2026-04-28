import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GraduationCap, FolderOpen, type LucideIcon } from "lucide-react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym"

interface FinalItem {
    label: string
    icon: LucideIcon
}

export function useCourseNavBreadcrumb(
    acronym: string | undefined,
    startYear: string | undefined,
    endYear: string | undefined,
    semester: string | undefined,
    finalItem: FinalItem
) {
    const { t } = useTranslation()
    const { setItems } = useBreadcrumbContext()

    const { data: courses } = useCoursesByDegreeAcronym(acronym || null)
    const course = courses?.find(
        c => c.startYear.toString() === startYear && c.endYear.toString() === endYear
    )

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.degrees"), href: "/degrees", icon: GraduationCap },
            ...(course?.degree
                ? [{ label: course.degree.name, href: "", shortLabel: acronym?.toUpperCase() }]
                : []),
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses`, icon: FolderOpen },
            ...(course
                ? [{
                    label: `${course.startYear}/${course.endYear}`,
                    href: "",
                    shortLabel: `${String(course.startYear).slice(-2)}/${String(course.endYear).slice(-2)}`,
                }]
                : []),
            ...(semester
                ? [{ label: `${t("breadcrumb.semester")} ${semester}`, href: "", shortLabel: semester }]
                : []),
            { label: finalItem.label, href: "", icon: finalItem.icon },
        ])
    }, [setItems, t, acronym, startYear, endYear, semester, course, finalItem.label, finalItem.icon])
}
