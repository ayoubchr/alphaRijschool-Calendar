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
  const events: Event[] = slots.map((slot) => {
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    const instructor = "instructorName" in slot ? String(slot.instructorName) : "";
    const label = `${format(start, "HH:mm", { locale: nl })}–${format(end, "HH:mm", { locale: nl })}`;
    return {
      title: instructor ? `${label} · ${instructor}` : label,
      start,
      end,
      resource: slot,
    };
  });

  const defaultDate =
    slots.length > 0
      ? new Date(Math.min(...slots.map((slot) => new Date(slot.startAt).getTime())))
      : new Date();

  return (
    <div className="booking-calendar overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-sm">
      <Calendar
        localizer={localizer}
        culture="nl"
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 620 }}
        views={["week", "day"]}
        defaultView="week"
        defaultDate={defaultDate}
        min={new Date(1970, 0, 1, 8, 0)}
        max={new Date(1970, 0, 1, 20, 0)}
        scrollToTime={new Date(1970, 0, 1, 8, 0)}
        messages={{
          week: "Week",
          day: "Dag",
          today: "Vandaag",
          previous: "Vorige",
          next: "Volgende",
          noEventsInRange: "Geen lessen in deze periode",
        }}
        eventPropGetter={(event) => {
          const slot = event.resource as Slot;
          const active = selectedSlot?.startAt === slot.startAt;
          return { className: active ? "is-selected" : "is-available" };
        }}
        onSelectEvent={(event) => onSelectSlot(event.resource as Slot)}
      />
    </div>
  );
}
