import { EditDeleteTableButtons } from "@/components/common/EditDeleteTableButtons"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
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
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSendActivation}
                                aria-label="Reenviar email de activación"
                            >
                                <Mail className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Reenviar email de activación</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <EditDeleteTableButtons onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
