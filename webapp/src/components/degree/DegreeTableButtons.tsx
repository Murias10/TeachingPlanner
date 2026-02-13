import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Degree } from "@/types/Degree"
import { Trash2, Pencil, ChevronsRight, GraduationCap } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { ProtectedComponent } from "@/components/ProtectedComponent"

type Props = {
    degree: Degree,
    deleteDegree: (degreeId: string) => void,
    editDegree?: (degree: Degree) => void
}

export function DegreeTableButtons({ degree, deleteDegree, editDegree }: Props) {

    const { t } = useTranslation()

    const navigate = useNavigate()

    const goToCourses = () => {
        navigate(`/degrees/${degree.acronym.toLowerCase()}/courses`)
    }

    return (
        <div className="flex justify-end items-center gap-2">
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
            {/* <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="size-10">
                        <Eye />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("table.degrees.actions.view")}</p>
                </TooltipContent>
            </Tooltip> */}

            {/* Botón Editar */}
            <ProtectedComponent requiredRoles={["ADMIN"]}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-10"
                            onClick={() => editDegree?.(degree)}
                            aria-label="Edit"
                            data-testid="edit-button"
                        >
                            <Pencil />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("table.degrees.actions.edit")}</p>
                    </TooltipContent>
                </Tooltip>
            </ProtectedComponent>

            {/* Botón Eliminar */}
            <ProtectedComponent requiredRoles={["ADMIN"]}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="size-10"
                            onClick={() => deleteDegree(degree.id)}
                            aria-label="Delete"
                            data-testid="delete-button"
                        >
                            <Trash2 />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("table.degrees.actions.delete")}</p>
                    </TooltipContent>
                </Tooltip>
            </ProtectedComponent>
        </div>
    )
}