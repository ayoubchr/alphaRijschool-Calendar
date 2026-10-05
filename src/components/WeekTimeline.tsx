"use client";

import { useState, type DragEvent } from "react";
import { brusselsDateKey } from "@/lib/brusselsWeek";

const BRUSSELS = "Europe/Brussels";
const DAY_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric" });
const QUARTER_PX = 24;

export type TimelineFree = {
  startAt: string;
  endAt: string;
  detail?: string;
};

export type TimelineBlock = {
  id: string;
  startAt: string;
  endAt: string;
  detail?: string;
  note?: string;
  tone: "choice" | "pending" | "confirmed" | "planned" | "done";
  dragId?: string;
  highlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

const TONE = {
  choice: "bg-[#ed1c24] text-white",
  pending: "bg-white text-[#111827] shadow-[inset_0_0_0_2px_#ed1c24]",
  confirmed: "bg-emerald-100 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]",
  planned: "bg-amber-50 text-amber-950 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.35)]",
  done: "bg-neutral-100 text-neutral-500",
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function minutesOf(iso: string) {
  const parts = new Intl.DateTimeFormat("nl-BE", {
    timeZone: BRUSSELS,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return Number(map.hour) * 60 + Number(map.minute);
}

function clock(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function rangeLabel(startAt: string, endAt: string) {
  return `${clock(minutesOf(startAt))}–${clock(minutesOf(endAt))}`;
}

function gridBounds(frees: TimelineFree[], blocks: TimelineBlock[], highlight: { startAt: string; endAt: string } | null) {
  const minutes: number[] = [];
  for (const item of [...frees, ...blocks]) minutes.push(minutesOf(item.startAt), minutesOf(item.endAt));
  if (highlight) minutes.push(minutesOf(highlight.startAt), minutesOf(highlight.endAt));
  if (minutes.length === 0) return { start: 8 * 60, end: 19 * 60 };
  let start = Math.max(6 * 60, Math.floor(Math.min(...minutes) / 60) * 60 - 60);
  let end = Math.ceil(Math.max(...minutes) / 60) * 60 + 60;
  if (end - start < 8 * 60) end = start + 8 * 60;
  return { start, end: Math.min(23 * 60, end) };
}

export function WeekTimeline({
  days,
  todayKey,
  weekLabel,
  loading = false,
  canGoPrevious = true,
  canGoNext = true,
  onPrevious,
  onNext,
  freeByDay,
  blocksByDay,
  highlight = null,
  hint,
  dropEnabled = false,
  onPickFree,
  onDropFree,
  onLessonDragStart,
  onLessonDragEnd,
}: {
  days: Date[];
  todayKey: string;
  weekLabel: string;
  loading?: boolean;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  freeByDay: Record<string, TimelineFree[]>;
  blocksByDay: Record<string, TimelineBlock[]>;
  highlight?: { startAt: string; endAt: string } | null;
  hint?: string;
  dropEnabled?: boolean;
  onPickFree: (startAt: string) => void;
  onDropFree?: (startAt: string, data: DataTransfer) => void;
  onLessonDragStart?: (id: string) => void;
  onLessonDragEnd?: () => void;
}) {
  const [hover, setHover] = useState<TimelineFree | null>(null);
  const frees = Object.values(freeByDay).flat();
  const blocks = Object.values(blocksByDay).flat();
  const bounds = gridBounds(frees, blocks, highlight);
  const height = ((bounds.end - bounds.start) / 15) * QUARTER_PX;
  const hours: number[] = [];
  for (let minute = bounds.start; minute < bounds.end; minute += 60) hours.push(minute);
  const navButton =
    "inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3 text-sm font-semibold text-[#111827] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-40";

  function topFor(iso: string) {
    return ((minutesOf(iso) - bounds.start) / 15) * QUARTER_PX;
  }

  function allowDrop(slot: TimelineFree, event: DragEvent<HTMLButtonElement>) {
    if (!dropEnabled || !onDropFree) return;
    event.preventDefault();
    setHover(slot);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
        <button type="button" className={navButton} disabled={!canGoPrevious} onClick={onPrevious}>
          Vorige
        </button>
        <p className="text-center text-sm font-semibold text-[#111827]">{weekLabel}</p>
        <button type="button" className={navButton} disabled={!canGoNext} onClick={onNext}>
          Volgende
        </button>
      </div>
      {hint && <p className="border-b border-black/5 px-4 py-2 text-xs leading-relaxed text-[#58595b]">{hint}</p>}
      <div className={`overflow-x-auto ${loading ? "pointer-events-none opacity-60" : ""}`}>
        <div className="min-w-[760px]">
          <div className="sticky top-0 z-20 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] bg-white">
            <div className="border-b border-[#f4f4f5]" />
            {days.map((day) => {
              const key = brusselsDateKey(day);
              const today = key === todayKey;
              return (
                <div key={key} className={`border-b border-l border-[#f4f4f5] px-2 py-3 text-center ${today ? "bg-[#fff7f7]" : "bg-white"}`}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#a1a1aa]">{capitalize(DAY_LABEL.format(day))}</p>
                  <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                    {DAY_NUMBER.format(day)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
            <div className="relative" style={{ height }}>
              {hours.map((minute) => (
                <span
                  key={minute}
                  className="absolute right-2 text-[11px] font-medium tabular-nums text-[#a1a1aa]"
                  style={{ top: ((minute - bounds.start) / 15) * QUARTER_PX + 4 }}
                >
                  {clock(minute)}
                </span>
              ))}
            </div>
            {days.map((day) => {
              const key = brusselsDateKey(day);
              const dayFree = freeByDay[key] ?? [];
              const dayBlocks = blocksByDay[key] ?? [];
              const today = key === todayKey;
              return (
                <DayColumn
                  key={key}
                  today={today}
                  height={height}
                  bounds={bounds}
                  frees={dayFree}
                  blocks={dayBlocks}
                  highlight={highlight && brusselsDateKey(new Date(highlight.startAt)) === key ? highlight : null}
                  hover={hover}
                  topFor={topFor}
                  onPickFree={onPickFree}
                  onDragOverFree={allowDrop}
                  onDropFree={(startAt, data) => {
                    setHover(null);
                    onDropFree?.(startAt, data);
                  }}
                  onLessonDragStart={onLessonDragStart}
                  onLessonDragEnd={() => {
                    setHover(null);
                    onLessonDragEnd?.();
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  today,
  height,
  bounds,
  frees,
  blocks,
  highlight,
  hover,
  topFor,
  onPickFree,
  onDragOverFree,
  onDropFree,
  onLessonDragStart,
  onLessonDragEnd,
}: {
  today: boolean;
  height: number;
  bounds: { start: number; end: number };
  frees: TimelineFree[];
  blocks: TimelineBlock[];
  highlight: { startAt: string; endAt: string } | null;
  hover: TimelineFree | null;
  topFor: (iso: string) => number;
  onPickFree: (startAt: string) => void;
  onDragOverFree: (slot: TimelineFree, event: DragEvent<HTMLButtonElement>) => void;
  onDropFree: (startAt: string, data: DataTransfer) => void;
  onLessonDragStart?: (id: string) => void;
  onLessonDragEnd?: () => void;
}) {
  const highlightIsBlock = Boolean(highlight && frees.some((slot) => slot.startAt === highlight.startAt));
  const lines: { minute: number; strong: boolean }[] = [];
  for (let minute = bounds.start; minute < bounds.end; minute += 30) {
    lines.push({ minute, strong: minute % 60 === 0 });
  }

  return (
    <div className={`relative border-l border-[#f4f4f5] ${today ? "bg-[#fff7f7]" : "bg-white"}`} style={{ height }}>
      {lines.map((line) => (
        <div
          key={line.minute}
          className={`pointer-events-none absolute inset-x-0 border-t ${line.strong ? "border-[#e4e4e7]" : "border-[#f4f4f5]"}`}
          style={{ top: ((line.minute - bounds.start) / 15) * QUARTER_PX }}
        />
      ))}
      {frees.map((slot) => {
        const selected = highlight?.startAt === slot.startAt;
        return (
          <button
            key={slot.startAt}
            type="button"
            aria-label={rangeLabel(slot.startAt, slot.endAt)}
            onClick={() => onPickFree(slot.startAt)}
            onDragOver={(event) => onDragOverFree(slot, event)}
            onDrop={(event) => {
              event.preventDefault();
              onDropFree(slot.startAt, event.dataTransfer);
            }}
            className={`absolute inset-x-1.5 z-30 flex flex-col items-start overflow-hidden rounded-lg px-1.5 py-1 text-left ${
              selected ? TONE.choice : "bg-emerald-50 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.28)] hover:bg-emerald-200 hover:shadow-[inset_0_0_0_2px_rgb(16,185,129)]"
            } ${hover?.startAt === slot.startAt ? "ring-2 ring-[#ed1c24]" : ""}`}
            style={{ top: topFor(slot.startAt) + 2, height: Math.max(topFor(slot.endAt) - topFor(slot.startAt) - 4, QUARTER_PX - 4) }}
          >
            <span className="block text-[11px] font-semibold leading-tight tabular-nums">{rangeLabel(slot.startAt, slot.endAt)}</span>
            {slot.detail && <span className={`mt-0.5 block truncate text-[11px] ${selected ? "text-white/90" : "text-emerald-900/80"}`}>{slot.detail}</span>}
          </button>
        );
      })}
      {highlight && !highlightIsBlock && (
        <div
          className="pointer-events-none absolute inset-x-1.5 z-20 overflow-hidden rounded-lg bg-[#ed1c24]/15 shadow-[inset_0_0_0_1px_rgba(237,28,36,0.35)]"
          style={{ top: topFor(highlight.startAt) + 2, height: Math.max(topFor(highlight.endAt) - topFor(highlight.startAt) - 4, QUARTER_PX) }}
        >
          <span className="block px-1.5 pt-1 text-[11px] font-semibold text-[#ed1c24] tabular-nums">{rangeLabel(highlight.startAt, highlight.endAt)}</span>
        </div>
      )}
      {blocks.map((block) => (
        <div
          key={block.id}
          className={`absolute inset-x-1.5 z-40 ${block.highlighted ? "ring-2 ring-[#111827]" : ""}`}
          style={{ top: topFor(block.startAt) + 2, height: Math.max(topFor(block.endAt) - topFor(block.startAt) - 4, QUARTER_PX) }}
        >
          <button
            type="button"
            draggable={Boolean(block.dragId)}
            onDragStart={(event) => {
              if (!block.dragId) return;
              event.dataTransfer.setData("text/plain", block.dragId);
              event.dataTransfer.effectAllowed = "move";
              onLessonDragStart?.(block.dragId);
            }}
            onDragEnd={onLessonDragEnd}
            onClick={block.onClick}
            className={`flex h-full w-full flex-col items-start overflow-hidden rounded-lg px-1.5 py-1 text-left text-[11px] ${TONE[block.tone]} ${block.dragId ? "cursor-grab active:cursor-grabbing" : ""} ${block.onRemove ? "pr-6" : ""}`}
          >
            <span className="block font-semibold leading-tight tabular-nums">{rangeLabel(block.startAt, block.endAt)}</span>
            {block.detail && <span className="mt-0.5 block truncate font-medium opacity-90">{block.detail}</span>}
            {block.note && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide opacity-80">{block.note}</span>}
          </button>
          {block.onRemove && (
            <button
              type="button"
              aria-label={block.removeLabel ?? "Weghalen"}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10"
              onClick={block.onRemove}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
