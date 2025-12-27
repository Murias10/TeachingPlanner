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

interface ReplaceEventConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventInfo?: {
    groupName: string;
    date: string;
    time: string;
  };
}

export function ReplaceEventConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  eventInfo
}: ReplaceEventConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reemplazar evento</AlertDialogTitle>
          <AlertDialogDescription>
            {eventInfo ? (
              <>
                Vas a reemplazar el evento del grupo <strong>{eventInfo.groupName}</strong> del{' '}
                <strong>{eventInfo.date}</strong> a las <strong>{eventInfo.time}</strong>.
                <br /><br />
                Esta acción creará un nuevo evento en la fecha y hora que elijas, y el evento original
                será marcado como cancelado.
                <br /><br />
                ¿Deseas continuar?
              </>
            ) : (
              <>
                Esta acción creará un nuevo evento en la fecha y hora que elijas, y el evento original
                será marcado como cancelado.
                <br /><br />
                ¿Deseas continuar?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
