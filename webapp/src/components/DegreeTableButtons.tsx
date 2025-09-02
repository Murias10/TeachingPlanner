
import { Button } from "@/components/ui/button"
import { useDegreeContext } from "@/context/useDegreeContext"
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
    onDegreeDeleted?: () => void
}

export function DegreeTableButtons({ degree, onDegreeDeleted }: Props) {

    const { t } = useTranslation()

    const location = useLocation()
    const view = location.state?.view

    const { setDegreeId, setDegreeName, setDegreeAcronym } = useDegreeContext()
    const navigate = useNavigate()

    const goToCourses = () => {
        setDegreeId(degree.id)
        setDegreeName(degree.name)
        setDegreeAcronym(degree.acronym)
        navigate(`${degree.acronym.toLowerCase()}/courses`)
    }

    const goToSubjects = () => {
        setDegreeId(degree.id)
        setDegreeName(degree.name)
        setDegreeAcronym(degree.acronym)
        navigate(`${degree.acronym.toLowerCase()}/subjects`)
    }

    const handleDelete = async () => {
        try {
            const res = await fetch(`http://localhost:8080/degree/${degree.id}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                console.error("Error al eliminar aula", await res.text());
                return;
            }
            if (onDegreeDeleted) onDegreeDeleted();
        } catch (err) {
            console.error("Error de red:", err);
        }
    };

    return (
        <div className="flex justify-end space-x-2">
            {view === "subjects" && (
                <Button variant="outline" size="lg" onClick={() => goToSubjects()}>
                    <ChevronsRight />Show subjects
                </Button>
            )}
            {view === "calendars" && (

                <Button variant="outline" size="lg" onClick={() => goToCourses()}>
                    <ChevronsRight /> Show courses
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
                            <Button variant="destructive" size="icon" className="size-10" onClick={handleDelete}>
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
