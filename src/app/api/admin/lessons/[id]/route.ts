import { NextRequest, NextResponse } from "next/server";
import { cancelLesson, confirmLesson, rescheduleLesson } from "@/lib/admin/lessons";
import { adminLessonActionSchema } from "@/lib/validations/adminLesson";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = adminLessonActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.action === "confirm") {
    const result = await confirmLesson(params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ status: result.status });
  }

  if (parsed.data.action === "cancel") {
    const result = await cancelLesson(params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ status: result.status, refundEligible: result.refundEligible });
  }

  const result = await rescheduleLesson(params.id, parsed.data.startAt, parsed.data.endAt, parsed.data.instructorId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.lesson);
}
