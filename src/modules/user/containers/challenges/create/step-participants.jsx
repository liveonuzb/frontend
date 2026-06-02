import React from "react";
import { CheckCircle2Icon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import FriendsPickerDrawer from "../friends-picker-drawer.jsx";
import { getMetricMeta } from "../challenge-utils.js";
import { StepSection } from "./form-fields.jsx";

import filter from "lodash/filter";
import map from "lodash/map";
import split from "lodash/split";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";

const getInitials = (name) => {
  const parts = split(trim(String(name ?? "")), /\s+/);
  if (parts.length >= 2) return toUpper((parts[0][0] + parts[1][0]));
  return toUpper(String(name ?? "?").slice(0, 2));
};

const StepParticipants = ({ form, setForm }) => {
  const [friendsOpen, setFriendsOpen] = React.useState(false);
  const metric = getMetricMeta(form.metricType);

  const handleFriendsConfirm = (friends) => {
    setForm((current) => ({
      ...current,
      participants: map(friends, (friend) => friend.id),
      participantObjects: friends,
    }));
  };

  const removeParticipant = (id) => {
    setForm((current) => ({
      ...current,
      participants: filter(current.participants, (item) => item !== id),
      participantObjects: filter(current.participantObjects, (item) => item.id !== id),
    }));
  };

  return (
    <StepSection
      title="Ishtirokchilar va tasdiqlash"
      description="Do'stlaringizni taklif qiling va yaratishdan oldin tekshiring."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-bold">Do'stlar</label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFriendsOpen(true)}
          >
            <PlusIcon className="mr-2 size-4" />
            Taklif qilish
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {map(form.participantObjects, (friend) => (
            <div key={friend.id} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                  {getInitials(friend.name)}
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(friend.id)}
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
              <span className="max-w-[56px] truncate text-xs text-muted-foreground">
                {split(String(friend.name ?? ""), " ")[0]}
              </span>
            </div>
          ))}
          {!form.participantObjects.length ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Hozircha do'st tanlanmadi. Keyinroq detail sahifadan ham taklif qilishingiz mumkin.
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          setForm((current) => ({
            ...current,
            rulesAccepted: !current.rulesAccepted,
          }))
        }
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all",
          form.rulesAccepted
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-border bg-muted/20 hover:bg-muted/30",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full transition-all",
            form.rulesAccepted
              ? "bg-emerald-500 text-white"
              : "border-2 border-border",
          )}
        >
          {form.rulesAccepted ? <CheckCircle2Icon className="size-4" /> : null}
        </span>
        <span className="text-sm font-bold">
          Chellenj qoidalarini qabul qilaman
        </span>
      </button>
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">{form.title || "Yangi chellenj"}</p>
          <p className="text-sm text-muted-foreground">
            {toNumber(form.metricTarget || 0).toLocaleString()} {metric.shortUnit} ·{" "}
            {form.durationDays || "custom"} kun
          </p>
        </CardContent>
      </Card>
      <FriendsPickerDrawer
        open={friendsOpen}
        onOpenChange={setFriendsOpen}
        selectedIds={form.participants}
        onConfirm={handleFriendsConfirm}
      />
    </StepSection>
  );
};

export default StepParticipants;
