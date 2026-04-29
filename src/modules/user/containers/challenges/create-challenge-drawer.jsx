import React from "react";
import { addDays } from "date-fns";
import { toast } from "sonner";
import {
  MinusIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { api } from "@/hooks/api/use-api";
import { useChallengeStore } from "@/store/challenges-store";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import FriendsPickerDrawer from "./friends-picker-drawer";

// ── constants ────────────────────────────────────────────────────────────────

const METRIC_OPTIONS = [
  {
    value: "STEPS",
    label: "Qadam o'lchagich",
    unit: "qadam/kuniga",
    default: 10000,
    step: 1000,
    min: 1000,
    max: 100000,
  },
  {
    value: "WORKOUT_MINUTES",
    label: "Mashq vaqti",
    unit: "daqiqa/kuniga",
    default: 30,
    step: 5,
    min: 5,
    max: 300,
  },
  {
    value: "BURNED_CALORIES",
    label: "Kaloriya yoqish",
    unit: "kcal/kuniga",
    default: 500,
    step: 50,
    min: 50,
    max: 5000,
  },
  {
    value: "SLEEP_HOURS",
    label: "Uyqu",
    unit: "soat/kuniga",
    default: 8,
    step: 1,
    min: 1,
    max: 12,
  },
];

const PRESET_COVERS = [
  { id: "run", emoji: "🏃‍♂️", from: "from-blue-500", to: "to-indigo-600" },
  { id: "lift", emoji: "🏋️‍♂️", from: "from-orange-500", to: "to-red-600" },
  { id: "bike", emoji: "🚴‍♂️", from: "from-green-500", to: "to-emerald-600" },
  { id: "yoga", emoji: "🧘‍♂️", from: "from-purple-500", to: "to-violet-600" },
  { id: "swim", emoji: "🏊‍♂️", from: "from-cyan-500", to: "to-sky-600" },
  { id: "zap", emoji: "⚡", from: "from-yellow-400", to: "to-amber-500" },
];

const DURATION_OPTIONS = [7, 14, 30];

const getInitials = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name ?? "?").slice(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];
const getAvatarColor = (str) => {
  const code = String(str ?? "").charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

// ── component ─────────────────────────────────────────────────────────────────

export default function CreateChallengeDrawer({ open, onOpenChange }) {
  const { fetchChallenges } = useChallengeStore();

  // form state
  const [metricType, setMetricType] = React.useState("STEPS");
  const [target, setTarget] = React.useState(10000);
  const [selectedCover, setSelectedCover] = React.useState("run");
  const [duration, setDuration] = React.useState(7);
  const [participants, setParticipants] = React.useState([]); // ids
  const [participantObjects, setParticipantObjects] = React.useState([]);
  const [rulesAccepted, setRulesAccepted] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [friendsPickerOpen, setFriendsPickerOpen] = React.useState(false);

  const selectedMetric =
    METRIC_OPTIONS.find((m) => m.value === metricType) ?? METRIC_OPTIONS[0];

  const reset = () => {
    setMetricType("STEPS");
    setTarget(10000);
    setSelectedCover("run");
    setDuration(7);
    setParticipants([]);
    setParticipantObjects([]);
    setRulesAccepted(false);
    setIsCreating(false);
  };

  const handleMetricChange = (value) => {
    const m = METRIC_OPTIONS.find((opt) => opt.value === value);
    setMetricType(value);
    setTarget(m?.default ?? 10000);
  };

  const decrement = () =>
    setTarget((prev) =>
      Math.max(selectedMetric.min, prev - selectedMetric.step),
    );

  const increment = () =>
    setTarget((prev) =>
      Math.min(selectedMetric.max, prev + selectedMetric.step),
    );

  const handleFriendsConfirm = (friends) => {
    setParticipants(friends.map((f) => f.id));
    setParticipantObjects(friends);
  };

  const removeParticipant = (id) => {
    setParticipants((prev) => prev.filter((p) => p !== id));
    setParticipantObjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreate = async () => {
    if (!rulesAccepted || isCreating) return;
    setIsCreating(true);

    const today = new Date();
    const payload = {
      title: `${target.toLocaleString()} ${selectedMetric.unit} Challenge`,
      metricType,
      metricDetails: { type: metricType, target },
      startDate: today.toISOString(),
      endDate: addDays(today, duration).toISOString(),
      type: "CUSTOM",
      joinFeeXp: 0,
    };

    try {
      const response = await api.post("/challenges", payload);
      const challenge = response?.data;

      if (participants.length > 0 && challenge?.id) {
        try {
          await api.post(`/challenges/${challenge.id}/invite`, {
            userIds: participants,
          });
        } catch {
          // invite errors are non-fatal
        }
      }

      toast.success("Chellenj yaratildi!");
      await fetchChallenges({}, { silent: true });
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Chellenj yaratib bo'lmadi");
      setIsCreating(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
          {/* Header */}
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-black uppercase tracking-widest">
                Yangi chellenj
              </DrawerTitle>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/70"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-6 pb-4">
            {/* ── Metric type ─── */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Turini tanlang
              </h3>
              <div className="flex flex-col gap-1.5 rounded-2xl border divide-y divide-border/60 overflow-hidden">
                {METRIC_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMetricChange(option.value)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 text-left transition-colors",
                      metricType === option.value
                        ? "bg-muted font-semibold"
                        : "bg-card text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {option.unit}
                      {metricType === option.value && (
                        <CheckIcon className="size-3.5 text-primary" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Target counter ─── */}
            <div className="flex items-center justify-between gap-4 px-2">
              <button
                type="button"
                onClick={decrement}
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/70 active:scale-95"
              >
                <MinusIcon className="size-6" />
              </button>

              <div className="flex-1 text-center">
                <p className="text-5xl font-black tabular-nums tracking-tight">
                  {target.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedMetric.unit}
                </p>
              </div>

              <button
                type="button"
                onClick={increment}
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
              >
                <PlusIcon className="size-6" />
              </button>
            </div>

            {/* ── Duration ─── */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Davomiyligi
              </h3>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 rounded-2xl border py-3 text-sm font-bold transition-all",
                      duration === d
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {d} kun
                  </button>
                ))}
              </div>
            </div>

            {/* ── Cover / Rasm ─── */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Rasm
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_COVERS.map((cover) => {
                  const isSelected = selectedCover === cover.id;
                  return (
                    <button
                      key={cover.id}
                      type="button"
                      onClick={() => setSelectedCover(cover.id)}
                      className={cn(
                        "relative size-24 shrink-0 overflow-hidden rounded-2xl transition-all active:scale-95",
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "opacity-70 hover:opacity-90",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-full items-center justify-center bg-gradient-to-br text-4xl",
                          cover.from,
                          cover.to,
                        )}
                      >
                        {cover.emoji}
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary shadow">
                          <CheckIcon className="size-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Participants ─── */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Ishtirokchilar
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {participantObjects.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full text-sm font-black text-white",
                          getAvatarColor(friend.name),
                        )}
                      >
                        {getInitials(friend.name)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipant(friend.id)}
                        className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </div>
                    <span className="max-w-[52px] truncate text-center text-[10px] text-muted-foreground">
                      {String(friend.name ?? "").split(" ")[0]}
                    </span>
                  </div>
                ))}

                {/* Add button */}
                <button
                  type="button"
                  onClick={() => setFriendsPickerOpen(true)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95">
                    <PlusIcon className="size-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Qo&apos;shish
                  </span>
                </button>
              </div>
            </div>

            {/* ── Rules checkbox ─── */}
            <button
              type="button"
              onClick={() => setRulesAccepted((p) => !p)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                rulesAccepted
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-border bg-muted/20 hover:bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full transition-all",
                  rulesAccepted
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-border",
                )}
              >
                {rulesAccepted && <CheckCircle2Icon className="size-4" />}
              </div>
              <span className="text-sm font-medium">
                Chellenj yaratish qoidalari
              </span>
            </button>
          </DrawerBody>

          <DrawerFooter>
            <Button
              onClick={handleCreate}
              disabled={!rulesAccepted || isCreating}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-base font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-green-500 disabled:opacity-50"
            >
              {isCreating ? "Yaratilmoqda..." : "CHELLENJ YARATISH"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Nested friends picker */}
      <FriendsPickerDrawer
        open={friendsPickerOpen}
        onOpenChange={setFriendsPickerOpen}
        selectedIds={participants}
        onConfirm={handleFriendsConfirm}
      />
    </>
  );
}
