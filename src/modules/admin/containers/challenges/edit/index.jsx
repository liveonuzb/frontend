/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useParams } from "react-router";
import find from "lodash/find";
import get from "lodash/get";
import lodashValues from "lodash/values";
import fromPairs from "lodash/fromPairs";
import isArray from "lodash/isArray";
import map from "lodash/map";
import reduce from "lodash/reduce";
import some from "lodash/some";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import filter from "lodash/filter";
import toPairs from "lodash/toPairs";
import take from "lodash/take";
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
import { useGetQuery, usePatchQuery } from "@/hooks/api";
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
  getChallengeQueryKey,
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

const resolveText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uzText = trim(String(get(translations, "uz", "")));
    if (uzText) return uzText;

    const firstValue = find(lodashValues(translations), (value) =>
      trim(String(value ?? "")),
    );
    if (firstValue) return trim(String(firstValue));
  }

  return trim(String(fallback ?? ""));
};

const cleanTranslations = (translations = {}) =>
  fromPairs(filter(map(
    toPairs(translations),
    ([code, value]) => [code, trim(String(value ?? ""))],
  ), ([code, value]) => Boolean(code) && Boolean(value)));

const toInputDate = (value, fallback) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : fallback;
};

const toIsoDate = (value, endOfDay = false) => {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return date.toISOString();
};

const parsePlaceRewards = (value) => {
  const source = value && typeof value === "object" && !isArray(value) ? value : {};
  return map([1, 2, 3], (place) => ({
    place,
    value: toNumber(source[String(place)] ?? source[place]) || [50, 30, 20][place - 1],
  }));
};

const buildPlaceRewards = (items) =>
  reduce(take(items, 3), (result, item) => {
    if (toNumber(item.value) > 0) result[String(item.place)] = toNumber(item.value);
    return result;
  }, {});

