import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, CirclePlus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CalendarToolbarProps {
  onExport?: () => void;
  onCreateEvent?: () => void;
  onImportExceptions?: () => void;
  isAdmin?: boolean;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  onExport,
  onCreateEvent,
  onImportExceptions,
  isAdmin = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 items-center justify-end">
        {/* Create Event Button - Primary action first */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={onCreateEvent}
              className="h-9 gap-2"
            >
              <CirclePlus className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t('calendar.toolbar.createEvent')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('calendar.toolbar.createEventTooltip')}</TooltipContent>
        </Tooltip>

        {/* Import Exceptions Button - Only for ADMIN */}
        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportExceptions}
                className="h-9 gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{t('calendar.toolbar.importExceptions')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('calendar.toolbar.importExceptionsTooltip')}</TooltipContent>
          </Tooltip>
        )}

        {/* Export TXT Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-9 gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t('calendar.toolbar.exportTxt')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('calendar.toolbar.exportTxtTooltip')}</TooltipContent>
        </Tooltip>
    </div>
  );
};

export default CalendarToolbar;
