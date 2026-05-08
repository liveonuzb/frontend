import React from "react";
import { addDays, format } from "date-fns";
import { get } from "lodash";
import { toast } from "sonner";
import { ArrowLeftIcon, CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePostQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { cn } from "@/lib/utils";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import ChallengeCoverPicker from "@/modules/user/containers/challenges/create/challenge-cover-picker.jsx";
import StepDuration from "@/modules/user/containers/challenges/create/step-duration.jsx";
import StepMetric from "@/modules/user/containers/challenges/create/step-metric.jsx";
import StepReward from "@/modules/user/containers/challenges/create/step-reward.jsx";
import { StepSection } from "@/modules/user/containers/challenges/create/form-fields.jsx";
import {
  CHALLENGES_QUERY_KEY,
  resolveChallengeApiErrorMessage,
  uploadChallengeImage,
} from "../api.js";

const STEPS = [
  { key: "basic", label: "Asosiy" },
  { key: "metric", label: "O'lchov" },
  { key: "duration", label: "Vaqt" },
  { key: "reward", label: "Mukofot" },
];

const todayInput = () => format(new Date(), "yyyy-MM-dd");
const addDaysInput = (days) => format(addDays(new Date(), days), "yyyy-MM-dd");

const createInitialForm = () => ({
  title: "",
  description: "",
  translations: {},
  descriptionTranslations: {},
  status: "UPCOMING",
  imagePreviewUrl: "",
  imageId: null,
  uploadedImageId: null,
  metricType: "STEPS",
  metricTarget: 10000,
  metricAggregation: "SUM",
  durationDays: 7,
  startDate: todayInput(),
  endDate: addDaysInput(7),
  rewardMode: "FIXED_XP",
  rewardXp: 100,
  rewardPercent: 80,
  placeRewards: [
    { place: 1, value: 50 },
    { place: 2, value: 30 },
    { place: 3, value: 20 },
  ],
  joinFeeXp: 0,
  maxParticipants: 0,
});

const cleanTranslations = (translations = {}) =>
  Object.fromEntries(
    Object.entries(translations)
      .map(([code, value]) => [code, String(value ?? "").trim()])
      .filter(([code, value]) => Boolean(code) && Boolean(value)),
  );

const toIsoDate = (value, endOfDay = false) => {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return date.toISOString();
};

const buildPlaceRewards = (items) =>
  items.slice(0, 3).reduce((result, item) => {
    if (Number(item.value) > 0) result[String(item.place)] = Number(item.value);
    return result;
  }, {});

const validateStep = (stepKey, form) => {
  if (stepKey === "basic" && !form.title.trim()) {
    throw new Error("Musobaqa nomini kiriting");
  }

  if (stepKey === "metric" && (!Number(form.metricTarget) || Number(form.metricTarget) <= 0)) {
    throw new Error("Maqsad qiymati 0 dan katta bo'lishi kerak");
  }

  if (stepKey === "duration") {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Sanalarni tekshiring");
    }
    if (end.getTime() < start.getTime()) {
      throw new Error("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak");
    }
  }

  if (stepKey === "reward" && form.rewardMode === "PLACE_XP") {
    const rewards = form.placeRewards.slice(0, 3).map((item) => Number(item.value) || 0);
    const total = rewards.reduce((sum, value) => sum + value, 0);
    if (Number(form.joinFeeXp) <= 0) {
      throw new Error("O'rin bo'yicha mukofot uchun kirish narxi 0 dan katta bo'lishi kerak");
    }
    if (rewards.length !== 3 || rewards.some((value) => value <= 0)) {
      throw new Error("1, 2 va 3-o'rin foizlari 0 dan katta bo'lishi kerak");
    }
    if (total !== 100) {
      throw new Error("O'rinlar foizi jami 100% bo'lishi kerak");
    }
    if (!(rewards[0] > rewards[1] && rewards[1] > rewards[2])) {
      throw new Error("1-o'rin foizi 2-o'rindan, 2-o'rin esa 3-o'rindan katta bo'lishi kerak");
    }
  }
};

const buildPayload = (form, currentLanguage) => {
  const title = form.title.trim();
  if (!title) throw new Error("Musobaqa nomini kiriting");

  const payload = {
    title,
    description: form.description.trim() || undefined,
    translations: cleanTranslations({
      ...(form.translations || {}),
      [currentLanguage]: title,
    }),
    descriptionTranslations: cleanTranslations({
      ...(form.descriptionTranslations || {}),
      ...(form.description.trim() ? { [currentLanguage]: form.description.trim() } : {}),
    }),
    type: "GLOBAL",
    status: form.status || "UPCOMING",
    metricType: form.metricType,
    metricAggregation: form.metricAggregation,
    metricTarget: Number(form.metricTarget),
    startDate: toIsoDate(form.startDate),
    endDate: toIsoDate(form.endDate, true),
    rewardMode: form.rewardMode,
    joinFeeXp: Number(form.joinFeeXp) || 0,
    maxParticipants: Number(form.maxParticipants) || null,
  };

  if (form.uploadedImageId) payload.imageId = form.uploadedImageId;

  if (form.rewardMode === "FIXED_XP") {
    payload.rewardXp = Number(form.rewardXp) || 0;
  } else if (form.rewardMode === "PERCENT_OF_POOL") {
    payload.rewardPercent = Number(form.rewardPercent) || 0;
  } else {
    payload.placeRewards = buildPlaceRewards(form.placeRewards);
  }

  return payload;
};

