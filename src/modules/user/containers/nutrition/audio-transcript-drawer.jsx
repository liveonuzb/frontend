import React from "react";
import { clamp, get, map, toPairs } from "lodash";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea.jsx";
import { MicIcon, Trash2Icon } from "lucide-react";

const MEAL_TYPE_LABELS = {
  breakfast: "Nonushta",
  lunch: "Tushlik",
  dinner: "Kechki ovqat",
  snack: "Snack",
};

const MEAL_TYPE_OPTIONS = map(toPairs(MEAL_TYPE_LABELS), ([value, label]) => ({
  value,
  label,
}));

const formatHistoryTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("uz-UZ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLoggedTimeHint = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getConfidenceMeta = (value) => {
  const normalized = clamp(Number(value) || 0, 0, 1);

  if (normalized >= 0.85) {
    return {
      label: "Yuqori ishonch",
      hint: "Transcript aniq chiqdi, odatda qo'shimcha tahrir kerak bo'lmaydi.",
      tone: "text-emerald-600",
      progressClassName: "bg-emerald-500/15",
    };
  }

  if (normalized >= 0.65) {
    return {
      label: "O'rtacha ishonch",
      hint: "Asosiy matn to'g'ri, lekin porsiya va nomlarni bir ko'zdan kechiring.",
      tone: "text-amber-600",
      progressClassName: "bg-amber-500/15",
    };
  }

  return {
    label: "Past ishonch",
    hint: "Yuborishdan oldin transcriptni qo'lda tahrir qilish tavsiya etiladi.",
    tone: "text-destructive",
    progressClassName: "bg-destructive/15",
  };
};

const AudioTranscriptDrawer = ({
  value,
  onChange,
  onClose,
  onContinue,
  isSubmitting = false,
  suggestedMealType = null,
  suggestedLoggedAt = null,
  transcriptConfidence = null,
  suggestedDateLabel = null,
  transcriptSegments = [],
  transcriptHistory = [],
  onAppendAudio,
  onMealTypeChange,
  onRemoveSegment,
  onUseHistory,
  onRemoveHistoryItem,
  onClearHistory,
}) => {
  const hasText = Boolean(value.trim());
  const confidenceMeta =
    typeof transcriptConfidence === "number"
      ? getConfidenceMeta(transcriptConfidence)
      : null;
  const confidencePercentage =
    typeof transcriptConfidence === "number"
      ? Math.round(transcriptConfidence * 100)
      : null;

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Transcriptni tekshirish</DrawerTitle>
        <DrawerDescription>
          Audio matnga aylantirildi. Xohlasangiz tahrir qiling va keyin
          yuboring.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="space-y-4">
        <div className="rounded-3xl border bg-muted/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Audio natijasi</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Transcript yuborishdan oldin ovqat matnini tekshirib chiqing.
              </p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-primary">
              {get(MEAL_TYPE_LABELS, suggestedMealType, "Meal type")}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Ovqat turini tekshiring
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_OPTIONS.map((option) => {
                const isActive = option.value === suggestedMealType;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onMealTypeChange?.(option.value)}
                    className={
                      isActive
                        ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                        : "rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {suggestedLoggedAt ? (
            <div className="mt-4 rounded-2xl border px-3 py-3">
              <div className="text-xs font-medium text-muted-foreground">
                Aniqlangan vaqt
              </div>
              <div className="mt-1 text-sm font-semibold">
                {formatLoggedTimeHint(suggestedLoggedAt)}
              </div>
            </div>
          ) : null}

          {suggestedDateLabel ? (
            <div className="mt-4 rounded-2xl border px-3 py-3">
              <div className="text-xs font-medium text-muted-foreground">
                Aniqlangan kun
              </div>
              <div className="mt-1 text-sm font-semibold capitalize">
                {suggestedDateLabel}
              </div>
            </div>
          ) : null}

          {confidenceMeta && confidencePercentage != null ? (
            <div className="mt-4 rounded-2xl border px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Audio parse ishonchi
                  </div>
                  <div
                    className={`mt-1 text-sm font-semibold ${confidenceMeta.tone}`}
                  >
                    {confidenceMeta.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums">
                    {confidencePercentage}%
                  </div>
                </div>
              </div>
              <Progress
                value={confidencePercentage}
                className={`mt-3 h-2 ${confidenceMeta.progressClassName}`}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {confidenceMeta.hint}
              </p>
            </div>
          ) : null}
        </div>

        <Textarea
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Masalan: 2 ta tuxum va 1 ta banan"
          className="min-h-[180px] resize-none rounded-2xl"
        />

        {transcriptSegments.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Audio segmentlar</p>
              <span className="text-xs text-muted-foreground">
                {transcriptSegments.length} ta yozuv
              </span>
            </div>
            <div className="space-y-2">
              {transcriptSegments.map((segment, index) => (
                <div
                  key={`${segment}-${index}`}
                  className="rounded-2xl border px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {index + 1}-segment
                      </div>
                      <p className="mt-1 text-sm">{segment}</p>
                    </div>
                    {onRemoveSegment ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => onRemoveSegment(index)}
                        aria-label={`${index + 1}-segmentni o'chirish`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {transcriptHistory.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Oxirgi audio yozuvlar</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {transcriptHistory.length} ta tarix
                </span>
                {onClearHistory ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={onClearHistory}
                  >
                    Tozalash
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              {transcriptHistory.map((item, index) => (
                <div
                  key={`${item.transcript}-${index}`}
                  className="rounded-2xl border px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onUseHistory?.(item)}
                      className="min-w-0 flex-1 text-left transition-colors hover:text-primary"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span>{index + 1}-tarix</span>
                        {formatHistoryTime(item.createdAt) ? (
                          <span>{formatHistoryTime(item.createdAt)}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm">
                        {item.transcript}
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {get(MEAL_TYPE_LABELS, item.mealType, "Meal")}
                      </span>
                      {item.loggedAt ? (
                        <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {formatLoggedTimeHint(item.loggedAt)}
                        </span>
                      ) : null}
                      {onRemoveHistoryItem ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveHistoryItem(item.id)}
                          aria-label={`${index + 1}-tarixni o'chirish`}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Yuborgandan keyin AI matnni ovqatlarga ajratadi, siz porsiyani
          tekshirasiz.
        </p>
      </DrawerBody>

      <DrawerFooter>
        {onAppendAudio ? (
          <Button
            variant="outline"
            onClick={onAppendAudio}
            disabled={isSubmitting}
          >
            <MicIcon className="size-4" />
            Yana audio qo'shish
          </Button>
        ) : null}
        <Button onClick={onContinue} disabled={!hasText || isSubmitting}>
          Yuborish
        </Button>
        <Button variant="outline" onClick={onClose}>
          Bekor qilish
        </Button>
      </DrawerFooter>
    </>
  );
};

export default AudioTranscriptDrawer;
