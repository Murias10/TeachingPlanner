import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarEvent } from "@/types/CalendarEvent";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface EventDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: CalendarEvent;
}

export function EventDetailsDrawer({ open, onOpenChange, event }: EventDetailsDrawerProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    if (!event) return null;

    // DEBUG: Log para verificar qué llega en el evento
    if (event.type === 'periodic') {
        console.log('EventDetailsDrawer - Evento periódico:', {
            eventCharacter: event.eventCharacter,
            dayCharacter: event.dayCharacter,
            fullEvent: event
        });
    }

    const eventTypeLabel = event.type === 'periodic'
        ? t('calendar.eventDetails.types.periodic')
        : t('calendar.eventDetails.types.puntual');

    // Función para determinar la frecuencia basándose en el tipo y carácter del evento
    const getFrequencyLabel = (): string => {
        if (event.type === 'puntual') {
            return t('calendar.eventDetails.frequencies.noRepeat');
        }

        // Es periódico
        if (event.eventCharacter === 'N') {
            return t('calendar.eventDetails.frequencies.weekly');
        } else if (event.eventCharacter === 'P') {
            return t('calendar.eventDetails.frequencies.biweeklyEven');
        } else if (event.eventCharacter === 'I') {
            return t('calendar.eventDetails.frequencies.biweeklyOdd');
        } else if (event.eventCharacter) {
            return t('calendar.eventDetails.frequencies.custom');
        } else {
            // Fallback
            return t('calendar.eventDetails.frequencies.weekly');
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t('calendar.eventDetails.title')}</DrawerTitle>
                    <DrawerDescription>
                        {t('calendar.eventDetails.description')}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Asignatura */}
                    {event.subject && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label>{t('calendar.eventDetails.fields.subject')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                {event.subject.siesCode ? (
                                    <Link
                                        to={`https://www.uniovi.es/ast/estudia/grados/ingenieria/informaticasoftware/-/fof/asignatura/${event.subject.siesCode}`}
                                        target="_blank"
                                        className="text-blue-600 hover:underline truncate"
                                    >
                                        {event.subject.name} ({event.subject.acronym})
                                    </Link>
                                ) : (
                                    <span className="truncate">
                                        {event.subject.name} ({event.subject.acronym})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fecha y Horario en una fila */}
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                            <Label>{t('calendar.eventDetails.fields.date')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{moment(event.date).format('DD/MM/YYYY')}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('calendar.eventDetails.fields.time')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)} ({event.duration}h)</span>
                            </div>
                        </div>
                    </div>

                    {/* Tipo, Frecuencia y Estado en una fila */}
                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                            <Label>{t('calendar.eventDetails.fields.type')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{eventTypeLabel}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('calendar.eventDetails.fields.frequency')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{getFrequencyLabel()}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('calendar.eventDetails.fields.status')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">
                                    {event.cancelled
                                        ? t('calendar.eventDetails.status.cancelled')
                                        : t('calendar.eventDetails.status.active')
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Grupo e Idioma en una fila */}
                    {event.groups.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                            <div className="space-y-2">
                                <Label>{t('calendar.eventDetails.fields.group')}</Label>
                                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                    <span className="truncate">
                                        {event.groups.map(group => {
                                            const lang = group.language === 'EN' ? 'I-' : '';
                                            return `${group.type}.${lang}${group.number}`;
                                        }).join(', ')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('calendar.eventDetails.fields.language')}</Label>
                                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                    <span className="truncate">
                                        {Array.from(new Set(event.groups.map(g => g.language))).map(lang =>
                                            lang === 'ES'
                                                ? t('calendar.eventDetails.languages.spanish')
                                                : t('calendar.eventDetails.languages.english')
                                        ).join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Aula */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label>{t('calendar.eventDetails.fields.classroom')}</Label>
                        <div className="flex min-h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm gap-1 flex-wrap">
                            {event.classrooms.length > 0 ? (
                                event.classrooms.map((classroom, index) => (
                                    <span key={classroom.id} className="flex items-center gap-1">
                                        {index > 0 && <span className="text-muted-foreground select-none">,</span>}
                                        {classroom.gisUrl ? (
                                            <Link to={classroom.gisUrl} target="_blank"
                                                className="text-blue-600 hover:underline">
                                                {classroom.code}
                                            </Link>
                                        ) : (
                                            <span>{classroom.code}</span>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted-foreground">
                                    {t('calendar.eventDetails.fields.noClassroom')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Comentario del día */}
                    {event.dayComment && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label>{t('calendar.eventDetails.fields.dayComment')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{event.dayComment}</span>
                            </div>
                        </div>
                    )}

                    {/* Comentario del evento */}
                    {event.comment && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label>{t('calendar.eventDetails.fields.eventComment')}</Label>
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                <span className="truncate">{event.comment}</span>
                            </div>
                        </div>
                    )}

                    {/* Carácter del día y Carácter del evento — solo ADMIN */}
                    {isAdmin && (event.dayCharacter || (event.type === 'periodic' && event.eventCharacter)) && (
                        <div className="flex gap-2 max-w-sm mx-auto w-full">
                            {event.dayCharacter && (
                                <div className={`space-y-2 ${event.type === 'periodic' && event.eventCharacter ? 'w-1/2' : 'w-full'}`}>
                                    <Label>{t('calendar.eventDetails.fields.dayCharacter')}</Label>
                                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                        <span className="truncate">{event.dayCharacter}</span>
                                    </div>
                                </div>
                            )}
                            {event.type === 'periodic' && event.eventCharacter && (
                                <div className="space-y-2 w-1/2">
                                    <Label>{t('calendar.eventDetails.fields.eventCharacter')}</Label>
                                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm">
                                        <span className="truncate">{event.eventCharacter}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Botón de cerrar */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline">
                            {t('calendar.eventDetails.close')}
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
