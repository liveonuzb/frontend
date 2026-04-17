import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { get, map } from "lodash";
import { getMoodMeta, MOOD_OPTIONS } from "@/lib/mood";

export default function MoodWidget({
  selectedMood,
  onSelectMood,
  isSaving = false,
  readOnly = false,
}) {
  const selectedMoodMeta = getMoodMeta(selectedMood);

  return (
    <Card className={"py-6"}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="size-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-base">
            😊
          </span>
          Kayfiyat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4 gap-3">
        <div className="flex gap-1.5">
          {map(MOOD_OPTIONS, (m) => (
            <button
              key={get(m, "value")}
              type="button"
              disabled={isSaving || readOnly}
              onClick={() => {
                if (isSaving || readOnly) return;
                onSelectMood(get(m, "value"));
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-60",
                selectedMood === get(m, "value")
                  ? "bg-primary/15 ring-1 ring-primary scale-105"
                  : "hover:bg-muted/60 bg-muted/30",
              )}
            >
              <span className="text-xl">{get(m, "emoji")}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          {isSaving
            ? "Saqlanmoqda..."
            : readOnly
              ? (selectedMoodMeta?.label ?? "Kayfiyat kiritilmagan")
            : (selectedMoodMeta?.label ?? "Bugungi kayfiyat?")}
        </p>
      </CardContent>
    </Card>
  );
}
