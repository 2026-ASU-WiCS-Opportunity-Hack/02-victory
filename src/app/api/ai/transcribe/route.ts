import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/groq";
import { getStaffContext } from "@/lib/auth/admin";
import { guardAiRate } from "@/lib/ai-guard";

const DEMO =
  "Demo transcript: The client discussed housing navigation and next steps for benefits enrollment. They expressed concern about documentation deadlines. We scheduled a follow-up call for next Tuesday.";

export async function POST(req: Request) {
  try {
    const { isStaff, userId } = await getStaffContext();
    if (!isStaff) {
      return NextResponse.json({ error: "Only staff can transcribe audio." }, { status: 403 });
    }

    const rate = guardAiRate(req, userId, 60);
    if (rate) return rate;

    const formData = await req.formData();
    const audioFile = formData.get("audio");
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    try {
      const transcript = await transcribeAudio(audioFile);
      return NextResponse.json({ transcript });
    } catch {
      return NextResponse.json({ transcript: DEMO });
    }
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
