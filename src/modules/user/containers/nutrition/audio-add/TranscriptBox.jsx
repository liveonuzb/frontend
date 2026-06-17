import React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUDIO_ADD_STATES } from "./audio-add-types.js";

const TranscriptBox = ({ audioState, transcriptState, error }) => {
  const transcript = (
    transcriptState.finalText ||
    transcriptState.partialText ||
    ""
  ).trim();
  const isAnalyzing = audioState === AUDIO_ADD_STATES.analyzing;
  const showPlaceholder = !transcript && !error && !isAnalyzing;

  return (
    <div
      className={cn(
        "min-h-28 rounded-3xl bg-emerald-50/55 p-4 text-left ring-1 ring-emerald-100",
        error && "bg-red-50/80 ring-red-100",
        isAnalyzing && "overflow-hidden",
      )}
    >
      {isAnalyzing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Loader2Icon className="size-4 animate-spin" />
            Tahlil qilinmoqda
          </div>
          <div className="h-3 w-full animate-pulse rounded-full bg-emerald-100" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-emerald-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-emerald-100" />
        </div>
      ) : null}

      {!isAnalyzing && transcript ? (
        <p className="whitespace-pre-wrap text-[15px] leading-6 text-slate-900">
          {transcript}
        </p>
      ) : null}

      {showPlaceholder ? (
        <p className="text-[15px] leading-6 text-slate-500">
          Transkript shu yerda real vaqtda ko'rinadi
        </p>
      ) : null}

      {!isAnalyzing && error ? (
        <p className="text-[15px] leading-6 text-red-700">{error}</p>
      ) : null}
    </div>
  );
};

export default TranscriptBox;
