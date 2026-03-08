import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface ImportExceptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (file: File, mode: 'add' | 'replace') => Promise<void>;
    isLoading: boolean;
}

export const ImportExceptionsDialog = ({
    open,
    onOpenChange,
    onImport,
    isLoading
}: ImportExceptionsDialogProps) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [mode, setMode] = useState<'add' | 'replace'>('replace');

    // Reset form when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !isLoading) {
            setUploadedFile(null);
            setIsDragOver(false);
            setMode('replace');
        }
        onOpenChange(newOpen);
    };

    // File upload handlers
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.name.endsWith('.txt')
        );

        if (files.length > 0) {
            setUploadedFile(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.name.endsWith('.txt')) {
                setUploadedFile(file);
            }
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = async () => {
        if (!uploadedFile) return;

        await onImport(uploadedFile, mode);

        // Reset and close only if no error occurred
        if (!isLoading) {
            setUploadedFile(null);
            setMode('replace');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('calendar.alerts.importExceptions.title')}</DialogTitle>
                    <DialogDescription>
                        {t('calendar.alerts.importExceptions.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Import Mode Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">
                            {t('calendar.alerts.importExceptions.mode.label')}
                        </Label>
                        <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'add' | 'replace')}>
                            <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="add" id="mode-add" className="mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="mode-add" className="text-sm font-medium cursor-pointer">
                                        {t('calendar.alerts.importExceptions.mode.add')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t('calendar.alerts.importExceptions.mode.addDescription')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="replace" id="mode-replace" className="mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="mode-replace" className="text-sm font-medium cursor-pointer">
                                        {t('calendar.alerts.importExceptions.mode.replace')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t('calendar.alerts.importExceptions.mode.replaceDescription')}
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Warning notice */}
                    <div className="flex items-start gap-2 p-3 border bg-amber-50/80 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-700/40 rounded-md">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                                {t('calendar.alerts.importExceptions.warning.title')}
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-400/90">
                                {mode === 'replace'
                                    ? t('calendar.alerts.importExceptions.warning.replace')
                                    : t('calendar.alerts.importExceptions.warning.add')
                                }
                            </p>
                        </div>
                    </div>

                    {/* Drop area */}
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                            isDragOver
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/30 hover:border-primary/50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                    >
                        {!uploadedFile && (
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isLoading}
                            />
                        )}

                        {!uploadedFile ? (
                            <div className="space-y-2">
                                <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {t('calendar.alerts.importExceptions.dropzone.title')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('calendar.alerts.importExceptions.dropzone.subtitle')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-3 rounded-md border bg-green-50 border-green-200">
                                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-green-900 leading-tight">
                                        {uploadedFile.name}
                                    </p>
                                    <p className="text-xs text-green-700 leading-tight">
                                        {(uploadedFile.size / 1024).toFixed(1)}KB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={removeFile}
                                    disabled={isLoading}
                                    className="h-6 w-6 p-0 hover:bg-green-100"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t('calendar.alerts.importExceptions.cancel')}
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!uploadedFile || isLoading}
                    >
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        {t('calendar.alerts.importExceptions.import')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
