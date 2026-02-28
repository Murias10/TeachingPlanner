import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FileError {
    fileName: string;
    message: string;
    errors: string[];
}

interface ImportErrorDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly fileErrors: readonly FileError[];
}

export function ImportErrorDialog({
    open,
    onOpenChange,
    fileErrors,
}: ImportErrorDialogProps) {
    const { t } = useTranslation();
    const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

    const toggleDetails = (fileName: string) => {
        setOpenDetails(prev => ({ ...prev, [fileName]: !prev[fileName] }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col" aria-describedby="import-error-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        {t("calendar.import.errors.dialog.title")}
                    </DialogTitle>
                    <DialogDescription id="import-error-description">
                        {t("calendar.import.errors.dialog.subtitle", { count: fileErrors.length })}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {fileErrors.map((fileError) => (
                        <div key={fileError.fileName} className="space-y-2">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="font-semibold">
                                    {fileError.fileName}
                                </AlertTitle>
                                <AlertDescription className="mt-1">
                                    {fileError.message}
                                </AlertDescription>
                            </Alert>

                            {fileError.errors && fileError.errors.length > 0 && (
                                <Collapsible
                                    open={openDetails[fileError.fileName] ?? false}
                                    onOpenChange={() => toggleDetails(fileError.fileName)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-between"
                                        >
                                            <span className="text-xs">
                                                {t("calendar.import.errors.details.toggle")} ({fileError.errors.length} {t("calendar.import.errors.details.count", { count: fileError.errors.length })})
                                            </span>
                                            {openDetails[fileError.fileName] ? (
                                                <ChevronUp className="h-3 w-3" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2">
                                        <ScrollArea className="h-[250px] w-full rounded-md border bg-muted/30 p-3">
                                            <div className="space-y-1.5">
                                                {fileError.errors.map((error) => (
                                                    <div
                                                        key={`${fileError.fileName}-${error}`}
                                                        className="text-xs font-mono text-muted-foreground border-b border-border/50 pb-1.5 last:border-b-0"
                                                    >
                                                        {error}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </div>
                    ))}

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                            💡 {t("calendar.import.errors.suggestions.title")}
                        </p>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                            <li>{t("calendar.import.errors.suggestions.checkDates")}</li>
                            <li>{t("calendar.import.errors.suggestions.verifyCourse")}</li>
                            <li>{t("calendar.import.errors.suggestions.reviewFormat")}</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        {t("common.close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
