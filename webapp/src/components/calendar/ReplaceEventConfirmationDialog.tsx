import { useTranslation } from "react-i18next"
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
}: Readonly<ReplaceEventConfirmationDialogProps>) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialog.replaceConfirmation.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {eventInfo ? (
              <>
                {t("dialog.replaceConfirmation.descriptionWithInfo", {
                  groupName: eventInfo.groupName,
                  date: eventInfo.date,
                  time: eventInfo.time,
                })}
                <br /><br />
                {t("dialog.replaceConfirmation.description")}
                <br /><br />
                {t("dialog.replaceConfirmation.confirm")}
              </>
            ) : (
              <>
                {t("dialog.replaceConfirmation.description")}
                <br /><br />
                {t("dialog.replaceConfirmation.confirm")}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t("dialog.replaceConfirmation.continue")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
