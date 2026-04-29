import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { LabeledNumberField, StepSection } from "./form-fields.jsx";

const REWARD_MODES = [
  { value: "FIXED_XP", label: "Belgilangan XP" },
  { value: "PERCENT_OF_POOL", label: "Havuz foizi" },
  { value: "PLACE_XP", label: "O'rin bo'yicha" },
];

const StepReward = ({ form, setForm }) => {
  const updatePlaceReward = (index, value) => {
    setForm((current) => ({
      ...current,
      placeRewards: current.placeRewards.slice(0, 3).map((item, itemIndex) =>
        itemIndex === index ? { ...item, value } : item,
      ),
    }));
  };

  const activeMode = REWARD_MODES.find((item) => item.value === form.rewardMode);
  const placeRewards = form.placeRewards.slice(0, 3);
  const placeRewardTotal = placeRewards.reduce(
    (sum, reward) => sum + (Number(reward.value) || 0),
    0,
  );
  const isPlaceRewardOrderValid =
    placeRewards.length === 3 &&
    Number(placeRewards[0]?.value) > Number(placeRewards[1]?.value) &&
    Number(placeRewards[1]?.value) > Number(placeRewards[2]?.value);
  const poolPreview =
    form.rewardMode === "PERCENT_OF_POOL"
      ? Math.round((form.joinFeeXp * Math.max(1, form.maxParticipants || 1) * form.rewardPercent) / 100)
      : null;

  return (
    <StepSection
      title="Mukofot va kirish"
      description="XP mukofoti, kirish narxi va ishtirokchilar limitini sozlang."
    >
      <div className="space-y-2">
        <label className="text-sm font-bold">Mukofot rejimi</label>
        <ToggleGroup
          type="single"
          value={form.rewardMode}
          onValueChange={(value) => {
            if (value) setForm((current) => ({ ...current, rewardMode: value }));
          }}
          className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
          spacing={2}
        >
          {REWARD_MODES.map((mode) => (
            <ToggleGroupItem
              key={mode.value}
              value={mode.value}
              className="h-auto rounded-md border px-3 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
            >
              <span className="flex text-center">
                <span className="text-xs font-medium">{mode.label}</span>
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {form.rewardMode === "FIXED_XP" ? (
        <LabeledNumberField
          label="Mukofot XP"
          hint="Har bir yakunlagan ishtirokchi oladigan XP."
          value={form.rewardXp}
          onChange={(rewardXp) => setForm((current) => ({ ...current, rewardXp }))}
          min={10}
          max={10000}
          step={10}
        />
      ) : null}

      {form.rewardMode === "PERCENT_OF_POOL" ? (
        <LabeledNumberField
          label="Havuz foizi"
          hint="Barcha kirish to'lovlaridan g'olibga beriladigan ulush."
          value={form.rewardPercent}
          onChange={(rewardPercent) =>
            setForm((current) => ({ ...current, rewardPercent }))
          }
          min={5}
          max={100}
          step={5}
        />
      ) : null}

      {form.rewardMode === "PLACE_XP" ? (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">O'rin bo'yicha foizlar</p>
              <p className="text-xs text-muted-foreground">
                Umumiy XP havuzi 3 o'ringa foiz sifatida bo'linadi.
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                placeRewardTotal === 100 && isPlaceRewardOrderValid
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              Jami {placeRewardTotal}%
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {placeRewards.map((reward, index) => (
              <LabeledNumberField
                key={reward.place}
                label={`${reward.place}-o'rin`}
                hint={
                  index === 0
                    ? "Eng katta ulush"
                    : index === 1
                      ? "Ikkinchi ulush"
                      : "Uchinchi ulush"
                }
                value={reward.value}
                onChange={(value) => updatePlaceReward(index, value)}
                min={1}
                max={100}
                step={5}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Shart: 1-o'rin 2-o'rindan katta, 2-o'rin 3-o'rindan katta va jami 100%.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledNumberField
          label="Kirish narxi (XP)"
          hint="0 = bepul"
          value={form.joinFeeXp}
          onChange={(joinFeeXp) =>
            setForm((current) => ({ ...current, joinFeeXp }))
          }
          min={0}
          max={5000}
          step={10}
        />
        <LabeledNumberField
          label="Ishtirokchilar limiti"
          hint="0 = cheksiz"
          value={form.maxParticipants}
          onChange={(maxParticipants) =>
            setForm((current) => ({ ...current, maxParticipants }))
          }
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div className={cn("rounded-lg border bg-card p-4")}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Preview
        </p>
        <p className="mt-2 text-sm font-bold">
          {activeMode?.label}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {form.rewardMode === "FIXED_XP"
            ? `Yakunlagan ishtirokchi ${form.rewardXp} XP oladi.`
            : form.rewardMode === "PERCENT_OF_POOL"
              ? `Taxminiy havuz mukofoti: ${poolPreview || 0} XP.`
              : `XP havuzi ${placeRewards.map((reward) => `${reward.place}-o'rin ${reward.value}%`).join(", ")} bo'yicha bo'linadi.`}
        </p>
      </div>
    </StepSection>
  );
};

export default StepReward;
