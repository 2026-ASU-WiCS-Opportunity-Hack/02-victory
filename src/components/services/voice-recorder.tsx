"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, CheckCircle } from "lucide-react";
import type { StructuredNote } from "@/types";

interface VoiceRecorderProps {
  onStructuredNote: (data: StructuredNote) => void;
  serviceTypes: string[];
  onTranscript?: (text: string) => void;
}

export function VoiceRecorder({
  onStructuredNote,
  serviceTypes,
  onTranscript,
}: VoiceRecorderProps) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "transcribing" | "structuring" | "done"
  >("idle");
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      setStatus("recording");
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setStatus("transcribing");
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const transcribeRes = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });
      const transcribeJson = await transcribeRes.json();
      if (!transcribeRes.ok) throw new Error(transcribeJson.error ?? "Transcribe failed");
      const text = transcribeJson.transcript as string;
      setTranscript(text);
      onTranscript?.(text);

      setStatus("structuring");
      const structureRes = await fetch("/api/ai/structure-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, serviceTypes }),
      });
      const structured = await structureRes.json();
      if (!structureRes.ok) throw new Error(structured.error ?? "Structure failed");

      setStatus("done");
      onStructuredNote(structured as StructuredNote);
    } catch (e) {
      console.error(e);
      setStatus("idle");
      alert("Processing failed. Please try again.");
    }
  };

  const statusMessages: Record<
    "idle" | "recording" | "transcribing" | "structuring" | "done",
    string | null
  > = {
    idle: null,
    recording: "Recording… speak now",
    transcribing: "Transcribing with Whisper…",
    structuring: "AI is structuring your notes…",
    done: "Notes structured successfully.",
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-muted/40 to-primary/5 p-4 ring-1 ring-foreground/5">
      <p className="mb-3 text-sm font-medium text-foreground">Voice case notes</p>
      <div className="flex flex-wrap items-center gap-3">
        {status === "idle" && (
          <Button type="button" onClick={startRecording} variant="outline">
            <Mic className="mr-2 h-4 w-4" />
            Record case notes
          </Button>
        )}

        {status === "recording" && (
          <Button type="button" onClick={stopRecording} variant="destructive">
            <Square className="mr-2 h-4 w-4" />
            Stop recording
          </Button>
        )}

        {(status === "transcribing" || status === "structuring") && (
          <Button type="button" disabled variant="outline">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </Button>
        )}

        {status === "done" && (
          <Button
            type="button"
            onClick={() => {
              setStatus("idle");
              setTranscript("");
            }}
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
            Record another
          </Button>
        )}

        {statusMessages[status] ? (
          <span
            className={`text-sm ${
              status === "recording"
                ? "animate-pulse text-red-600"
                : status === "done"
                  ? "text-emerald-700"
                  : "text-muted-foreground"
            }`}
          >
            {status === "recording" ? "● " : null}
            {statusMessages[status]}
          </span>
        ) : null}
      </div>

      {transcript ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Transcript: </span>
          {transcript}
        </div>
      ) : null}
    </div>
  );
}
