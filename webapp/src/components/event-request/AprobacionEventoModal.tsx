import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface EventRequest {
    id: string;
    teacherId: string;
    eventType: string;
    eventData: any;
}

interface AprobacionEventoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: EventRequest;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, comments: string) => Promise<void>;
}

export function AprobacionEventoModal({
    open,
    onOpenChange,
    request,
    onApprove,
    onReject,
}: AprobacionEventoModalProps) {
    const [action, setAction] = useState<"approve" | "reject" | null>(null);
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(request.id);
            resetForm();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            await onReject(request.id, comments);
            resetForm();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAction(null);
        setComments("");
    };

    const handleCancel = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {action === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
                    </DialogTitle>
                    <DialogDescription>
                        {action === "approve"
                            ? "¿Deseas aprobar esta solicitud de evento?"
                            : "¿Deseas rechazar esta solicitud? Puedes dejar comentarios."}
                    </DialogDescription>
                </DialogHeader>

                {action === null && (
                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p><strong>Profesor:</strong> {request.teacherId}</p>
                            <p><strong>Tipo:</strong> {request.eventType === "PUNTUAL" ? "Puntual" : "Periódico"}</p>
                            <p><strong>Hora:</strong> {request.eventData.startTime} - {request.eventData.endTime}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => setAction("approve")}
                            >
                                Aprobar
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => setAction("reject")}
                            >
                                Rechazar
                            </Button>
                        </div>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            Cancelar
                        </Button>
                    </div>
                )}

                {action === "approve" && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                            Se creará el evento cuando apruebes
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={handleApprove}
                                disabled={loading}
                            >
                                {loading ? "Procesando..." : "Confirmar Aprobación"}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setAction(null)}
                                disabled={loading}
                            >
                                Volver
                            </Button>
                        </div>
                    </div>
                )}

                {action === "reject" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-comments">Comentarios (opcional)</Label>
                            <Textarea
                                id="reject-comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Explica brevemente por qué rechazas la solicitud..."
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={handleReject}
                                disabled={loading}
                            >
                                {loading ? "Procesando..." : "Confirmar Rechazo"}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setAction(null)}
                                disabled={loading}
                            >
                                Volver
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