const validateStep = (stepKey, form) => {
  if (stepKey === "basic" && !trim(form.title)) {
    throw new Error("Musobaqa nomini kiriting");
  }

  if (stepKey === "metric" && (!toNumber(form.metricTarget) || toNumber(form.metricTarget) <= 0)) {
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
    const rewards = map(take(form.placeRewards, 3), (item) => toNumber(item.value) || 0);
    const total = reduce(rewards, (sum, value) => sum + value, 0);
    if (toNumber(form.joinFeeXp) <= 0) {
      throw new Error("O'rin bo'yicha mukofot uchun kirish narxi 0 dan katta bo'lishi kerak");
    }
    if (rewards.length !== 3 || some(rewards, (value) => value <= 0)) {
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
  const title = trim(form.title);
  if (!title) throw new Error("Musobaqa nomini kiriting");

  const payload = {
    title,
    description: trim(form.description) || undefined,
    translations: cleanTranslations({
      ...(form.translations || {}),
      [currentLanguage]: title,
    }),
    descriptionTranslations: cleanTranslations({
      ...(form.descriptionTranslations || {}),
      ...(trim(form.description) ? { [currentLanguage]: trim(form.description) } : {}),
    }),
    status: form.status || "UPCOMING",
    metricType: form.metricType,
    metricAggregation: form.metricAggregation,
    metricTarget: toNumber(form.metricTarget),
    startDate: toIsoDate(form.startDate),
    endDate: toIsoDate(form.endDate, true),
    rewardMode: form.rewardMode,
    joinFeeXp: toNumber(form.joinFeeXp) || 0,
    maxParticipants: toNumber(form.maxParticipants) || null,
  };

  if (form.uploadedImageId) payload.imageId = form.uploadedImageId;

  if (form.rewardMode === "FIXED_XP") {
    payload.rewardXp = toNumber(form.rewardXp) || 0;
  } else if (form.rewardMode === "PERCENT_OF_POOL") {
    payload.rewardPercent = toNumber(form.rewardPercent) || 0;
  } else {
    payload.placeRewards = buildPlaceRewards(form.placeRewards);
  }

  return payload;
};

const challengeToForm = (challenge, currentLanguage) => {
  const base = createInitialForm();
  const rewardDetails = challenge?.rewardDetails || {};
  const startDate = toInputDate(challenge?.startDate, base.startDate);
  const endDate = toInputDate(challenge?.endDate, base.endDate);
  const durationDays = differenceInCalendarDays(new Date(endDate), new Date(startDate));
  const translations =
    challenge?.translations && typeof challenge.translations === "object"
      ? challenge.translations
      : {};
  const descriptionTranslations =
    challenge?.descriptionTranslations && typeof challenge.descriptionTranslations === "object"
      ? challenge.descriptionTranslations
      : {};

  return {
    ...base,
    title: resolveText(translations, challenge?.title, currentLanguage),
    description: resolveText(descriptionTranslations, challenge?.description, currentLanguage),
    translations,
    descriptionTranslations,
    status: challenge?.status || "UPCOMING",
    imagePreviewUrl: challenge?.image?.url || challenge?.imageUrl || "",
    imageId: challenge?.imageId || challenge?.image?.id || null,
    uploadedImageId: null,
    metricType: challenge?.metricDetails?.type || challenge?.metricType || base.metricType,
    metricAggregation:
      challenge?.metricDetails?.aggregation ||
      challenge?.metricAggregation ||
      base.metricAggregation,
    metricTarget:
      toNumber(challenge?.metricDetails?.target ?? challenge?.metricTarget) || base.metricTarget,
    startDate,
    endDate,
    durationDays: durationDays > 0 ? durationDays : null,
    rewardMode: challenge?.rewardMode || rewardDetails.mode || base.rewardMode,
    rewardXp: toNumber(challenge?.rewardXp ?? rewardDetails.fixedXp) || base.rewardXp,
    rewardPercent: toNumber(challenge?.rewardPercent ?? rewardDetails.percent) || base.rewardPercent,
    placeRewards: parsePlaceRewards(challenge?.placeRewards || rewardDetails.placeRewards),
    joinFeeXp: toNumber(challenge?.joinFeeXp) || 0,
    maxParticipants: toNumber(challenge?.maxParticipants) || 0,
  };
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
        {map([
          ["UPCOMING", "Boshlanmagan"],
          ["ACTIVE", "Faol"],
          ["COMPLETED", "Yakunlangan"],
          ["CANCELLED", "Bekor qilingan"],
        ], ([value, label]) => (
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

const EditChallengePage = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    "/admin/challenges/list",
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";
  const [form, setForm] = React.useState(createInitialForm);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isImageUploading, setIsImageUploading] = React.useState(false);
  const challengeQueryKey = React.useMemo(() => getChallengeQueryKey(id), [id]);

  const { data: challengeData, isLoading, error: challengeError } = useGetQuery({
    url: `/admin/challenges/${id}`,
    queryProps: {
      queryKey: challengeQueryKey,
      enabled: Boolean(id),
    },
  });

  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: challengeQueryKey,
    listKey: CHALLENGES_QUERY_KEY,
  });

  React.useEffect(() => {
    const challenge = get(challengeData, "data");
    if (challenge) {
      setForm(challengeToForm(challenge, currentLanguage));
    }
  }, [challengeData, currentLanguage]);

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
        imagePreviewUrl: current.imageId ? current.imagePreviewUrl : "",
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
        url: `/admin/challenges/${id}`,
        attributes: buildPayload(form, currentLanguage),
      });
      toast.success("Musobaqa yangilandi");
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
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
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
              <DrawerTitle>Musobaqani tahrirlash</DrawerTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {STEPS[stepIndex].label} · {stepIndex + 1}/{STEPS.length}
              </p>
              <div className="mt-3 flex gap-1.5">
                {map(STEPS, (step, index) => (
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
          {challengeError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {resolveChallengeApiErrorMessage(challengeError, "Musobaqa ma'lumotlarini yuklab bo'lmadi")}
            </div>
          ) : isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            renderStep()
          )}
        </DrawerBody>

        {!challengeError ? (
          <DrawerFooter className="shrink-0 border-t sm:flex-row">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={handleBack} disabled={isSaving}>
              Orqaga
            </Button>
            <Button type="button" className="sm:flex-1" onClick={handleNext} disabled={isSaving || isLoading}>
              {isSaving ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" /> : null}
              {isImageUploading ? "Rasm yuklanmoqda..." : stepIndex === STEPS.length - 1 ? (
                <>
                  <CheckCircle2Icon className="mr-2 size-4" />
                  Saqlash
                </>
              ) : "Keyingi"}
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default EditChallengePage;



