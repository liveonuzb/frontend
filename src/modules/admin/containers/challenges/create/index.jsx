import React from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import {
  filter as lodashFilter,
  entries,
  fromPairs,
  get,
  sum,
  values,
} from "lodash";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ImagePlusIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import {
  CHALLENGES_QUERY_KEY,
  cleanupChallengeImage,
  resolveChallengeApiErrorMessage,
  uploadChallengeImage,
} from "../api.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const METRIC_TYPE_META = {
  STEPS: { label: "Qadam", unit: "qadam" },
  WORKOUT_MINUTES: { label: "Mashq vaqti", unit: "daqiqa" },
  BURNED_CALORIES: { label: "Yondirilgan kaloriya", unit: "kcal" },
  SLEEP_HOURS: { label: "Uyqu", unit: "soat" },
};

const METRIC_AGGREGATION_META = {
  SUM: "Yig'indi",
  AVERAGE: "O'rtacha",
};

const REWARD_MODE_OPTIONS = [
  { value: "FIXED_XP", label: "Fixed XP" },
  { value: "PERCENT_OF_POOL", label: "Pool foizi" },
  { value: "PLACE_XP", label: "O'rinlar bo'yicha" },
];

const STEP_LABELS = ["Asosiy", "Vaqt", "Metrika", "Mukofot"];
const TOTAL_STEPS = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createEmptyForm = () => {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    translations: {},
    descriptionTranslations: {},
    status: "UPCOMING",
    startDate: format(startDate, "yyyy-MM-dd'T'HH:mm"),
    endDate: format(endDate, "yyyy-MM-dd'T'HH:mm"),
    joinFeeXp: 0,
    rewardMode: "FIXED_XP",
    rewardXp: 0,
    rewardPercent: 10,
    firstPlaceXp: 0,
    secondPlaceXp: 0,
    thirdPlaceXp: 0,
    maxParticipants: 0,
    metricType: "STEPS",
    metricAggregation: "SUM",
    metricTarget: 10000,
    imageFile: null,
    imagePreviewUrl: "",
    imageId: null,
    removeImage: false,
  };
};

const cleanTranslations = (translations = {}) =>
  fromPairs(
    lodashFilter(
      entries(translations).map(([code, value]) => [
        code,
        String(value ?? "").trim(),
      ]),
      ([code, value]) => Boolean(code) && Boolean(value),
    ),
  );

const parseNonNegativeInt = (value, fieldLabel) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} noto'g'ri kiritildi`);
  }
  return parsed;
};

const parseRewardPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    throw new Error("Mukofot foizi 0.01 - 100 oralig'ida bo'lishi kerak");
  }
  return parsed;
};

const parsePositiveFloat = (value, fieldLabel) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} 0 dan katta bo'lishi kerak`);
  }
  return parsed;
};

const parseNullablePositiveInt = (value, fieldLabel) => {
  if (!value || value === 0) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${fieldLabel} 1 yoki undan katta bo'lishi kerak`);
  }
  return parsed;
};

const buildPlaceRewards = (formData) => {
  const placeValues = [
    ["1", formData.firstPlaceXp],
    ["2", formData.secondPlaceXp],
    ["3", formData.thirdPlaceXp],
  ];
  const rewards = fromPairs(
    lodashFilter(
      placeValues,
      ([, rawValue]) => Number(rawValue) > 0,
    ).map(([place, rawValue]) => [
      place,
      parseNonNegativeInt(rawValue, `${place}-o'rin mukofoti`),
    ]),
  );
  if (!Object.keys(rewards).length) {
    throw new Error("Kamida bitta o'rin uchun qiymat kiriting");
  }
  return rewards;
};

