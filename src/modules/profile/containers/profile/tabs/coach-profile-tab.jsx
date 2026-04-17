import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetQuery, usePutQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";

// ─────────────── Static config ─────────────────────────────────────────────

const getSpecializations = (t) => [
  { value: "weight-loss", label: t("profile.coach.specializations.weightLoss"), emoji: "🏃" },
  { value: "muscle-gain", label: t("profile.coach.specializations.muscleGain"), emoji: "💪" },
  { value: "nutrition", label: t("profile.coach.specializations.nutrition"), emoji: "🥗" },
  { value: "yoga", label: t("profile.coach.specializations.yoga"), emoji: "🧘" },
  { value: "cardio", label: t("profile.coach.specializations.cardio"), emoji: "❤️" },
  { value: "strength", label: t("profile.coach.specializations.strength"), emoji: "🏋️" },
  { value: "rehab", label: t("profile.coach.specializations.rehab"), emoji: "🩺" },
  { value: "general", label: t("profile.coach.specializations.general"), emoji: "⭐" },
];

const getExperienceOptions = (t) => [
  { value: "beginner", label: t("profile.coach.experience.beginner") },
  { value: "intermediate", label: t("profile.coach.experience.intermediate") },
  { value: "advanced", label: t("profile.coach.experience.advanced") },
  { value: "expert", label: t("profile.coach.experience.expert") },
];

const getWorkModeOptions = (t) => [
  { value: "online", label: `🌐 ${t("profile.coach.workMode.online")}` },
  { value: "offline", label: `🏢 ${t("profile.coach.workMode.offline")}` },
  { value: "hybrid", label: `⚡️ ${t("profile.coach.workMode.hybrid")}` },
];

const PRICE_MIN = 0;
const PRICE_MAX = 5_000_000;
const PRICE_STEP = 50_000;

const formatPrice = (val, t) =>
  val === 0 || val === "" || val === null
    ? t("profile.coach.negotiable")
    : `${Number(val).toLocaleString("uz-UZ")} ${t("profile.coach.currency")}`;

// ─────────────── Skeleton loader ──────────────────────────────────────────

const FormSkeleton = () => (
  <div className="flex flex-col gap-4 px-1 py-4">
    <Skeleton className="h-5 w-36 rounded-lg" />
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-2xl" />
    ))}
    <Skeleton className="h-28 w-full rounded-2xl" />
    <Skeleton className="h-12 w-full rounded-2xl" />
    <Skeleton className="h-12 w-full rounded-2xl" />
    <Skeleton className="h-12 w-full rounded-2xl" />
  </div>
);

// ─────────────── Main component ────────────────────────────────────────────

