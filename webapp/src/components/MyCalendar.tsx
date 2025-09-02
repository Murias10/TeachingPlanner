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
            title: "HOLA",
            start: moment('2025-08-24T10:00:00').toDate(),
            end: moment('2025-08-24T11:00:00').toDate()
        },
        {
            title: "HOLA",
            start: moment('2025-08-24T12:00:00').toDate(),
            end: moment('2025-08-24T13:00:00').toDate()
        },
    ];

    return (

        <Calendar
            defaultView="week"
            localizer={localizer}
            events={events}
            max={moment('2025-08-30T21:00:00').toDate()}
            min={moment('2025-08-24T08:00:00').toDate()}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', width: '100%' }}
        />

    );
};

export default MyCalendar;
