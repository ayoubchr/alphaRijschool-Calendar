"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { addBrusselsDays, brusselsDateKey, brusselsYmd, isTooSoonToPlan, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { cancelOwnLesson, moveOwnLesson, planLessons } from "./actions";
import type { StudentDossier, StudentLesson } from "./MijnLessenView";

type FreeSlot = { instructorId: string; instructorName: string; startAt: string; endAt: string };
type PendingMove = FreeSlot & { lessonId: string };

const BRUSSELS = "Europe/Brussels";
const DAY_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric" });
const TIME_LABEL = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit" });
const RANGE_DAY = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long" });
const RANGE_DAY_YEAR = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, day: "numeric", month: "long", year: "numeric" });
const MOMENT = new Intl.DateTimeFormat("nl-BE", { timeZone: BRUSSELS, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const STATUS: Record<string, { label: string; card: string }> = {
  PLANNED: { label: "Gepland", card: "border-amber-200 bg-amber-50 text-amber-950" },
  CONFIRMED: { label: "Bevestigd", card: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  COMPLETED: { label: "Afgerond", card: "border-neutral-200 bg-neutral-100 text-neutral-600" },
  CANCELLED: { label: "Geannuleerd", card: "border-neutral-200 bg-neutral-50 text-neutral-400" },
};

const TRANSMISSION = { AUTOMAAT: "Automaat", MANUEEL: "Manueel" };

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function weekLabel(weekStart: Date) {
  const weekEnd = addBrusselsDays(weekStart, 6);
  const start = brusselsYmd(weekStart);
  const end = brusselsYmd(weekEnd);
  if (start.year === end.year && start.month === end.month) return `${start.day} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  if (start.year === end.year) return `${RANGE_DAY.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
  return `${RANGE_DAY_YEAR.format(weekStart)} – ${RANGE_DAY_YEAR.format(weekEnd)}`;
}

function slotKey(slot: { instructorId: string; startAt: string }) {
  return `${slot.instructorId}|${slot.startAt}`;
}

function inWeek(iso: string, weekStart: Date) {
  const time = new Date(iso).getTime();
  return time >= weekStart.getTime() && time < addBrusselsDays(weekStart, 7).getTime();
}

function initialWeek(lessons: StudentLesson[]) {
  const now = Date.now();
  const next = lessons.find((lesson) => lesson.status !== "CANCELLED" && lesson.status !== "COMPLETED" && new Date(lesson.startAt).getTime() >= now);
  return startOfBrusselsWeek(next ? new Date(next.startAt) : new Date());
}

export function PackageCalendar({ dossier }: { dossier: StudentDossier }) {
  const [weekStart, setWeekStart] = useState(() => initialWeek(dossier.lessons));
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState<PendingMove[]>([]);
  const [adds, setAdds] = useState<FreeSlot[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<{ slots: FreeSlot[]; lessonId: string | null } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<StudentLesson | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const to = addBrusselsDays(weekStart, 7);
    fetch(`/api/availability?packageId=${dossier.packageId}&from=${weekStart.toISOString()}&to=${to.toISOString()}&transmission=${dossier.transmission}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { instructorId: string; instructorName: string; slots: { startAt: string; endAt: string }[] }[]) => {
        if (controller.signal.aborted || !Array.isArray(data)) return;
        setFreeSlots(data.flatMap((entry) => entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))));
      })
      .catch(() => { if (!controller.signal.aborted) setFreeSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [dossier.packageId, dossier.transmission, weekStart]);

  useEffect(() => {
    if (!cancelTarget && !choosing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setCancelTarget(null);
      setChoosing(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelTarget, choosing]);

  const placed = dossier.lessons
    .filter((lesson) => lesson.status !== "CANCELLED")
    .map((lesson) => {
      const move = moves.find((item) => item.lessonId === lesson.id);
      if (!move) return { ...lesson, pending: false };
      return { ...lesson, startAt: move.startAt, endAt: move.endAt, instructorId: move.instructorId, instructorName: move.instructorName, pending: true };
    });

  const takenTimes = new Set([...placed.map((lesson) => lesson.startAt), ...adds.map((slot) => slot.startAt)]);
  const reservedAdds = adds.filter((slot) => !placed.some((lesson) => lesson.startAt === slot.startAt));
  const openByTime = new Map<string, FreeSlot[]>();
  for (const slot of freeSlots) {
    if (takenTimes.has(slot.startAt) || isTooSoonToPlan(new Date(slot.startAt))) continue;
    const group = openByTime.get(slot.startAt) ?? [];
    group.push(slot);
    openByTime.set(slot.startAt, group);
  }
  const creditLeft = Math.floor(dossier.hoursRemaining / 2) - reservedAdds.length;
  const dirty = moves.length > 0 || reservedAdds.length > 0;
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const todayKey = brusselsDateKey(new Date());
  const navButton = "inline-flex h-10 items-center gap-1 rounded-[10px] border border-black/10 bg-white px-3 text-sm font-semibold text-[#111827] transition hover:border-[#111827]";

  function stageMove(lessonId: string, slot: FreeSlot) {
    const lesson = dossier.lessons.find((item) => item.id === lessonId);
    if (!lesson?.canChange) return;
    setAdds((current) => current.filter((item) => item.startAt !== slot.startAt));
    setMoves((current) => {
      const rest = current.filter((item) => item.lessonId !== lessonId);
      if (lesson.startAt === slot.startAt && lesson.instructorId === slot.instructorId) return rest;
      return [...rest, { lessonId, ...slot }];
    });
    setPickedId(null);
    setDraggingId(null);
  }

  function applyChoice(slot: FreeSlot, lessonId: string | null) {
    setChoosing(null);
    setError(null);
    if (lessonId) {
      stageMove(lessonId, slot);
      return;
    }
    setAdds((current) => (current.some((item) => item.startAt === slot.startAt) ? current : [...current, slot]));
  }

  function openInstructorChoice(slots: FreeSlot[], lessonId: string | null) {
    if (!lessonId && creditLeft < 1) {
      setError("Je hebt geen tegoed meer om een extra les te plannen.");
      return;
    }
    if (slots.length === 1) {
      applyChoice(slots[0], lessonId);
      return;
    }
    setChoosing({ slots: [...slots].sort((a, b) => a.instructorName.localeCompare(b.instructorName, "nl")), lessonId });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const savedMoveIds: string[] = [];
    for (const move of moves) {
      const result = await moveOwnLesson({ lessonId: move.lessonId, instructorId: move.instructorId, startAt: move.startAt, endAt: move.endAt });
      if (!result.ok) {
        setMoves((current) => current.filter((item) => !savedMoveIds.includes(item.lessonId)));
        setError(result.error);
        setSaving(false);
        return;
      }
      savedMoveIds.push(move.lessonId);
    }
    if (reservedAdds.length > 0) {
      const result = await planLessons({
        dossierId: dossier.id,
        slots: reservedAdds.map((slot) => ({ instructorId: slot.instructorId, startAt: slot.startAt, endAt: slot.endAt })),
      });
      if (!result.ok) {
        setMoves([]);
        setError(result.error);
        setSaving(false);
        return;
      }
    }
    setMoves([]);
    setAdds([]);
    setSaving(false);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setError(null);
    const result = await cancelOwnLesson(cancelTarget.id);
    setCancelling(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMoves((current) => current.filter((item) => item.lessonId !== cancelTarget.id));
    setPickedId((current) => (current === cancelTarget.id ? null : current));
    setCancelTarget(null);
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ed1c24]">Pakket</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#111827]">{dossier.packageName}</h2>
          <p className="mt-1 text-sm text-[#58595b]">
            {TRANSMISSION[dossier.transmission]} · nog {dossier.hoursRemaining} uur
            {reservedAdds.length > 0 ? ` (${dossier.hoursRemaining - reservedAdds.length * 2} na opslaan)` : ""}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs font-semibold">
          <li className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-950">Bevestigd</li>
          <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-950">Gepland</li>
          <li className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-neutral-600">Afgerond</li>
          <li className="rounded-full border border-[#ed1c24] bg-white px-2.5 py-1 text-[#ed1c24]">Nog opslaan</li>
        </ul>
      </div>
      <p className="mt-3 text-sm text-[#58595b]">Klik een vrij moment en kies een instructeur, of sleep een les ernaartoe. Klik daarna op Opslaan.</p>
      {error && <p className="mt-3 text-sm text-[#ed1c24]">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-[10px] border border-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-3">
          <button type="button" className={navButton} onClick={() => setWeekStart(addBrusselsDays(weekStart, -7))}>
            <span aria-hidden>←</span> Vorige
          </button>
          <p className="text-center text-sm font-extrabold text-[#111827] sm:text-base">{weekLabel(weekStart)}</p>
          <button type="button" className={navButton} onClick={() => setWeekStart(addBrusselsDays(weekStart, 7))}>
            Volgende <span aria-hidden>→</span>
          </button>
        </div>
        <div className={`relative overflow-x-auto ${loading ? "opacity-60" : ""}`}>
          <div className="grid min-w-[760px] grid-cols-7">
            {days.map((day) => {
              const key = brusselsDateKey(day);
              const dayLessons = placed.filter((lesson) => inWeek(lesson.startAt, weekStart) && brusselsDateKey(new Date(lesson.startAt)) === key);
              const dayAdds = reservedAdds.filter((slot) => brusselsDateKey(new Date(slot.startAt)) === key);
              const dayFree = [...openByTime.entries()]
                .filter(([startAt]) => brusselsDateKey(new Date(startAt)) === key)
                .map(([startAt, slots]) => ({ startAt, slots }));
              const cards = [
                ...dayLessons.map((lesson) => ({ kind: "lesson" as const, lesson, at: lesson.startAt })),
                ...dayAdds.map((slot) => ({ kind: "add" as const, slot, at: slot.startAt })),
                ...dayFree.map((group) => ({ kind: "free" as const, group, at: group.startAt })),
              ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
              return (
                <div key={key} className={`min-h-[240px] border-r border-black/5 p-2 last:border-r-0 ${key === todayKey ? "bg-[#fff5f5]" : ""}`}>
                  <header className="mb-2 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#58595b]">{capitalize(DAY_LABEL.format(day))}</p>
                    <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${key === todayKey ? "bg-[#ed1c24] text-white" : "text-[#111827]"}`}>
                      {DAY_NUMBER.format(day)}
                    </p>
                  </header>
                  <ul className="space-y-2">
                    {cards.map((card) => {
                      if (card.kind === "lesson") {
                        const { lesson } = card;
                        const tone = lesson.pending
                          ? "border-[#ed1c24] bg-white text-[#111827]"
                          : STATUS[lesson.status]?.card ?? "border-black/10 bg-white text-[#111827]";
                        return (
                          <li key={lesson.id} className="relative">
                            <button
                              type="button"
                              draggable={lesson.canChange}
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", lesson.id);
                                event.dataTransfer.effectAllowed = "move";
                                setDraggingId(lesson.id);
                              }}
                              onDragEnd={() => { setDraggingId(null); setOverKey(null); }}
                              onClick={() => {
                                if (!lesson.canChange) return;
                                setPickedId((current) => (current === lesson.id ? null : lesson.id));
                              }}
                              className={`w-full rounded-lg border px-2 py-2 pr-7 text-left text-xs ${tone} ${lesson.canChange ? "cursor-grab active:cursor-grabbing" : ""} ${pickedId === lesson.id ? "ring-2 ring-[#ed1c24]" : ""}`}
                            >
                              <span className="block font-bold">
                                {TIME_LABEL.format(new Date(lesson.startAt))}–{TIME_LABEL.format(new Date(lesson.endAt))}
                              </span>
                              <span className="mt-0.5 block font-medium">{lesson.instructorName}</span>
                              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide opacity-80">
                                {lesson.pending ? "Nog opslaan" : STATUS[lesson.status]?.label ?? lesson.status}
                              </span>
                            </button>
                            {lesson.canChange && (
                              <button
                                type="button"
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[#ed1c24] hover:bg-[#ed1c24] hover:text-white"
                                aria-label="Les annuleren"
                                onClick={() => setCancelTarget(dossier.lessons.find((item) => item.id === lesson.id) ?? lesson)}
                              >
                                <IoClose className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </li>
                        );
                      }
                      if (card.kind === "add") {
                        const { slot } = card;
                        return (
                          <li key={slotKey(slot)} className="relative">
                            <div className="rounded-lg border border-[#ed1c24] bg-[#ed1c24] px-2 py-2 pr-7 text-xs text-white">
                              <span className="block font-bold">{TIME_LABEL.format(new Date(slot.startAt))}–{TIME_LABEL.format(new Date(slot.endAt))}</span>
                              <span className="mt-0.5 block">{slot.instructorName}</span>
                              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide">Nieuw · nog opslaan</span>
                            </div>
                            <button
                              type="button"
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white hover:bg-white/20"
                              aria-label="Nieuwe les weghalen"
                              onClick={() => setAdds((current) => current.filter((item) => slotKey(item) !== slotKey(slot)))}
                            >
                              <IoClose className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      }
                      const { group } = card;
                      const active = overKey === group.startAt;
                      const label = group.slots.length === 1 ? group.slots[0].instructorName : `${group.slots.length} instructeurs`;
                      return (
                        <li key={group.startAt}>
                          <button
                            type="button"
                            onDragOver={(event) => {
                              if (!draggingId) return;
                              event.preventDefault();
                              setOverKey(group.startAt);
                            }}
                            onDragLeave={() => setOverKey((current) => (current === group.startAt ? null : current))}
                            onDrop={(event) => {
                              event.preventDefault();
                              const lessonId = event.dataTransfer.getData("text/plain") || draggingId;
                              setOverKey(null);
                              setDraggingId(null);
                              if (lessonId) openInstructorChoice(group.slots, lessonId);
                            }}
                            onClick={() => openInstructorChoice(group.slots, pickedId)}
                            className={`w-full rounded-lg border border-dashed px-2 py-2 text-left text-xs text-[#58595b] ${active || pickedId ? "border-[#ed1c24] bg-[#fff5f5]" : "border-black/15 bg-[#f9f9f9] hover:border-[#111827]"}`}
                          >
                            <span className="block font-bold text-[#111827]">{TIME_LABEL.format(new Date(group.startAt))}–{TIME_LABEL.format(new Date(group.slots[0].endAt))}</span>
                            <span className="mt-0.5 block">Vrij · {label}</span>
                          </button>
                        </li>
                      );
                    })}
                    {cards.length === 0 && <li className="px-1 text-center text-[11px] text-[#58595b]">Geen momenten</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dirty && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#111827] px-4 py-3 text-white">
          <p className="text-sm">
            {moves.length > 0 ? `${moves.length} verplaatsing${moves.length === 1 ? "" : "en"}` : ""}
            {moves.length > 0 && reservedAdds.length > 0 ? " · " : ""}
            {reservedAdds.length > 0 ? `${reservedAdds.length} nieuwe les${reservedAdds.length === 1 ? "" : "sen"}` : ""}
            {" "}nog niet opgeslagen
          </p>
          <div className="flex gap-2">
            <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:text-white" onClick={() => { setMoves([]); setAdds([]); setPickedId(null); }} disabled={saving}>
              Ongedaan maken
            </button>
            <button type="button" className="rounded-full bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={save} disabled={saving}>
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      {choosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={() => setChoosing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="instructeur-titel" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 id="instructeur-titel" className="text-lg font-extrabold text-[#111827]">Kies een instructeur</h3>
            <p className="mt-2 text-sm text-[#58595b]">
              {TIME_LABEL.format(new Date(choosing.slots[0].startAt))}–{TIME_LABEL.format(new Date(choosing.slots[0].endAt))}
              {choosing.lessonId ? " · les verplaatsen" : " · nieuwe les"}
            </p>
            <ul className="mt-4 space-y-2">
              {choosing.slots.map((slot) => (
                <li key={slot.instructorId}>
                  <button type="button" className="w-full rounded-[10px] border border-black/10 px-4 py-3 text-left text-sm font-semibold text-[#111827] transition hover:border-[#ed1c24] hover:text-[#ed1c24]" onClick={() => applyChoice(slot, choosing.lessonId)}>
                    {slot.instructorName}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-[#111827]" onClick={() => setChoosing(null)}>
                Terug
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={() => { if (!cancelling) setCancelTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="annuleer-titel" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 id="annuleer-titel" className="text-lg font-extrabold text-[#111827]">Les annuleren?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#58595b]">
              Wil je de les op {MOMENT.format(new Date(cancelTarget.startAt))} bij {cancelTarget.instructorName} annuleren? De 2 uur komen terug op je pakket.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-[#111827]" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Terug
              </button>
              <button type="button" className="rounded-full bg-[#ed1c24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? "Bezig…" : "Ja, annuleren"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
