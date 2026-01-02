import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Plus, FileSpreadsheet } from 'lucide-react';

interface CalendarToolbarProps {
  onExport?: () => void;
  onExportCSV?: () => void;
  onCreateEvent?: () => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  onExport,
  onExportCSV,
  onCreateEvent,
}) => {

  return (
    <TooltipProvider>
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
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Crear evento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crear nuevo evento</TooltipContent>
        </Tooltip>

        {/* Export CSV Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="h-9 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Exportar .csv</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exportar eventos filtrados como CSV para Google Calendar</TooltipContent>
        </Tooltip>

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
              <span className="hidden sm:inline text-xs">Exportar .txt</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exportar calendario como archivos .txt</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default CalendarToolbar;
