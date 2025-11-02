import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarEvent } from "@/types/CalendarEvent";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

interface EventDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: CalendarEvent;
}

export function EventDetailsDrawer({ open, onOpenChange, event }: EventDetailsDrawerProps) {
    if (!event) return null;

    const eventTypeLabel = event.type === 'periodic' ? 'Evento Periódico' : 'Evento Puntual';
    const eventTypeVariant = event.type === 'periodic' ? 'default' : 'secondary';

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>Detalles del Evento</DrawerTitle>
                    <DrawerDescription>
                        Información del evento seleccionado
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Tipo de evento y estado */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Tipo de Evento</Label>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant={eventTypeVariant}>
                                {eventTypeLabel}
                            </Badge>
                            {event.cancelled && (
                                <Badge variant="destructive">
                                    Cancelado
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Asignatura */}
                    {event.subject && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-subject">Asignatura</Label>
                            <Input
                                id="event-subject"
                                value={`${event.subject.name} (${event.subject.acronym})`}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Fecha */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="event-date">Fecha</Label>
                        <Input
                            id="event-date"
                            value={moment(event.date).format('DD/MM/YYYY')}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Horario */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="event-time">Horario</Label>
                        <Input
                            id="event-time"
                            value={`${event.startTime} - ${event.endTime} (${event.duration}h)`}
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Grupos */}
                    {event.groups.length > 0 && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label>Grupos</Label>
                            <div className="flex flex-wrap gap-2">
                                {event.groups.map((group, index) => {
                                    const lang = group.language === 'EN' ? 'I-' : '';
                                    return (
                                        <Badge key={index} variant="outline">
                                            {group.type}.{lang}{group.number}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Idiomas */}
                    {event.groups.length > 0 && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label>Idiomas</Label>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(event.groups.map(g => g.language))).map((language, index) => (
                                    <Badge key={index} variant="secondary">
                                        {language === 'ES' ? 'Español' : 'Inglés'}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aulas */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>Aulas</Label>
                        {event.classrooms.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {event.classrooms.map((classroom, index) => (
                                    <Badge key={index} variant="outline">
                                        {classroom.code}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin aula asignada</p>
                        )}
                    </div>

                    {/* Carácter del día */}
                    {event.dayCharacter && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-day-character">Carácter del Día</Label>
                            <Input
                                id="event-day-character"
                                value={event.dayCharacter}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Comentario del día */}
                    {event.dayComment && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-day-comment">Comentario del Día</Label>
                            <Input
                                id="event-day-comment"
                                value={event.dayComment}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Comentario del evento */}
                    {event.comment && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-comment">Comentario del Evento</Label>
                            <Input
                                id="event-comment"
                                value={event.comment}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}
                </div>

                {/* Botón de cerrar */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline">
                            Cerrar
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
