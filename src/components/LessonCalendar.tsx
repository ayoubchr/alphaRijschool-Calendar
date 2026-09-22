"use client";

import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: nl }),
  getDay,
  locales: { nl },
});

export interface Slot {
  startAt: string;
  endAt: string;
}

interface LessonCalendarProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
}

export function LessonCalendar({ slots, selectedSlot, onSelectSlot }: LessonCalendarProps) {
  const events: Event[] = slots.map((slot) => ({
    title: selectedSlot?.startAt === slot.startAt ? "Geselecteerd" : "Beschikbaar",
    start: new Date(slot.startAt),
    end: new Date(slot.endAt),
    resource: slot,
  }));

  const defaultDate = slots.length > 0 ? new Date(slots[0].startAt) : new Date();

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      views={["week", "day"]}
      defaultView="week"
      defaultDate={defaultDate}
      onSelectEvent={(event) => onSelectSlot(event.resource as Slot)}
    />
  );
}
