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
import { useTranslation } from "react-i18next";

interface EventRequest {
    id: string;
    professorId: string;
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
}: Readonly<AprobacionEventoModalProps>) {
    const { t } = useTranslation();
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
                        {action === "approve"
                            ? t("requests.dialog.approve.title")
                            : t("requests.dialog.reject.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {action === "approve"
                            ? t("aprobacionModal.approveDescription")
                            : t("aprobacionModal.rejectDescription")}
                    </DialogDescription>
                </DialogHeader>

                {action === null && (
                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p><strong>{t("requests.dialog.approve.professor")}:</strong> {request.professorId}</p>
                            <p><strong>{t("requests.dialog.approve.eventType")}:</strong> {request.eventType === "PUNTUAL" ? t("requests.dialog.approve.eventType.punctual") : t("requests.dialog.approve.eventType.periodic")}</p>
                            <p><strong>{t("aprobacionModal.schedule")}:</strong> {request.eventData.startTime} - {request.eventData.endTime}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => setAction("approve")}
                            >
                                {t("requests.dialog.approve.approve")}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => setAction("reject")}
                            >
                                {t("requests.dialog.reject.reject")}
                            </Button>
                        </div>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            {t("common.cancel")}
                        </Button>
                    </div>
                )}

                {action === "approve" && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                            {t("aprobacionModal.approveInfo")}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={handleApprove}
                                disabled={loading}
                            >
                                {loading ? t("aprobacionModal.processing") : t("aprobacionModal.confirmApprove")}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setAction(null)}
                                disabled={loading}
                            >
                                {t("aprobacionModal.back")}
                            </Button>
                        </div>
                    </div>
                )}

                {action === "reject" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-comments">{t("requests.dialog.approve.commentLabel")}</Label>
                            <Textarea
                                id="reject-comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={t("requests.dialog.reject.commentsPlaceholder")}
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
                                {loading ? t("aprobacionModal.processing") : t("aprobacionModal.confirmReject")}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setAction(null)}
                                disabled={loading}
                            >
                                {t("aprobacionModal.back")}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
