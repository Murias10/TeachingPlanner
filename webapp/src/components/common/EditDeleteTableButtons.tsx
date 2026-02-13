import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2 } from "lucide-react"

interface EditDeleteTableButtonsProps {
    onDelete: () => void;
    onEdit: () => void;
}

export function EditDeleteTableButtons({ onDelete, onEdit }: EditDeleteTableButtonsProps) {
    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-10"
                        onClick={onEdit}
                        aria-label="Edit"
                        data-testid="edit-button"
                    >
                        <Pencil />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Editar</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="size-10"
                        onClick={onDelete}
                        aria-label="Delete"
                        data-testid="delete-button"
                    >
                        <Trash2 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Eliminar</p>
                </TooltipContent>
            </Tooltip>
        </>
    );
}
