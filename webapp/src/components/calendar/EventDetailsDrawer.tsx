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
import moment from "moment";
import { useTranslation } from "react-i18next";

interface EventDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: CalendarEvent;
}

export function EventDetailsDrawer({ open, onOpenChange, event }: EventDetailsDrawerProps) {
    const { t } = useTranslation();

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
                            <Label htmlFor="event-subject">{t('calendar.eventDetails.fields.subject')}</Label>
                            <Input
                                id="event-subject"
                                value={`${event.subject.name} (${event.subject.acronym})`}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Fecha y Horario en una fila */}
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                            <Label htmlFor="event-date">{t('calendar.eventDetails.fields.date')}</Label>
                            <Input
                                id="event-date"
                                value={moment(event.date).format('DD/MM/YYYY')}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-time">{t('calendar.eventDetails.fields.time')}</Label>
                            <Input
                                id="event-time"
                                value={`${event.startTime} - ${event.endTime}`}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    {/* Tipo, Frecuencia y Estado en una fila */}
                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                            <Label htmlFor="event-type">{t('calendar.eventDetails.fields.type')}</Label>
                            <Input
                                id="event-type"
                                value={eventTypeLabel}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-frequency">{t('calendar.eventDetails.fields.frequency')}</Label>
                            <Input
                                id="event-frequency"
                                value={getFrequencyLabel()}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-status">{t('calendar.eventDetails.fields.status')}</Label>
                            <Input
                                id="event-status"
                                value={event.cancelled
                                    ? t('calendar.eventDetails.status.cancelled')
                                    : t('calendar.eventDetails.status.active')
                                }
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    {/* Grupo e Idioma en una fila */}
                    {event.groups.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                            <div className="space-y-2">
                                <Label htmlFor="event-group">{t('calendar.eventDetails.fields.group')}</Label>
                                <Input
                                    id="event-group"
                                    value={event.groups.map(group => {
                                        const lang = group.language === 'EN' ? 'I-' : '';
                                        return `${group.type}.${lang}${group.number}`;
                                    }).join(', ')}
                                    disabled={true}
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="event-language">{t('calendar.eventDetails.fields.language')}</Label>
                                <Input
                                    id="event-language"
                                    value={Array.from(new Set(event.groups.map(g => g.language))).map(lang =>
                                        lang === 'ES'
                                            ? t('calendar.eventDetails.languages.spanish')
                                            : t('calendar.eventDetails.languages.english')
                                    ).join(', ')}
                                    disabled={true}
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                    )}

                    {/* Aula */}
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="event-classroom">{t('calendar.eventDetails.fields.classroom')}</Label>
                        <Input
                            id="event-classroom"
                            value={event.classrooms.length > 0
                                ? event.classrooms.map(c => c.code).join(', ')
                                : t('calendar.eventDetails.fields.noClassroom')
                            }
                            disabled={true}
                            className="bg-muted"
                        />
                    </div>

                    {/* Carácter del día */}
                    {event.dayCharacter && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-day-character">{t('calendar.eventDetails.fields.dayCharacter')}</Label>
                            <Input
                                id="event-day-character"
                                value={event.dayCharacter}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Carácter del evento (solo para eventos periódicos) */}
                    {event.type === 'periodic' && event.eventCharacter && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-character">{t('calendar.eventDetails.fields.eventCharacter')}</Label>
                            <Input
                                id="event-character"
                                value={event.eventCharacter}
                                disabled={true}
                                className="bg-muted"
                            />
                        </div>
                    )}

                    {/* Comentario del día */}
                    {event.dayComment && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-day-comment">{t('calendar.eventDetails.fields.dayComment')}</Label>
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
                            <Label htmlFor="event-comment">{t('calendar.eventDetails.fields.eventComment')}</Label>
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
                            {t('calendar.eventDetails.close')}
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