const buildPayload = (formData, currentLanguage) => {
  const title = formData.title.trim();
  if (!title) throw new Error("Sarlavha kiritilishi shart");

  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Sanalar noto'g'ri kiritilgan");
  }
  if (endDate.getTime() <= startDate.getTime()) {
    throw new Error(
      "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak",
    );
  }

  const joinFeeXp = parseNonNegativeInt(formData.joinFeeXp, "Kirish narxi");

  let rewardXp;
  let rewardPercent;
  let placeRewards;

  if (formData.rewardMode === "FIXED_XP") {
    rewardXp = parseNonNegativeInt(formData.rewardXp, "Mukofot");
  } else if (formData.rewardMode === "PERCENT_OF_POOL") {
    rewardPercent = parseRewardPercent(formData.rewardPercent);
    if (joinFeeXp <= 0) {
      throw new Error(
        "Foizli mukofotda kirish narxi 0 dan katta bo'lishi kerak",
      );
    }
  } else {
    placeRewards = buildPlaceRewards(formData);
    if (joinFeeXp > 0) {
      const totalPercent = sum(values(placeRewards));
      if (totalPercent <= 0 || totalPercent > 100) {
        throw new Error(
          "Kirish narxi bo'lsa o'rinlar foizlari jami 0.01 - 100 oralig'ida bo'lishi kerak",
        );
      }
    }
  }

  const titleTranslations = cleanTranslations({
    ...(formData.translations || {}),
    [currentLanguage]: title,
  });
  const descriptionTranslations = cleanTranslations({
    ...(formData.descriptionTranslations || {}),
    ...(formData.description.trim()
      ? { [currentLanguage]: formData.description.trim() }
      : {}),
  });

  return {
    title,
    description: formData.description.trim() || undefined,
    translations: titleTranslations,
    descriptionTranslations,
    type: "GLOBAL",
    status: formData.status,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    joinFeeXp,
    rewardMode: formData.rewardMode,
    rewardXp,
    rewardPercent,
    placeRewards,
    metricType: formData.metricType,
    metricAggregation: formData.metricAggregation,
    metricTarget: parsePositiveFloat(
      formData.metricTarget,
      "Challenge maqsadi",
    ),
    removeImage: Boolean(formData.removeImage),
    maxParticipants: parseNullablePositiveInt(
      formData.maxParticipants,
      "Maksimal ishtirokchi",
    ),
  };
};

const validateStep = (step, formData) => {
  if (step === 0) {
    if (!formData.title.trim()) throw new Error("Sarlavha kiritilishi shart");
  } else if (step === 1) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Sanalar noto'g'ri kiritilgan");
    }
    if (end.getTime() <= start.getTime()) {
      throw new Error(
        "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak",
      );
    }
  } else if (step === 2) {
    if (!Number(formData.metricTarget) || Number(formData.metricTarget) <= 0) {
      throw new Error("Metrika maqsadi 0 dan katta bo'lishi kerak");
    }
  }
};

