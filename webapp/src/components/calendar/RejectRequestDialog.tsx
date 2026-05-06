"use client"

import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RejectRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReject: (comments: string) => void;
    isSubmitting: boolean;
}

const RejectRequestDialog: React.FC<RejectRequestDialogProps> = ({
    open,
    onOpenChange,
    onReject,
    isSubmitting
}) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<string>('');

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setComments('');
        }
    }, [open]);

    const handleReject = () => {
        onReject(comments);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                            <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <DialogTitle className="text-lg font-semibold">{t("requests.dialog.reject.title")}</DialogTitle>
                    </div>
                    <DialogDescription className="hidden">
                        {t("requests.dialog.reject.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-6 py-3">
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {t("requests.dialog.reject.confirmMessage")}
                        </p>

                        <div className="space-y-1">
                            <Label htmlFor="reject-comments" className="text-xs font-semibold">
                                {t("requests.dialog.reject.commentsLabel")}
                            </Label>
                            <Textarea
                                id="reject-comments"
                                placeholder={t("requests.dialog.reject.commentsPlaceholder")}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="min-h-24 text-xs resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("requests.dialog.reject.commentsHint")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="h-8 text-xs"
                    >
                        {t("requests.dialog.reject.cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="h-8 text-xs"
                    >
                        {isSubmitting ? t("requests.dialog.reject.rejecting") : t("requests.dialog.reject.reject")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RejectRequestDialog;