export const CoachProfileTab = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const initializeUser = useAuthStore((state) => state.initializeUser);
  const user = useAuthStore((state) => state.user);

  // GET /onboarding/status  →  { coachOnboarding: { ... } }
  const { data: rawData, isLoading } = useGetQuery({
    url: "/user/onboarding/status",
    queryProps: {
      queryKey: ["onboarding", "coach-profile"],
      staleTime: 0,
    },
  });

  // axios wraps response as { data: { ... } }
  const coachData = React.useMemo(
    () =>
      get(rawData, "data.coachOnboarding") ??
      get(rawData, "coachOnboarding") ??
      null,
    [rawData],
  );

  // Derived initial values — re-computed whenever coachData arrives
  const initial = React.useMemo(
    () => ({
      specializations: Array.isArray(coachData?.specializations)
        ? coachData.specializations
        : [],
      experience: coachData?.experience ?? "",
      coachBio: coachData?.bio ?? "",
      coachWorkMode: coachData?.workMode ?? "",
      coachMonthlyPrice:
        coachData?.monthlyPrice != null ? String(coachData.monthlyPrice) : "",
      coachCity: coachData?.city ?? "",
      coachWorkplace: coachData?.workplace ?? "",
    }),
    [coachData],
  );

  // Local form state — seeded from `initial` once data loads (key trick: remount)
  const [specializations, setSpecializations] = React.useState(
    initial.specializations,
  );
  const [experience, setExperience] = React.useState(initial.experience);
  const [coachBio, setCoachBio] = React.useState(initial.coachBio);
  const [coachWorkMode, setCoachWorkMode] = React.useState(
    initial.coachWorkMode,
  );
  const [coachMonthlyPrice, setCoachMonthlyPrice] = React.useState(
    initial.coachMonthlyPrice,
  );
  const [coachCity, setCoachCity] = React.useState(initial.coachCity);
  const [coachWorkplace, setCoachWorkplace] = React.useState(
    initial.coachWorkplace,
  );

  // Sync form when real data arrives (runs once after loading finishes)
  const hasData = coachData !== null;
  React.useEffect(() => {
    if (!hasData) return;
    setSpecializations(initial.specializations);
    setExperience(initial.experience);
    setCoachBio(initial.coachBio);
    setCoachWorkMode(initial.coachWorkMode);
    setCoachMonthlyPrice(initial.coachMonthlyPrice);
    setCoachCity(initial.coachCity);
    setCoachWorkplace(initial.coachWorkplace);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData]);

  const sliderValue =
    coachMonthlyPrice !== "" && !isNaN(Number(coachMonthlyPrice))
      ? Number(coachMonthlyPrice)
      : 0;

  const toggleSpec = (value) =>
    setSpecializations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const { mutateAsync: saveProfile, isPending } = usePutQuery({
    mutationProps: {
      onSuccess: async (resData) => {
        const updatedUser = resData?.data ?? resData;
        if (updatedUser && user) {
          initializeUser({ ...user, ...updatedUser });
        }
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        await queryClient.invalidateQueries({
          queryKey: ["onboarding", "coach-profile"],
        });
        toast.success(t("profile.coach.saveSuccess"));
      },
      onError: (error) => {
        const msg = error?.response?.data?.message;
        toast.error(
          Array.isArray(msg) ? msg.join(", ") : (msg ?? t("profile.general.error")),
        );
      },
    },
  });

  const handleSave = async () => {
    const monthlyPriceRaw = String(coachMonthlyPrice ?? "").trim();
    const normalizedPrice =
      monthlyPriceRaw === "" || monthlyPriceRaw === "0"
        ? null
        : Math.round(Number(monthlyPriceRaw));

    await saveProfile({
      url: "/coach/onboarding/coach",
      attributes: {
        specializations,
        experience: experience || undefined,
        bio: coachBio,
        workMode: coachWorkMode || undefined,
        monthlyPrice: normalizedPrice,
        city: coachCity,
        workplace: coachWorkplace,
      },
    });
  };

  const isFormValid =
    specializations.length > 0 &&
    coachBio.trim().length >= 10 &&
    coachCity.trim().length > 1 &&
    coachWorkMode.trim().length > 0 &&
    coachWorkplace.trim().length > 1;

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="flex flex-col gap-6 px-1 py-4 pb-20">
      {/* SPECIALIZATIONS */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">{t("profile.coach.specializations.title")}</p>
        <div className="flex flex-col gap-2">
          {getSpecializations(t).map((spec) => {
            const selected = specializations.includes(spec.value);
            return (
              <button
                key={spec.value}
                type="button"
                onClick={() => toggleSpec(spec.value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                <span className="text-xl shrink-0">{spec.emoji}</span>
                <span className="text-sm font-medium flex-1">{spec.label}</span>
                <div
                  className={cn(
                    "size-4 rounded-full border-2 shrink-0 transition-all",
                    selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* EXPERIENCE */}
      <Field>
        <FieldLabel className="font-semibold">{t("profile.coach.experience.title")}</FieldLabel>
        <ToggleGroup
          type="single"
          value={experience}
          onValueChange={(v) => v && setExperience(v)}
          className="grid grid-cols-2 gap-2"
          spacing={0}
        >
          {getExperienceOptions(t).map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="h-11 rounded-xl border border-border text-sm font-medium data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      {/* BIO */}
      <Field>
        <FieldLabel className="font-semibold">{t("profile.user.bio")}</FieldLabel>
        <Textarea
          rows={5}
          value={coachBio}
          onChange={(e) => setCoachBio(e.target.value)}
          placeholder={t("profile.coach.bioPlaceholder")}
          className="rounded-2xl resize-none"
        />
        <p className="text-xs text-muted-foreground text-right mt-1">
          {coachBio.trim().length}/500
        </p>
      </Field>

      {/* WORK MODE */}
      <Field>
        <FieldLabel className="font-semibold">{t("profile.coach.workMode.title")}</FieldLabel>
        <ToggleGroup
          type="single"
          value={coachWorkMode}
          onValueChange={(v) => v && setCoachWorkMode(v)}
          className="w-full gap-2"
          spacing={0}
        >
          {getWorkModeOptions(t).map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      {/* PRICE */}
      <Field>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel className="font-semibold">{t("profile.coach.priceTitle")}</FieldLabel>
          <span className="text-sm font-semibold text-primary">
            {formatPrice(sliderValue, t)}
          </span>
        </div>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={sliderValue}
          onChange={(e) =>
            setCoachMonthlyPrice(e.target.value === "0" ? "" : e.target.value)
          }
          className="w-full h-2 appearance-none rounded-full bg-muted cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">{t("profile.coach.negotiable")}</span>
          <span className="text-xs text-muted-foreground">5 000 000</span>
        </div>
      </Field>

      {/* CITY */}
      <Field>
        <FieldLabel className="font-semibold">{t("profile.coach.city")}</FieldLabel>
        <Input
          value={coachCity}
          onChange={(e) => setCoachCity(e.target.value)}
          placeholder={t("profile.coach.cityPlaceholder")}
          className="rounded-xl"
        />
      </Field>

      {/* WORKPLACE */}
      <Field>
        <FieldLabel className="font-semibold">{t("profile.coach.workplace")}</FieldLabel>
        <Input
          value={coachWorkplace}
          onChange={(e) => setCoachWorkplace(e.target.value)}
          placeholder="FitLife Studio"
          className="rounded-xl"
        />
      </Field>

      {/* SAVE */}
      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={!isFormValid || isPending}
        onClick={handleSave}
      >
        {isPending ? (
          <Loader2Icon className="mr-2 size-4 animate-spin" />
        ) : (
          <SaveIcon className="mr-2 size-4" />
        )}
        {isPending ? t("profile.general.saving") : t("profile.general.save")}
      </Button>
    </div>
  );
};
