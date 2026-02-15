import { CalendarEvent } from "@/types/CalendarEvent";
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Calendar, XCircle, CheckCircle, Replace, Undo } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EVENT_CHARACTERS } from "@/constants/eventCharacters";

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
  onEditSeries?: (event: CalendarEvent) => void;
  onReplaceEvent?: (event: CalendarEvent) => void;
  onDeleteSeries?: (event: CalendarEvent) => void;
  onRevertCancellation?: (event: CalendarEvent) => void;
  onRequestEdit?: (event: CalendarEvent) => void;
  onRequestCancel?: (event: CalendarEvent) => void;
  onRequestReplace?: (event: CalendarEvent) => void;
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
  onEditSeries,
  onReplaceEvent,
  onDeleteSeries,
  onRevertCancellation,
  onRequestEdit,
  onRequestCancel,
  onRequestReplace,
}: CalendarEventWrapperProps) {
  const { user } = useAuth();
  const calendarEvent = event.resource;
  const isAdmin = user?.role === 'ADMIN';
  const isProfessor = user?.role === 'PROFESSOR';
  const isPendingRequest = calendarEvent?.isPending === true;
  const isPeriodicEvent = calendarEvent?.type === 'periodic';
  const isCancelled = calendarEvent?.cancelled === true;

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

  const handleEditSeries = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onEditSeries?.(calendarEvent);
  };

  const handleReplaceEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onReplaceEvent?.(calendarEvent);
  };

  const handleDeleteSeries = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDeleteSeries?.(calendarEvent);
  };

  const handleRevertCancellation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onRevertCancellation?.(calendarEvent);
  };

  const handleRequestEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onRequestEdit?.(calendarEvent);
  };

  const handleRequestCancel = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onRequestCancel?.(calendarEvent);
  };

  const handleRequestReplace = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onRequestReplace?.(calendarEvent);
  };

  // Renderizar contenido del evento sin menú contextual para non-admin o en solicitudes pendientes para professor
  const renderEventContent = () => {
    // Extraer el grupo y la hora del título (formato esperado: "EV · Grupo · HH:MM" o "Grupo · HH:MM")
    const titleParts = event.title.split(' · ');
    // La hora es siempre la última parte, el resto es el grupo (puede incluir prefijo como "EV")
    const timeStr = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';
    const groupStr = titleParts.length > 1 ? titleParts.slice(0, -1).join(' · ') : titleParts[0];

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

  // Si es un evento cancelado y el usuario es ADMIN
  if (isCancelled && isAdmin) {
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

          <ContextMenuItem onClick={handleRevertCancellation}>
            <Undo />
            Revertir cancelación
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
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
    // Menú para eventos periódicos
    if (isPeriodicEvent) {
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

            {/* Mostrar "Editar serie" para eventos periódicos (Normal, Par, Impar y personalizados) */}
            {/* Solo excluir eventos festivos (F). Los días lectivos no tienen carácter específico */}
            {calendarEvent.eventCharacter &&
             calendarEvent.eventCharacter !== EVENT_CHARACTERS.FESTIVO && (
              <ContextMenuItem onClick={handleEditSeries}>
                <Edit />
                Editar serie de eventos
              </ContextMenuItem>
            )}

            <ContextMenuItem onClick={handleReplaceEvent}>
              <Replace />
              Reemplazar evento
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 />
              Eliminar evento
            </ContextMenuItem>

            <ContextMenuItem variant="destructive" onClick={handleDeleteSeries}>
              <Trash2 />
              Eliminar serie de eventos
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    // Menú para eventos puntuales
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

  // Si es un evento regular y el usuario es PROFESSOR
  if (isProfessor && !isCancelled) {
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

          <ContextMenuItem onClick={handleRequestEdit}>
            <Edit />
            Solicitar editar
          </ContextMenuItem>

          <ContextMenuItem onClick={handleRequestReplace}>
            <Replace />
            Solicitar reemplazo
          </ContextMenuItem>

          <ContextMenuItem variant="destructive" onClick={handleRequestCancel}>
            <XCircle />
            Solicitar cancelar
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Fallback (otros casos)
  return renderEventContent();
}
