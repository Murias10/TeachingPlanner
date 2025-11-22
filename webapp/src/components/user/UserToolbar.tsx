import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2 } from "lucide-react";

interface UserToolbarProps {
    deleteSelectedUsers?: () => void;
    selectedIds?: string[];
    onCreateClick?: () => void;
}

export function UserToolbar({ deleteSelectedUsers, selectedIds, onCreateClick }: UserToolbarProps) {

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={deleteSelectedUsers}
                            disabled={!selectedIds?.length}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <Trash2 className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                Eliminar seleccionados
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Eliminar seleccionados</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={onCreateClick}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <CirclePlus className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                Crear usuario
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Crear nuevo usuario</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}
