import { EditDeleteTableButtons } from "@/components/common/EditDeleteTableButtons"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Mail } from "lucide-react"

interface UserTableButtonsProps {
    onDelete: () => void;
    onEdit: () => void;
    onSendActivation?: () => void;
}

export function UserTableButtons({ onDelete, onEdit, onSendActivation }: UserTableButtonsProps) {
    return (
        <div className="flex items-center gap-2">
            {onSendActivation && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-10"
                            onClick={onSendActivation}
                            aria-label="Reenviar email de activación"
                        >
                            <Mail />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Reenviar email de activación</p>
                    </TooltipContent>
                </Tooltip>
            )}
            <EditDeleteTableButtons onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
