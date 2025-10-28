import { CalendarEvent } from "@/types/CalendarEvent";
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Copy, Calendar, XCircle, CheckCircle } from "lucide-react";

interface CalendarEventWrapperProps {
  event: {
    title: string;
    resource?: CalendarEvent;
  };
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onViewDetails?: (event: CalendarEvent) => void;
  onToggleCancellation?: (event: CalendarEvent) => void;
}

export function CalendarEventWrapper({
  event,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onToggleCancellation,
}: CalendarEventWrapperProps) {
  const calendarEvent = event.resource;

  if (!calendarEvent) {
    return <div className="h-full w-full">{event.title}</div>;
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onEdit?.(calendarEvent);
  };

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDelete?.(calendarEvent);
  };

  const handleDuplicate = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDuplicate?.(calendarEvent);
  };

  const handleViewDetails = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onViewDetails?.(calendarEvent);
  };

  const handleToggleCancellation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onToggleCancellation?.(calendarEvent);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="h-full w-full cursor-pointer">
        <div className="h-full w-full px-1 py-0.5">
          <div className="text-xs font-medium">{event.title}</div>
          {calendarEvent.classrooms.length > 0 && (
            <div className="text-xs opacity-90">
              {calendarEvent.classrooms.map(c => c.code).join(', ')}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleViewDetails}>
          <Calendar />
          Ver detalles
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleEdit}>
          <Edit />
          Editar evento
        </ContextMenuItem>

        <ContextMenuItem onClick={handleDuplicate}>
          <Copy />
          Duplicar evento
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleToggleCancellation}>
          {calendarEvent.cancelled ? (
            <>
              <CheckCircle />
              Reactivar evento
            </>
          ) : (
            <>
              <XCircle />
              Cancelar evento
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 />
          Eliminar evento
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
