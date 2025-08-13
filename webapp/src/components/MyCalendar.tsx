import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface MyEvent {
    title: string;
    start: Date;
    end: Date;
}

const MyCalendar = () => {
    const events: MyEvent[] = [
        {
            title: "Evento de ejemplo",
            start: new Date(2025, 7, 12, 10, 0),
            end: new Date(2025, 7, 12, 12, 0),
        },
        {
            title: "Otro evento",
            start: new Date(2025, 7, 13, 14, 0),
            end: new Date(2025, 7, 13, 16, 0),
        },
    ];

    return (
        <div style={{ height: 500 }}>
            <Calendar
                localizer={localizer}  // Localizador obligatorio
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%", width: '100%' }}
            />
        </div>
    );
};

export default MyCalendar;
