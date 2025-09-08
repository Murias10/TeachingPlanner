import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "react-i18next"

interface ConflictData {
    relatedCourses?: number;
    relatedSubjects?: number;
}

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isDestructive?: boolean;
    conflictData?: ConflictData;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    isDestructive = true,
    conflictData
}: DeleteConfirmationDialogProps) {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const getDescription = () => {
        if (conflictData && (conflictData.relatedCourses || conflictData.relatedSubjects)) {
            return `Esta titulación tiene ${conflictData.relatedCourses || 0} cursos y ${conflictData.relatedSubjects || 0} asignaturas. ¿Deseas eliminar todo?`;
        }
        return description;
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {getDescription()}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t("dialog.button.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={isDestructive ? "bg-destructive hover:bg-destructive/90" : ""}
                    >
                        {t("dialog.button.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}