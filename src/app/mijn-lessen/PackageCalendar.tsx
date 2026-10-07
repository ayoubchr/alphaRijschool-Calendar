"use client";

import { useEffect, useState } from "react";
import { intervalsOverlap } from "@/components/StartTimeChips";
import { WeekTimeline, type TimelineBlock, type TimelineFree } from "@/components/WeekTimeline";
import { addBrusselsDays, brusselsDateKey, brusselsYmd, isTooSoonToPlan, startOfBrusselsWeek } from "@/lib/brusselsWeek";
import { blockHoursForPackage, isExamPackage, isPrepExamPackage, isTheoryPackage } from "@/lib/lessonBlocks";
import { cancelOwnLesson, moveOwnLesson, planLessons } from "./actions";
import type { StudentDossier, StudentLesson } from "./MijnLessenView";

type SlotChoice = { instructorId: string; startAt: string; endAt: string };
export type CalendarActions = {
  plan: (input: { dossierId: string; slots: SlotChoice[] }) => Promise<{ ok: true } | { ok: false; error: string }>;
  move: (input: SlotChoice & { lessonId: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  cancel: (lessonId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

type FreeSlot = { instructorId: string; instructorName: string; startAt: string; endAt: string };
type PendingMove = FreeSlot & { lessonId: string };

const BRUSSELS = "Europe/Brussels";
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

export function PackageCalendar({ dossier, actions, onUpdated }: { dossier: StudentDossier; actions?: CalendarActions; onUpdated?: () => void }) {
  const plan = actions?.plan ?? planLessons;
  const moveLesson = actions?.move ?? moveOwnLesson;
  const cancelLesson = actions?.cancel ?? cancelOwnLesson;
  const [weekStart, setWeekStart] = useState(() => initialWeek(dossier.lessons));
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState<PendingMove[]>([]);
  const [adds, setAdds] = useState<FreeSlot[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<{ slots: FreeSlot[]; lessonId: string | null } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<StudentLesson | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const to = addBrusselsDays(weekStart, 7);
    const except = pickedId ? `&exceptLessonId=${encodeURIComponent(pickedId)}` : "";
    fetch(`/api/availability?packageId=${dossier.packageId}&from=${weekStart.toISOString()}&to=${to.toISOString()}&transmission=${dossier.transmission}${except}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { instructorId: string; instructorName: string; slots: { startAt: string; endAt: string }[] }[]) => {
        if (controller.signal.aborted || !Array.isArray(data)) return;
        setFreeSlots(data.flatMap((entry) => entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))));
      })
      .catch(() => { if (!controller.signal.aborted) setFreeSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [dossier.packageId, dossier.transmission, weekStart, pickedId]);

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

  const movingId = draggingId ?? pickedId;
  const reservedAdds = adds.filter((slot) => !placed.some((lesson) => lesson.startAt === slot.startAt && lesson.instructorId === slot.instructorId));
  const occupied = [
    ...placed.filter((lesson) => lesson.id !== movingId),
    ...reservedAdds,
  ];
  const openByTime = new Map<string, FreeSlot[]>();
  for (const slot of freeSlots) {
    if (isTooSoonToPlan(new Date(slot.startAt))) continue;
    if (occupied.some((item) => intervalsOverlap(item.startAt, item.endAt, slot.startAt, slot.endAt))) continue;
    const group = openByTime.get(slot.startAt) ?? [];
    group.push(slot);
    openByTime.set(slot.startAt, group);
  }
  const theory = isTheoryPackage({ name: dossier.packageName });
  const exam = isExamPackage({ name: dossier.packageName });
  const prep = isPrepExamPackage({ name: dossier.packageName });
  const blockHours = blockHoursForPackage({ name: dossier.packageName });
  const creditLeft = Math.floor(dossier.hoursRemaining / blockHours) - reservedAdds.length;
  const dirty = moves.length > 0 || reservedAdds.length > 0;
  const days = Array.from({ length: 7 }, (_, index) => addBrusselsDays(weekStart, index));
  const todayKey = brusselsDateKey(new Date());
  const freeByDay: Record<string, TimelineFree[]> = {};
  for (const [startAt, slots] of openByTime) {
    const key = brusselsDateKey(new Date(startAt));
    const list = freeByDay[key] ?? [];
    list.push({
      startAt,
      endAt: slots[0].endAt,
      detail: slots.length === 1 ? slots[0].instructorName : `${slots.length} instructeurs`,
    });
    freeByDay[key] = list;
  }
  const blocksByDay: Record<string, TimelineBlock[]> = {};
  function pushBlock(key: string, block: TimelineBlock) {
    const list = blocksByDay[key] ?? [];
    list.push(block);
    blocksByDay[key] = list;
  }
  for (const lesson of placed) {
    if (!inWeek(lesson.startAt, weekStart)) continue;
    const tone = lesson.pending ? "pending" : lesson.status === "CONFIRMED" ? "confirmed" : lesson.status === "PLANNED" ? "planned" : "done";
    pushBlock(brusselsDateKey(new Date(lesson.startAt)), {
      id: lesson.id,
      startAt: lesson.startAt,
      endAt: lesson.endAt,
      detail: lesson.instructorName,
      note: lesson.pending ? "Nog opslaan" : STATUS[lesson.status]?.label ?? lesson.status,
      tone,
      dragId: lesson.canChange ? lesson.id : undefined,
      highlighted: pickedId === lesson.id,
      onClick: lesson.canChange ? () => setPickedId((current) => (current === lesson.id ? null : lesson.id)) : undefined,
      onRemove: lesson.canChange ? () => setCancelTarget(dossier.lessons.find((item) => item.id === lesson.id) ?? lesson) : undefined,
      removeLabel: "Les annuleren",
    });
  }
  for (const slot of reservedAdds) {
    pushBlock(brusselsDateKey(new Date(slot.startAt)), {
      id: slotKey(slot),
      startAt: slot.startAt,
      endAt: slot.endAt,
      detail: slot.instructorName,
      note: "Nieuw · nog opslaan",
      tone: "choice",
      removeLabel: "Nieuwe les weghalen",
      onRemove: () => setAdds((current) => current.filter((item) => slotKey(item) !== slotKey(slot))),
    });
  }

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
      const result = await moveLesson({ lessonId: move.lessonId, instructorId: move.instructorId, startAt: move.startAt, endAt: move.endAt });
      if (!result.ok) {
        setMoves((current) => current.filter((item) => !savedMoveIds.includes(item.lessonId)));
        setError(result.error);
        setSaving(false);
        if (savedMoveIds.length > 0) onUpdated?.();
        return;
      }
      savedMoveIds.push(move.lessonId);
    }
    if (reservedAdds.length > 0) {
      const result = await plan({
        dossierId: dossier.id,
        slots: reservedAdds.map((slot) => ({ instructorId: slot.instructorId, startAt: slot.startAt, endAt: slot.endAt })),
      });
      if (!result.ok) {
        setMoves([]);
        setError(result.error);
        setSaving(false);
        if (savedMoveIds.length > 0) onUpdated?.();
        return;
      }
    }
    setMoves([]);
    setAdds([]);
    setSaving(false);
    onUpdated?.();
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setError(null);
    const result = await cancelLesson(cancelTarget.id);
    setCancelling(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMoves((current) => current.filter((item) => item.lessonId !== cancelTarget.id));
    setPickedId((current) => (current === cancelTarget.id ? null : current));
    setCancelTarget(null);
    onUpdated?.();
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ed1c24]">Pakket</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#111827]">{dossier.packageName}</h2>
          <p className="mt-1 text-sm text-[#58595b]">
            {theory ? "" : `${TRANSMISSION[dossier.transmission]} · `}nog {dossier.hoursRemaining} uur
            {reservedAdds.length > 0 ? ` (${dossier.hoursRemaining - reservedAdds.length * blockHours} na opslaan)` : ""}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs font-semibold">
          <li className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-950">Bevestigd</li>
          <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-950">Gepland</li>
          <li className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-neutral-600">Afgerond</li>
          <li className="rounded-full border border-[#ed1c24] bg-white px-2.5 py-1 text-[#ed1c24]">Nog opslaan</li>
        </ul>
      </div>
      <p className="mt-3 text-sm text-[#58595b]">{theory ? "Kies een groene theoriedag, of sleep een les ernaartoe. Klik daarna op Opslaan." : prep ? "Klik een groen blok met voorbereiding en examen, of sleep je moment ernaartoe. Klik daarna op Opslaan." : exam ? "Klik een groen examenblok, of sleep je examen ernaartoe. Klik daarna op Opslaan." : "Klik een groen blok. Dat is de hele les van 2 uur. Je kan een les ook verslepen. Klik daarna op Opslaan."}</p>
      {error && <p className="mt-3 text-sm text-[#ed1c24]">{error}</p>}

      <div className="mt-4">
        <WeekTimeline
          days={days}
          todayKey={todayKey}
          weekLabel={weekLabel(weekStart)}
          loading={loading}
          onPrevious={() => setWeekStart(addBrusselsDays(weekStart, -7))}
          onNext={() => setWeekStart(addBrusselsDays(weekStart, 7))}
          freeByDay={freeByDay}
          blocksByDay={blocksByDay}
          dropEnabled={Boolean(draggingId)}
          onPickFree={(startAt) => {
            const slots = openByTime.get(startAt);
            if (slots) openInstructorChoice(slots, pickedId);
          }}
          onDropFree={(startAt, data) => {
            const lessonId = data.getData("text/plain") || draggingId;
            const slots = openByTime.get(startAt);
            setDraggingId(null);
            if (lessonId && slots) openInstructorChoice(slots, lessonId);
          }}
          onLessonDragStart={(id) => setDraggingId(id)}
          onLessonDragEnd={() => setDraggingId(null)}
        />
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
              {theory
                ? `Wil je de theoriedag op ${MOMENT.format(new Date(cancelTarget.startAt))} annuleren? De ${blockHours} uur komen terug op je pakket.`
                : `Wil je de les op ${MOMENT.format(new Date(cancelTarget.startAt))} bij ${cancelTarget.instructorName} annuleren? De ${blockHours} uur komen terug op je pakket.`}
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
