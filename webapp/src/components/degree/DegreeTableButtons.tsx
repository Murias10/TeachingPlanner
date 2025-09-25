import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Degree } from "@/types/Degree"
import { Trash2, Pencil, Eye, ChevronsRight, BookOpen, GraduationCap } from "lucide-react"
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
        <div className="flex justify-end items-center gap-2">
            {/* Botón Ver Asignaturas */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={goToSubjects}
                        className="lg:size-auto size-10 lg:px-4"
                    >
                        <span className="hidden lg:inline">
                            {t("table.degrees.actions.show.subjects")}
                        </span>
                        <BookOpen className="lg:hidden size-4" />
                        <ChevronsRight className="hidden lg:inline ml-1" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.show.subjects")}</p>
                </TooltipContent>
            </Tooltip>

            {/* Botón Ver Cursos */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={goToCourses}
                        className="lg:size-auto size-10 lg:px-4"
                    >
                        <span className="hidden lg:inline">
                            {t("table.degrees.actions.show.courses")}
                        </span>
                        <GraduationCap className="lg:hidden size-4" />
                        <ChevronsRight className="hidden lg:inline ml-1" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.show.courses")}</p>
                </TooltipContent>
            </Tooltip>

            {/* Botón Ver */}
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

            {/* Botón Editar */}
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

            {/* Botón Eliminar */}
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
        </div>
    )
}