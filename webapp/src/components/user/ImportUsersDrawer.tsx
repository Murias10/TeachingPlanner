import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";

interface ImportUsersDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
}

export const ImportUsersDrawer = ({ open, onOpenChange, onImportComplete }: ImportUsersDrawerProps) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any>(null);
    const [importResult, setImportResult] = useState<any>(null);
    const [sendEmail, setSendEmail] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            setValidationErrors(null);
            setImportResult(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setValidationErrors(null);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsImporting(true);
        setValidationErrors(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sendEmail', sendEmail.toString());

        try {
            const apiUrl = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8080/api';
            const response = await fetch(`${apiUrl}/user/import`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.status === 'success') {
                setImportResult(data.data);
                onImportComplete();
            } else {
                // Show validation errors if any
                if (data.data && data.data.invalidRows) {
                    setValidationErrors(data.data);
                } else {
                    alert(data.message || t("users.alerts.error.import"));
                }
            }
        } catch (error) {
            console.error('Error importing users:', error);
            alert(t("users.alerts.error.import"));
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setValidationErrors(null);
        setImportResult(null);
        onOpenChange(false);
    };

    const downloadTemplate = () => {
        // Create Excel workbook with template data
        const templateData = [
            ['Usuario uniovi', 'NOMBRE', 'APELLIDOS', 'EMAIL'],
            ['jrpp', 'Juan Ramon', 'Perez Perez', 'jrpp@uniovi.es']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

        // Generate Excel file and download
        XLSX.writeFile(wb, 'plantilla_usuarios.xlsx');
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[90vh]">
                <DrawerHeader className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle className="text-xl font-semibold">{t("users.import.title")}</DrawerTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("users.import.description")}
                            </p>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" onClick={handleClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Template Download */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    {t("users.import.downloadTemplate")}
                                </h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    {t("users.import.downloadTemplateDescription")}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="mt-2 text-xs h-8"
                                >
                                    {t("users.import.downloadTemplate")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    {!file && (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
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
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-2">
                                {t("users.import.dropzone.title")}
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                {t("users.import.dropzone.formats")}
                            </p>
                            <Button variant="outline" size="sm" asChild>
                                <label className="cursor-pointer">
                                    {t("users.import.dropzone.title")}
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </Button>
                        </div>
                    )}

                    {/* File Selected */}
                    {file && !validationErrors && !importResult && (
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFile(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="sendEmail"
                                            checked={sendEmail}
                                            onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                                            disabled={isImporting}
                                        />
                                        <Label
                                            htmlFor="sendEmail"
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {t("users.import.sendEmail")}
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-6">
                                        {t("users.import.sendEmailDescription")}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="w-full"
                                >
                                    {isImporting && <Spinner className="mr-2" />}
                                    {t("users.import.import")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Validation Errors/Warnings */}
                    {validationErrors && !importResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold text-blue-600">{validationErrors.totalRows}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">Válidos</p>
                                    <p className="text-2xl font-bold text-green-600">{validationErrors.validRows.length}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">Avisos</p>
                                    <p className="text-2xl font-bold text-yellow-600">{validationErrors.warningRows?.length || 0}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">Errores</p>
                                    <p className="text-2xl font-bold text-red-600">{validationErrors.invalidRows.length}</p>
                                </div>
                            </div>

                            {validationErrors.invalidRows.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("users.import.validationErrors")} ({validationErrors.invalidRows.length})
                                        </h4>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                            {t("users.import.validationErrorsDescription")}
                                        </p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t("users.import.row")}</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>{t("users.import.error")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {validationErrors.invalidRows.map((invalid: any) => (
                                                    <TableRow key={invalid.row}>
                                                        <TableCell>{invalid.row}</TableCell>
                                                        <TableCell>{invalid.data.email || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {invalid.errors.map((err: any, idx: number) => (
                                                                <Badge key={idx} variant="destructive" className="mr-1 text-xs">
                                                                    {err.field}: {err.message}
                                                                </Badge>
                                                            ))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {validationErrors.warningRows && validationErrors.warningRows.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 p-3">
                                        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("users.import.completed.warning")} ({validationErrors.warningRows.length})
                                        </h4>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            {t("users.import.completed.warnings")}
                                        </p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t("users.import.row")}</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>{t("users.import.completed.warning")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {validationErrors.warningRows.map((warning: any) => (
                                                    <TableRow key={warning.row}>
                                                        <TableCell>{warning.row}</TableCell>
                                                        <TableCell>{warning.data.email || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {warning.warnings.map((warn: any, idx: number) => (
                                                                <Badge key={idx} variant="secondary" className="mr-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                                                    {warn.field}: {warn.message}
                                                                </Badge>
                                                            ))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        setFile(null);
                                        setValidationErrors(null);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {t("users.import.cancel")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Import Results */}
                    {importResult && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-6 text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                {t("users.import.completed.title")}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {t("users.import.completed.created", { count: importResult.createdCount })}
                            </p>
                            {importResult.skippedCount > 0 && (
                                <p className="text-sm text-yellow-600 mt-2">
                                    {t("users.import.completed.warnings", { count: importResult.skippedCount })}
                                </p>
                            )}
                            {importResult.errorCount > 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                    {importResult.errorCount} {t("users.import.error")}
                                </p>
                            )}
                            <Button onClick={handleClose} className="mt-4">
                                {t("users.import.close")}
                            </Button>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
