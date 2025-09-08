
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/context/useAppContext"
import { useNavigate, useLocation } from "react-router-dom"
import { Degree } from "@/types/Degree"
import { Trash2, Pencil, Eye, ChevronsRight } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"

type Props = {
    degree: Degree,
    deleteDegree: (degreeId: string) => void
}

export function DegreeTableButtons({ degree, deleteDegree }: Props) {

    const { t } = useTranslation()

    const location = useLocation()
    const view = location.state?.view

    const { setDegreeId, setDegreeName, setDegreeAcronym, setCourseId, setSemester } = useAppContext()
    const navigate = useNavigate()

    const goToCourses = () => {
        setDegreeId(degree.id)
        setDegreeName(degree.name)
        setDegreeAcronym(degree.acronym)
        setCourseId(null)
        setSemester(null)
        navigate(`${degree.acronym.toLowerCase()}/courses`)
    }

    const goToSubjects = () => {
        setDegreeId(degree.id)
        setDegreeName(degree.name)
        setDegreeAcronym(degree.acronym)
        navigate(`${degree.acronym.toLowerCase()}/subjects`)
    }

    return (
        <div className="flex justify-end space-x-2">
            {view === "subjects" && (
                <Button variant="outline" size="lg" onClick={() => goToSubjects()}>
                    {t("table.degrees.actions.show.subjects")}<ChevronsRight />
                </Button>
            )}
            {view === "calendars" && (

                <Button variant="outline" size="lg" onClick={() => goToCourses()}>
                    {t("table.degrees.actions.show.courses")}<ChevronsRight />
                </Button>
            )}
            {view === "degrees" && (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Eye />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.classrooms.actions.view")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Pencil />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.classrooms.actions.edit")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteDegree(degree.id)}>
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.classrooms.actions.delete")}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            )}


        </div >
    )
}