// ─── Main component ───────────────────────────────────────────────────────────
const CreateChallengePage = () => {
  const navigate = useNavigate();
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const createMutation = usePostQuery({ queryKey: CHALLENGES_QUERY_KEY });

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);
  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (l) => l.isActive),
    [languages],
  );

  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState(createEmptyForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // image cleanup on unmount
  React.useEffect(
    () => () => {
      if (formData.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreviewUrl);
      }
    },
    [formData.imagePreviewUrl],
  );

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/challenges/list");
  };

  const handleImageChange = React.useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setFormData((cur) => {
        if (cur.imagePreviewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(cur.imagePreviewUrl);
        }
        return {
          ...cur,
          imageFile: file,
          imagePreviewUrl: previewUrl,
          removeImage: false,
        };
      });
    },
    [],
  );

  const handleImageRemove = React.useCallback(() => {
    setFormData((cur) => {
      if (cur.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cur.imagePreviewUrl);
      }
      return {
        ...cur,
        imageFile: null,
        imagePreviewUrl: "",
        removeImage: Boolean(cur.imageId),
      };
    });
  }, []);

  const handleNext = () => {
    try {
      validateStep(activeStep, formData);
      setActiveStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBack = () => setActiveStep((prev) => Math.max(0, prev - 1));

  const handleSubmit = React.useCallback(async () => {
    let payload;
    let uploadedImageId = null;
    try {
      payload = buildPayload(formData, currentLanguage);
    } catch (error) {
      toast.error(error?.message || "Ma'lumotlarni tekshiring");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestPayload = { ...payload };
      if (formData.imageFile) {
        uploadedImageId = await uploadChallengeImage(formData.imageFile);
        requestPayload.imageId = uploadedImageId;
      }
      await createMutation.mutateAsync({
        url: "/admin/challenges",
        attributes: requestPayload,
      });
      toast.success("Musobaqa muvaffaqiyatli yaratildi");
      navigate("/admin/challenges/list");
    } catch (error) {
      await cleanupChallengeImage(uploadedImageId);
      toast.error(
        resolveChallengeApiErrorMessage(error, "Yaratishda xatolik"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [createMutation, currentLanguage, formData, navigate]);

  const isPlacePercentInput =
    formData.rewardMode === "PLACE_XP" && Number(formData.joinFeeXp || 0) > 0;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-2xl outline-none">
        {/* ── Header ── */}
        <DrawerHeader className="relative border-b border-border/40 pb-4 pt-5 shrink-0">
          {activeStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
          )}
          <DrawerTitle className="text-center text-xl font-bold">
            {STEP_LABELS[activeStep]}
          </DrawerTitle>
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeStep ? "w-6 bg-primary" : "w-1.5 bg-muted",
                )}
              />
            ))}
          </div>
        </DrawerHeader>

        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DrawerBody className="flex flex-col gap-5 py-5">
            {/* ── Step 0: Asosiy ── */}
            {activeStep === 0 && (
              <div className="flex flex-col gap-4">
                {/* Image upload */}
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                    {formData.imagePreviewUrl ? (
                      <img
                        src={formData.imagePreviewUrl}
                        alt="Cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImagePlusIcon className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        Rasm tanlash
                      </label>
                    </Button>
                    {formData.imagePreviewUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImageRemove}
                      >
                        <XIcon className="mr-1 size-4" />
                        Olib tashlash
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG/PNG/WEBP, maksimal 5MB
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Sarlavha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((cur) => ({
                        ...cur,
                        title: e.target.value,
                        translations: {
                          ...(cur.translations || {}),
                          [currentLanguage]: e.target.value,
                        },
                      }))
                    }
                    placeholder="Masalan: 30 kunlik fitness marafon"
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Ta'rif</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((cur) => ({
                        ...cur,
                        description: e.target.value,
                        descriptionTranslations: {
                          ...(cur.descriptionTranslations || {}),
                          [currentLanguage]: e.target.value,
                        },
                      }))
                    }
                    placeholder="Musobaqa haqida qisqacha ma'lumot"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Holati</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.status}
                    onValueChange={(v) => {
                      if (v) setFormData((cur) => ({ ...cur, status: v }));
                    }}
                    className="w-full justify-start rounded-xl border p-1"
                  >
                    <ToggleGroupItem
                      value="UPCOMING"
                      className="flex-1 rounded-lg text-xs"
                    >
                      Boshlanmagan
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="ACTIVE"
                      className="flex-1 rounded-lg text-xs"
                    >
                      Faol
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="COMPLETED"
                      className="flex-1 rounded-lg text-xs"
                    >
                      Yakunlangan
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="CANCELLED"
                      className="flex-1 rounded-lg text-xs"
                    >
                      Bekor qilingan
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}

            {/* ── Step 1: Vaqt ── */}
            {activeStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Boshlanish vaqti</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((cur) => ({
                        ...cur,
                        startDate: e.target.value,
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Tugash vaqti</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((cur) => ({
                        ...cur,
                        endDate: e.target.value,
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Metrika ── */}
            {activeStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Challenge metrikasi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {entries(METRIC_TYPE_META).map(([value, meta]) => (
                      <div
                        key={value}
                        onClick={() =>
                          setFormData((cur) => ({
                            ...cur,
                            metricType: value,
                          }))
                        }
                        className={cn(
                          "border rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1",
                          formData.metricType === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-muted/20 hover:bg-muted/40 text-muted-foreground",
                        )}
                      >
                        <span className="text-sm font-semibold leading-none">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {meta.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Hisoblash usuli</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.metricAggregation}
                    onValueChange={(v) => {
                      if (v)
                        setFormData((cur) => ({
                          ...cur,
                          metricAggregation: v,
                        }));
                    }}
                    className="justify-start border border-border/50 rounded-xl p-1 bg-muted/20 w-full"
                  >
                    {entries(METRIC_AGGREGATION_META).map(([value, label]) => (
                      <ToggleGroupItem
                        key={value}
                        value={value}
                        className="rounded-lg flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                      >
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Maqsad ({METRIC_TYPE_META[formData.metricType]?.unit || "unit"})
                  </Label>
                  <NumberField
                    value={formData.metricTarget}
                    onValueChange={(v) =>
                      setFormData((cur) => ({
                        ...cur,
                        metricTarget: v ?? 0,
                      }))
                    }
                    minValue={0.01}
                    step={formData.metricType === "STEPS" ? 1000 : 10}
                    formatOptions={{
                      signDisplay: "never",
                      maximumFractionDigits: 2,
                    }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder="0" />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
              </div>
            )}

            {/* ── Step 3: Mukofot + Tarjimalar ── */}
            {activeStep === 3 && (
              <div className="flex flex-col gap-4">
                {/* Reward mode */}
                <div className="space-y-2">
                  <Label className="font-semibold">Mukofot rejimi</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.rewardMode}
                    onValueChange={(v) => {
                      if (v)
                        setFormData((cur) => ({ ...cur, rewardMode: v }));
                    }}
                    className="justify-start border border-border/50 rounded-xl p-1 bg-muted/20"
                  >
                    {REWARD_MODE_OPTIONS.map((opt) => (
                      <ToggleGroupItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-lg flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
                      >
                        {opt.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {formData.rewardMode === "FIXED_XP" && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Mukofot (XP)</Label>
                    <NumberField
                      value={formData.rewardXp}
                      onValueChange={(v) =>
                        setFormData((cur) => ({ ...cur, rewardXp: v ?? 0 }))
                      }
                      minValue={0}
                      step={100}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </div>
                )}

                {formData.rewardMode === "PERCENT_OF_POOL" && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Mukofot foizi (%)</Label>
                    <NumberField
                      value={formData.rewardPercent}
                      onValueChange={(v) =>
                        setFormData((cur) => ({
                          ...cur,
                          rewardPercent: v ?? 0,
                        }))
                      }
                      minValue={0.01}
                      maxValue={100}
                      step={1}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 2,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="10" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <p className="text-xs text-muted-foreground">
                      Pool foizi rejimi uchun kirish narxi 0 dan katta
                      bo&apos;lishi kerak.
                    </p>
                  </div>
                )}

                {formData.rewardMode === "PLACE_XP" && (
                  <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">
                        O&apos;rinlar bo&apos;yicha mukofot
                      </Label>
                      <Badge variant="outline">
                        {isPlacePercentInput ? "%" : "XP"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isPlacePercentInput
                        ? "Kirish narxi mavjud: foiz kiriting (masalan 50, 30, 20)."
                        : "Kirish narxi 0: to'g'ridan-to'g'ri XP kiriting."}
                    </p>
                    <div className="grid gap-3 grid-cols-3">
                      {[
                        { key: "firstPlaceXp", label: "1-o'rin" },
                        { key: "secondPlaceXp", label: "2-o'rin" },
                        { key: "thirdPlaceXp", label: "3-o'rin" },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-muted-foreground text-xs uppercase">
                            {label}
                          </Label>
                          <NumberField
                            value={formData[key]}
                            onValueChange={(v) =>
                              setFormData((cur) => ({
                                ...cur,
                                [key]: v ?? 0,
                              }))
                            }
                            minValue={0}
                            maxValue={isPlacePercentInput ? 100 : 1000000}
                            step={isPlacePercentInput ? 1 : 100}
                            formatOptions={{
                              signDisplay: "never",
                              maximumFractionDigits: isPlacePercentInput ? 2 : 0,
                            }}
                          >
                            <NumberFieldGroup>
                              <NumberFieldDecrement />
                              <NumberFieldInput placeholder="0" />
                              <NumberFieldIncrement />
                            </NumberFieldGroup>
                          </NumberField>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-semibold">Kirish narxi (XP)</Label>
                    <NumberField
                      value={formData.joinFeeXp}
                      onValueChange={(v) =>
                        setFormData((cur) => ({ ...cur, joinFeeXp: v ?? 0 }))
                      }
                      minValue={0}
                      step={10}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Maks qatnashchi</Label>
                    <NumberField
                      value={formData.maxParticipants}
                      onValueChange={(v) =>
                        setFormData((cur) => ({
                          ...cur,
                          maxParticipants: v ?? 0,
                        }))
                      }
                      minValue={0}
                      step={10}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="Cheksiz" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <p className="text-[10px] text-muted-foreground">0 — cheksiz</p>
                  </div>
                </div>

                {/* Translations section */}
                {activeLanguages.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2">
                    <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                      Tarjimalar (ixtiyoriy)
                    </span>
                    {activeLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        className="space-y-2 rounded-2xl border border-border/60 bg-muted/15 p-3"
                      >
                        <p className="text-xs font-semibold text-muted-foreground">
                          {lang.flag ? `${lang.flag} ` : ""}
                          {lang.name} ({lang.code})
                        </p>
                        <Input
                          value={
                            formData.translations?.[lang.code] ??
                            (lang.code === currentLanguage
                              ? formData.title
                              : "")
                          }
                          onChange={(e) =>
                            setFormData((cur) => ({
                              ...cur,
                              translations: {
                                ...(cur.translations || {}),
                                [lang.code]: e.target.value,
                              },
                              ...(lang.code === currentLanguage
                                ? { title: e.target.value }
                                : {}),
                            }))
                          }
                          placeholder={`${lang.name} tilida sarlavha`}
                          className="rounded-xl text-sm"
                        />
                        <Input
                          value={
                            formData.descriptionTranslations?.[lang.code] ??
                            (lang.code === currentLanguage
                              ? formData.description
                              : "")
                          }
                          onChange={(e) =>
                            setFormData((cur) => ({
                              ...cur,
                              descriptionTranslations: {
                                ...(cur.descriptionTranslations || {}),
                                [lang.code]: e.target.value,
                              },
                              ...(lang.code === currentLanguage
                                ? { description: e.target.value }
                                : {}),
                            }))
                          }
                          placeholder={`${lang.name} tilida ta'rif`}
                          className="rounded-xl text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DrawerBody>

          <DrawerFooter className="border-t border-border/40 pt-3 pb-5">
            {activeStep === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/challenges/list")}
                className="rounded-xl"
              >
                Bekor qilish
              </Button>
            )}
            <Button
              type="button"
              disabled={isSubmitting}
              className="rounded-xl"
              onClick={activeStep < TOTAL_STEPS - 1 ? handleNext : handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : activeStep < TOTAL_STEPS - 1 ? (
                "Keyingi →"
              ) : (
                "Yaratish"
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateChallengePage;
