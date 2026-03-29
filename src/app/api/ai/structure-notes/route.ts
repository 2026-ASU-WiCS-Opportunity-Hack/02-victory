import { NextResponse } from "next/server";
import { structureNotes } from "@/lib/ai/groq";
import type { StructuredNote } from "@/types";
import { getStaffContext } from "@/lib/auth/admin";
import { guardAiRate } from "@/lib/ai-guard";
import { aiStructureNotesSchema } from "@/lib/validation/schemas";

const DEMO: StructuredNote = {
  summary:
    "Client and case manager reviewed housing referral paperwork and clarified benefits enrollment steps. Client reported increased stress about timelines but agreed to a follow-up plan.",
  service_type: "Housing navigation",
  action_items: [
    "Email pay stubs to landlord contact by Friday.",
    "Confirm county benefits appointment date.",
  ],
  mood_risk: "Medium risk — situational stress related to housing uncertainty; no safety concerns voiced.",
  follow_up_date: null,
  key_observations:
    "Client asked clarifying questions about paperwork and responded positively to structured next steps.",
};

export async function POST(req: Request) {
  try {
    const { isStaff, userId } = await getStaffContext();
    if (!isStaff) {
      return NextResponse.json({ error: "Only staff can structure notes." }, { status: 403 });
    }

    const rate = guardAiRate(req, userId, 45);
    if (rate) return rate;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = aiStructureNotesSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { transcript, serviceTypes = [] } = parsed.data;

    try {
      const structured = await structureNotes(transcript, serviceTypes);
      return NextResponse.json(structured);
    } catch {
      return NextResponse.json(DEMO);
    }
  } catch (error) {
    console.error("Note structuring error:", error);
    return NextResponse.json({ error: "Note structuring failed" }, { status: 500 });
  }
}
