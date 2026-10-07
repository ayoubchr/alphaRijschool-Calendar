export type AvailabilityKind = "LESSON" | "EXAM";
export type TimeBlock = { start: string; end: string; kind: AvailabilityKind };

export function minutesOf(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

export function timeFromMinutes(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function blocksOverlap(left: { start: string; end: string }, right: { start: string; end: string }) {
  return left.start < right.end && right.start < left.end;
}

/**
 * Older saves stored every painted quarter as its own 2-hour window.
 * Those quarters are one block, from the first start through the last quarter.
 * A block stored on its own, such as 15:30–17:30, stays separate from the next one.
 */
export function coalesceLegacyBlocks(windows: { start: string; end: string }[]): { start: string; end: string }[] {
  const sorted = [...windows]
    .map((window) => ({ start: window.start.slice(0, 5), end: window.end.slice(0, 5) }))
    .sort((left, right) => left.start.localeCompare(right.start) || left.end.localeCompare(right.end));
  const blocks: { start: string; end: string }[] = [];
  let index = 0;
  while (index < sorted.length) {
    const window = sorted[index];
    const duration = minutesOf(window.end) - minutesOf(window.start);
    if (duration !== 120) {
      blocks.push(window);
      index += 1;
      continue;
    }
    let end = index + 1;
    while (end < sorted.length) {
      const next = sorted[end];
      if (minutesOf(next.end) - minutesOf(next.start) !== 120) break;
      if (minutesOf(next.start) - minutesOf(sorted[end - 1].start) !== 15) break;
      end += 1;
    }
    if (end - index === 1) blocks.push(window);
    else blocks.push({ start: window.start, end: timeFromMinutes(minutesOf(sorted[end - 1].start) + 15) });
    index = end;
  }
  return blocks;
}

export function sameBlocks(left: TimeBlock[], right: TimeBlock[]) {
  if (left.length !== right.length) return false;
  const sortKey = (block: TimeBlock) => `${block.kind}-${block.start}`;
  const sortedLeft = [...left].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const sortedRight = [...right].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return sortedLeft.every((block, index) => block.kind === sortedRight[index].kind && block.start === sortedRight[index].start && block.end === sortedRight[index].end);
}

export function resolveDayBlocks(
  rules: { start: string; end: string; kind?: AvailabilityKind }[],
  exceptions: { start: string; end: string; isAvailable: boolean; kind?: AvailabilityKind }[],
): TimeBlock[] {
  return (["LESSON", "EXAM"] as const).flatMap((kind) => {
    const byStart = new Map<string, TimeBlock>();
    for (const rule of rules) {
      if ((rule.kind ?? "LESSON") !== kind) continue;
      byStart.set(rule.start.slice(0, 5), { start: rule.start.slice(0, 5), end: rule.end.slice(0, 5), kind });
    }
    for (const item of exceptions) {
      if ((item.kind ?? "LESSON") !== kind || item.isAvailable) continue;
      byStart.delete(item.start.slice(0, 5));
    }
    for (const item of exceptions) {
      if ((item.kind ?? "LESSON") !== kind || !item.isAvailable) continue;
      byStart.set(item.start.slice(0, 5), { start: item.start.slice(0, 5), end: item.end.slice(0, 5), kind });
    }
    const resolved = [...byStart.values()];
    if (kind === "EXAM") return resolved;
    return coalesceLegacyBlocks(resolved).map((block) => ({ ...block, kind: "LESSON" as const }));
  });
}
