import { CalendarEvent } from "@/types/CalendarEvent";
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Calendar, XCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarEventWrapperProps {
  event: {
    title: string;
    resource?: CalendarEvent;
  };
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onViewDetails?: (event: CalendarEvent) => void;
  onApproveRequest?: (event: CalendarEvent) => void;
  onRejectRequest?: (event: CalendarEvent) => void;
  onReviewRequest?: (event: CalendarEvent) => void;
  onDeleteRequest?: (event: CalendarEvent) => void;
}

export function CalendarEventWrapper({
  event,
  onEdit,
  onDelete,
  onViewDetails,
  onApproveRequest,
  onRejectRequest,
  onReviewRequest,
  onDeleteRequest,
}: CalendarEventWrapperProps) {
  const { user } = useAuth();
  const calendarEvent = event.resource;
  const isAdmin = user?.role === 'ADMIN';
  const isProfessor = user?.role === 'PROFESSOR';
  const isPendingRequest = calendarEvent?.isPending === true;

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

  const handleViewDetails = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onViewDetails?.(calendarEvent);
  };

  const handleApproveRequest = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onApproveRequest?.(calendarEvent);
  };

  const handleRejectRequest = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onRejectRequest?.(calendarEvent);
  };

  const handleReviewRequest = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onReviewRequest?.(calendarEvent);
  };

  const handleDeleteRequest = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDeleteRequest?.(calendarEvent);
  };

  // Renderizar contenido del evento sin menú contextual para non-admin o en solicitudes pendientes para professor
  const renderEventContent = () => {
    // Extraer el grupo y la hora del título (formato esperado: "Grupo - HH:MM")
    const titleParts = event.title.split(' - ');
    const groupStr = titleParts[0]; // "AL.T.1"
    const timeStr = titleParts.length > 1 ? titleParts[1] : '';

    return (
      <div className="h-full w-full px-1 py-1 flex flex-col gap-0.5">
        <div className="text-xs font-semibold leading-tight">{groupStr}</div>
        <div className="text-[11px] leading-tight font-medium opacity-95">
          {timeStr}
          {calendarEvent.classrooms.length > 0 && (
            <> · {calendarEvent.classrooms.map(c => c.code).join(', ')}</>
          )}
        </div>
      </div>
    );
  };

  // Si no es ADMIN ni PROFESSOR, mostrar solo el contenido sin menú contextual
  if (!isAdmin && !isProfessor) {
    return renderEventContent();
  }

  // Si es una solicitud pendiente y el usuario es ADMIN
  if (isPendingRequest && isAdmin) {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full cursor-pointer">
          {renderEventContent()}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleViewDetails}>
            <Calendar />
            Ver detalles
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleApproveRequest}>
            <CheckCircle className="text-green-600" />
            Aprobar solicitud
          </ContextMenuItem>

          <ContextMenuItem onClick={handleReviewRequest}>
            <Edit />
            Revisar solicitud
          </ContextMenuItem>

          <ContextMenuItem variant="destructive" onClick={handleRejectRequest}>
            <XCircle className="text-red-600" />
            Rechazar solicitud
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Si es una solicitud pendiente y el usuario es PROFESSOR
  if (isPendingRequest && isProfessor) {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full cursor-pointer">
          {renderEventContent()}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleViewDetails}>
            <Calendar />
            Ver detalles
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem variant="destructive" onClick={handleDeleteRequest}>
            <Trash2 />
            Eliminar solicitud
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Si es un evento regular y el usuario es ADMIN
  if (isAdmin && !isPendingRequest) {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full cursor-pointer">
          {renderEventContent()}
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

          <ContextMenuSeparator />

          <ContextMenuItem variant="destructive" onClick={handleDelete}>
            <Trash2 />
            Eliminar evento
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Para otros casos (PROFESSOR con evento regular, etc)
  return renderEventContent();
}