const ChallengeBasicStep = ({ form, setForm, onImageChange, onImageRemove }) => (
  <div className="space-y-4">
    <StepSection
      title="Asosiy ma'lumotlar"
      description="Challenge nomi, qisqa tavsifi va ko'rinadigan cover rasmini belgilang."
    >
      <ChallengeCoverPicker
        imagePreviewUrl={form.imagePreviewUrl}
        onImageChange={onImageChange}
        onImageRemove={onImageRemove}
        className="aspect-[5/2] min-h-48"
      />
      <div className="space-y-2">
        <label className="text-sm font-bold">Sarlavha</label>
        <Input
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Chellenj nomi"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold">Tavsif</label>
        <Textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Chellenj haqida qisqacha"
          className="min-h-24 resize-none"
        />
      </div>
    </StepSection>
    <StepSection
      title="Admin holati"
      description="Challenge userlarga qaysi holatda ko'rinishini belgilang."
    >
      <ToggleGroup
        type="single"
        value={form.status}
        onValueChange={(value) => {
          if (value) setForm((current) => ({ ...current, status: value }));
        }}
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
        spacing={2}
      >
        {[
          ["UPCOMING", "Boshlanmagan"],
          ["ACTIVE", "Faol"],
          ["COMPLETED", "Yakunlangan"],
          ["CANCELLED", "Bekor qilingan"],
        ].map(([value, label]) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="h-auto rounded-md border px-3 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
          >
            <span className="text-xs font-medium">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </StepSection>
  </div>
);

const CreateChallengePage = () => {
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    "/admin/challenges/list",
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";
  const [form, setForm] = React.useState(createInitialForm);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isImageUploading, setIsImageUploading] = React.useState(false);
  const { mutateAsync, isPending } = usePostQuery({ queryKey: CHALLENGES_QUERY_KEY });

  const closeDrawer = React.useCallback(() => {
    closeAdminDrawer();
  }, [closeAdminDrawer]);

  const handleImageChange = React.useCallback(async (file) => {
    if (!file.type?.startsWith("image/")) {
      toast.error("Faqat rasm yuklash mumkin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm 5MB dan kichik bo'lishi kerak");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(current.imagePreviewUrl);
      return {
        ...current,
        imagePreviewUrl: previewUrl,
        uploadedImageId: null,
      };
    });

    setIsImageUploading(true);
    try {
      const uploadedImage = await uploadChallengeImage(file);
      const uploadedImageId = uploadedImage?.id ?? null;
      const uploadedImageUrl = uploadedImage?.url || previewUrl;

      setForm((current) => {
        if (current.imagePreviewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(current.imagePreviewUrl);
        }
        return {
          ...current,
          imagePreviewUrl: uploadedImageUrl,
          uploadedImageId,
        };
      });

      toast.success("Rasm yuklandi");
    } catch (error) {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setForm((current) => ({
        ...current,
        imagePreviewUrl: "",
        uploadedImageId: null,
      }));
      toast.error(resolveChallengeApiErrorMessage(error, "Rasmni yuklab bo'lmadi"));
    } finally {
      setIsImageUploading(false);
    }
  }, []);

  const handleImageRemove = React.useCallback(() => {
    setForm((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(current.imagePreviewUrl);
      return {
        ...current,
        imagePreviewUrl: "",
        uploadedImageId: null,
      };
    });
  }, []);

  const handleBack = () => {
    if (stepIndex === 0) {
      closeDrawer();
      return;
    }
    setStepIndex((current) => current - 1);
  };

  const handleNext = async () => {
    const stepKey = STEPS[stepIndex].key;
    try {
      validateStep(stepKey, form);
    } catch (error) {
      toast.error(error.message);
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await mutateAsync({
        url: "/admin/challenges",
        attributes: buildPayload(form, currentLanguage),
      });
      toast.success("Musobaqa yaratildi");
      closeDrawer();
    } catch (error) {
      toast.error(resolveChallengeApiErrorMessage(error, "Musobaqani saqlab bo'lmadi"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepKey = STEPS[stepIndex].key;
    if (stepKey === "metric") return <StepMetric form={form} setForm={setForm} />;
    if (stepKey === "duration") return <StepDuration form={form} setForm={setForm} />;
    if (stepKey === "reward") return <StepReward form={form} setForm={setForm} />;
    return (
      <ChallengeBasicStep
        form={form}
        setForm={setForm}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
      />
    );
  };

  const isSaving = isSubmitting || isImageUploading || isPending;

  return (
    <Drawer
      open
      direction="bottom"
      shouldScaleBackground={false}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <DrawerContent className="overflow-hidden data-[vaul-drawer-direction=bottom]:max-w-2xl">
        <DrawerHeader className="shrink-0 border-b text-left">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleBack}
              disabled={isSaving}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <DrawerTitle>Musobaqa yaratish</DrawerTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {STEPS[stepIndex].label} · {stepIndex + 1}/{STEPS.length}
              </p>
              <div className="mt-3 flex gap-1.5">
                {STEPS.map((step, index) => (
                  <span
                    key={step.key}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      index <= stepIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto py-5">
          {renderStep()}
        </DrawerBody>

        <DrawerFooter className="shrink-0 border-t sm:flex-row">
          <Button type="button" variant="outline" className="sm:flex-1" onClick={handleBack} disabled={isSaving}>
            Orqaga
          </Button>
          <Button type="button" className="sm:flex-1" onClick={handleNext} disabled={isSaving}>
            {isSaving ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" /> : null}
            {isImageUploading ? "Rasm yuklanmoqda..." : stepIndex === STEPS.length - 1 ? (
              <>
                <CheckCircle2Icon className="mr-2 size-4" />
                Saqlash
              </>
            ) : "Keyingi"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateChallengePage;
