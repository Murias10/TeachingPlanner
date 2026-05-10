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
import { useTranslation } from "react-i18next";
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
}: Readonly<SolicitudesPendientesModalProps>) {
    const { t, i18n } = useTranslation();
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
                return <Badge variant="default">{t("table.solicitudes.status.pending")}</Badge>;
            case "APPROVED":
                return <Badge variant="default" className="bg-green-600">{t("table.solicitudes.status.approved")}</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">{t("table.solicitudes.status.rejected")}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-GB');
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("solicitudesPendientes.title")}</DialogTitle>
                    </DialogHeader>

                    {solicitudes.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            {t("solicitudesPendientes.empty")}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("solicitudesPendientes.table.professor")}</TableHead>
                                    <TableHead>{t("solicitudesPendientes.table.type")}</TableHead>
                                    <TableHead>{t("solicitudesPendientes.table.requestDate")}</TableHead>
                                    <TableHead>{t("solicitudesPendientes.table.time")}</TableHead>
                                    <TableHead>{t("solicitudesPendientes.table.status")}</TableHead>
                                    <TableHead>{t("solicitudesPendientes.table.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {solicitudes.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="text-sm">{request.professorId}</TableCell>
                                        <TableCell className="text-sm">
                                            {request.eventType === "PUNTUAL"
                                                ? t("requests.dialog.approve.eventType.punctual")
                                                : t("requests.dialog.approve.eventType.periodic")}
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
                                                        {t("requests.dialog.approve.approve")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRejectClick(request)}
                                                        disabled={loading}
                                                    >
                                                        {t("requests.dialog.reject.reject")}
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
                            <Button variant="outline">{t("common.close")}</Button>
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
