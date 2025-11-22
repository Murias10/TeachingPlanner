import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface SolicitudEventoDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (calendarId: string, eventType: string, eventData: any) => Promise<void>;
    calendars: any[];
}

export function SolicitudEventoDrawer({
    open,
    onOpenChange,
    onSave,
    calendars
}: SolicitudEventoDrawerProps) {

    const [calendarId, setCalendarId] = useState("");
    const [eventType, setEventType] = useState("PUNTUAL");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [comment, setComment] = useState("");

    // Para PUNTUAL
    const [dayId, setDayId] = useState("");

    // Para PERIODIC
    const [weekDay, setWeekDay] = useState("0");
    const [eventCharacter, setEventCharacter] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!calendarId || !startTime || !endTime) {
            alert("Por favor completa los campos obligatorios");
            return;
        }

        if (eventType === "PUNTUAL" && !dayId) {
            alert("Para eventos puntuales, selecciona una fecha");
            return;
        }

        if (eventType === "PERIODIC" && !eventCharacter) {
            alert("Para eventos periódicos, selecciona el tipo de evento");
            return;
        }

        setLoading(true);
        try {
            const eventData = eventType === "PUNTUAL"
                ? { dayId, startTime, endTime, comment }
                : { startTime, endTime, weekDay: parseInt(weekDay), eventCharacter, comment };

            await onSave(calendarId, eventType, eventData);
            handleCancel();
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCalendarId("");
        setEventType("PUNTUAL");
        setStartTime("");
        setEndTime("");
        setComment("");
        setDayId("");
        setWeekDay("0");
        setEventCharacter("");
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>Solicitar Evento</DrawerTitle>
                    <DrawerDescription>
                        Completa los datos del evento que deseas crear
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="calendar-select">Calendario *</Label>
                        <Select value={calendarId} onValueChange={setCalendarId}>
                            <SelectTrigger id="calendar-select">
                                <SelectValue placeholder="Selecciona un calendario" />
                            </SelectTrigger>
                            <SelectContent>
                                {calendars.map((cal) => (
                                    <SelectItem key={cal.id} value={cal.id}>
                                        {cal.course?.name || `Calendario ${cal.id.substring(0, 8)}`} - Semestre {cal.semester}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="event-type">Tipo de Evento *</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                            <SelectTrigger id="event-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PUNTUAL">Evento Puntual</SelectItem>
                                <SelectItem value="PERIODIC">Evento Periódico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {eventType === "PUNTUAL" && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="day-id">Fecha del Evento *</Label>
                            <Input
                                id="day-id"
                                type="date"
                                value={dayId}
                                onChange={(e) => setDayId(e.target.value)}
                                placeholder="Selecciona una fecha"
                            />
                        </div>
                    )}

                    {eventType === "PERIODIC" && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="week-day">Día de la Semana *</Label>
                            <Select value={weekDay} onValueChange={setWeekDay}>
                                <SelectTrigger id="week-day">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Lunes</SelectItem>
                                    <SelectItem value="1">Martes</SelectItem>
                                    <SelectItem value="2">Miércoles</SelectItem>
                                    <SelectItem value="3">Jueves</SelectItem>
                                    <SelectItem value="4">Viernes</SelectItem>
                                    <SelectItem value="5">Sábado</SelectItem>
                                    <SelectItem value="6">Domingo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {eventType === "PERIODIC" && (
                        <div className="space-y-2 max-w-sm mx-auto w-full">
                            <Label htmlFor="event-char">Tipo de Evento *</Label>
                            <Select value={eventCharacter} onValueChange={setEventCharacter}>
                                <SelectTrigger id="event-char">
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEORIA">Teoría</SelectItem>
                                    <SelectItem value="PRACTICA">Práctica</SelectItem>
                                    <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                                    <SelectItem value="SEMINARIO">Seminario</SelectItem>
                                    <SelectItem value="TUTORIA">Tutoría</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="start-time">Hora Inicio *</Label>
                        <Input
                            id="start-time"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="end-time">Hora Fin *</Label>
                        <Input
                            id="end-time"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="comment">Comentarios</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Añade comentarios si es necesario"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" onClick={handleCancel}>
                            Cancelar
                        </Button>
                    </DrawerClose>
                    <Button
                        onClick={handleSave}
                        disabled={!calendarId || !startTime || !endTime || loading}
                    >
                        {loading ? "Enviando..." : "Solicitar"}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
