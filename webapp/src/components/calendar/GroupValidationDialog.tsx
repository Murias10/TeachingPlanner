import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { GroupValidationResult } from "@/types/Calendar";

interface GroupValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    validationResult: GroupValidationResult | null;
}

export const GroupValidationDialog = ({
    open,
    onOpenChange,
    validationResult,
}: GroupValidationDialogProps) => {
    const { t } = useTranslation();

    if (!validationResult) return null;

    const { statistics, groupsNotFound, groupsAutoCreated } = validationResult;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {t("calendar.groupValidation.title")}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("calendar.groupValidation.subtitle")}
                    </p>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.groupValidation.stats.total")}
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {statistics.totalRows}
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.groupValidation.stats.created")}
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {statistics.eventsCreated}
                            </p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.groupValidation.stats.skipped")}
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {statistics.eventsSkipped}
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.groupValidation.stats.errors")}
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {statistics.groupsNotFoundCount}
                            </p>
                        </div>
                    </div>

                    {/* Errors Section */}
                    {groupsNotFound.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {t("calendar.groupValidation.errors.title", {
                                        count: groupsNotFound.length,
                                    })}
                                </h4>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    {t("calendar.groupValidation.errors.description")}
                                </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t("calendar.groupValidation.errors.row")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.errors.group")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.errors.maxAllowed")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.errors.source")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.errors.error")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupsNotFound.map((error, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{error.row}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {error.groupKey}
                                                </TableCell>
                                                <TableCell>{error.maxAllowed}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {error.source}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive" className="text-xs">
                                                        {error.error.message}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Warnings Section */}
                    {groupsAutoCreated.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 p-3">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("calendar.groupValidation.warnings.title", {
                                        count: groupsAutoCreated.length,
                                    })}
                                </h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    {t("calendar.groupValidation.warnings.description")}
                                </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t("calendar.groupValidation.warnings.row")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.warnings.group")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.groupValidation.warnings.message")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupsAutoCreated.map((warning, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{warning.row}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {warning.groupKey}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                                    >
                                                        {warning.warning.message}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {groupsNotFound.length === 0 && groupsAutoCreated.length === 0 && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-6 text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                {t("calendar.groupValidation.success.title")}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {t("calendar.groupValidation.success.description", {
                                    count: statistics.eventsCreated,
                                })}
                            </p>
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>
                            {t("common.close")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
