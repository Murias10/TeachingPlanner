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

interface ExceptionValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    validationResult: GroupValidationResult | null;
}

export const ExceptionValidationDialog = ({
    open,
    onOpenChange,
    validationResult,
}: ExceptionValidationDialogProps) => {
    const { t } = useTranslation();

    if (!validationResult) return null;

    const { statistics, groupsNotFound, groupsAutoCreated } = validationResult;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] min-w-[1200px] w-fit max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-xl font-semibold">
                        {t("calendar.exceptionValidation.title")}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("calendar.exceptionValidation.subtitle")}
                    </p>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.exceptionValidation.stats.total")}
                            </p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statistics.totalRows}
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.exceptionValidation.stats.created")}
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {statistics.eventsCreated}
                            </p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.exceptionValidation.stats.skipped")}
                            </p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {statistics.eventsSkipped}
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.exceptionValidation.stats.errors")}
                            </p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {statistics.groupsNotFoundCount}
                            </p>
                        </div>
                    </div>

                    {/* Errors Section */}
                    {groupsNotFound.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800/40 p-3">
                                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {t("calendar.exceptionValidation.errors.title", {
                                        count: groupsNotFound.length,
                                    })}
                                </h4>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    {t("calendar.exceptionValidation.errors.description")}
                                </p>
                            </div>
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">
                                                {t("calendar.exceptionValidation.errors.row")}
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                {t("calendar.exceptionValidation.errors.group")}
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                {t("calendar.exceptionValidation.errors.subject")}
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                {t("calendar.exceptionValidation.errors.error")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupsNotFound.map((error, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium whitespace-nowrap">{error.row}</TableCell>
                                                <TableCell className="font-mono text-sm whitespace-nowrap">
                                                    {error.groupKey}
                                                </TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {error.subjectAcronym}
                                                </TableCell>
                                                <TableCell className="text-sm text-red-600 dark:text-red-400 whitespace-nowrap">
                                                    {error.error.message}
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
                            <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800/40 p-3">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("calendar.exceptionValidation.warnings.title", {
                                        count: groupsAutoCreated.length,
                                    })}
                                </h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    {t("calendar.exceptionValidation.warnings.description")}
                                </p>
                            </div>
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t("calendar.exceptionValidation.warnings.row")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.exceptionValidation.warnings.group")}
                                            </TableHead>
                                            <TableHead>
                                                {t("calendar.exceptionValidation.warnings.message")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupsAutoCreated.map((warning, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{warning.row}</TableCell>
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
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-lg p-6 text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                {t("calendar.exceptionValidation.success.title")}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {t("calendar.exceptionValidation.success.description", {
                                    count: statistics.eventsCreated,
                                })}
                            </p>
                        </div>
                    )}

                </div>

                {/* Close Button - Fixed at bottom */}
                <div className="shrink-0 border-t pt-3 flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>
                        {t("common.close")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
