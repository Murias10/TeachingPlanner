import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { AprobacionEventoModal } from "./AprobacionEventoModal";

interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: string;
    status: string;
    createdAt: string;
    eventData: any;
}

interface SolicitudesPendientesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    solicitudes: EventRequest[];
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, comments: string) => Promise<void>;
    loading?: boolean;
}

export function SolicitudesPendientesModal({
    open,
    onOpenChange,
    solicitudes,
    onApprove,
    onReject,
    loading = false
}: SolicitudesPendientesModalProps) {
    const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);

    const handleApproveClick = (request: EventRequest) => {
        setSelectedRequest(request);
        setApprovalModalOpen(true);
    };

    const handleRejectClick = (request: EventRequest) => {
        setSelectedRequest(request);
        setApprovalModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="default">Pendiente</Badge>;
            case "APPROVED":
                return <Badge variant="default" className="bg-green-600">Aprobado</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Rechazado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Solicitudes de Eventos Pendientes</DialogTitle>
                    </DialogHeader>

                    {solicitudes.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            No hay solicitudes pendientes
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Profesor</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Fecha Solicitud</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {solicitudes.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="text-sm">{request.professorId}</TableCell>
                                        <TableCell className="text-sm">
                                            {request.eventType === "PUNTUAL" ? "Puntual" : "Periódico"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(request.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {request.eventData.startTime} - {request.eventData.endTime}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(request.status)}
                                        </TableCell>
                                        <TableCell className="text-sm flex gap-2">
                                            {request.status === "PENDING" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleApproveClick(request)}
                                                        disabled={loading}
                                                    >
                                                        Aprobar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRejectClick(request)}
                                                        disabled={loading}
                                                    >
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <div className="mt-4 flex justify-end">
                        <DialogClose asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedRequest && (
                <AprobacionEventoModal
                    open={approvalModalOpen}
                    onOpenChange={setApprovalModalOpen}
                    request={selectedRequest}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            )}
        </>
    );
}
