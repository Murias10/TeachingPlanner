import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, CirclePlus, FileSpreadsheet, Upload } from 'lucide-react';

interface CalendarToolbarProps {
  onExport?: () => void;
  onExportCSV?: () => void;
  onCreateEvent?: () => void;
  onImportExceptions?: () => void;
  isAdmin?: boolean;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  onExport,
  onExportCSV,
  onCreateEvent,
  onImportExceptions,
  isAdmin = false,
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
              <CirclePlus className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Crear evento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crear nuevo evento</TooltipContent>
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
                <span className="hidden sm:inline text-xs">Importar excepciones</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar excepciones.txt para reemplazar eventos puntuales</TooltipContent>
          </Tooltip>
        )}

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
