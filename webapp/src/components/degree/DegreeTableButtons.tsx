import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
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

    const navigate = useNavigate()

    const goToCourses = () => {
        navigate(`/degrees/${degree.acronym.toLowerCase()}/courses`)
    }

    const goToSubjects = () => {
        navigate(`/degrees/${degree.acronym.toLowerCase()}/subjects`)
    }

    return (
        <div className="flex justify-end items-center space-x-2">

            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" onClick={goToSubjects} className="w-full">
                    {t("table.degrees.actions.show.subjects")}<ChevronsRight />
                </Button>
                <Button variant="outline" size="lg" onClick={goToCourses} className="w-full">
                    {t("table.degrees.actions.show.courses")}<ChevronsRight />
                </Button>
            </div>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="size-10">
                        <Eye />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.view")}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="size-10">
                        <Pencil />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.edit")}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteDegree(degree.id)}>
                        <Trash2 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.delete")}</p>
                </TooltipContent>
            </Tooltip>
        </div >
    )
}