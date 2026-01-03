import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
    onImport: (file: File) => Promise<void>;
    isLoading: boolean;
}

export const ImportExceptionsDialog = ({
    open,
    onOpenChange,
    onImport,
    isLoading
}: ImportExceptionsDialogProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Reset form when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !isLoading) {
            setUploadedFile(null);
            setIsDragOver(false);
        }
        onOpenChange(newOpen);
    };

    // File upload handlers
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.name === 'excepciones.txt'
        );

        if (files.length > 0) {
            setUploadedFile(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.name === 'excepciones.txt') {
                setUploadedFile(file);
            }
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
    };

    const handleImport = async () => {
        if (!uploadedFile) return;

        await onImport(uploadedFile);

        // Reset and close only if no error occurred
        if (!isLoading) {
            setUploadedFile(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar excepciones</DialogTitle>
                    <DialogDescription>
                        Importa el archivo excepciones.txt para reemplazar todos los eventos puntuales del calendario.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning notice */}
                    <div className="flex items-start gap-2 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-yellow-900">
                                Advertencia
                            </p>
                            <p className="text-xs text-yellow-800">
                                Esta acción eliminará todos los eventos puntuales existentes y los reemplazará con los del archivo.
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
                        <input
                            type="file"
                            accept=".txt"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isLoading || !!uploadedFile}
                        />

                        {!uploadedFile ? (
                            <div className="space-y-2">
                                <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        Arrastra excepciones.txt aquí
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        o haz clic para seleccionar
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
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                >
                                    <X className="h-4 w-4" />
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
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!uploadedFile || isLoading}
                    >
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
