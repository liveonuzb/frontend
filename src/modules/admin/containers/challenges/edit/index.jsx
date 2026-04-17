import React from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { get, find } from "lodash";
import { filter as lodashFilter, entries, fromPairs, values, sum } from "lodash";
import { toast } from "sonner";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DrawerBody } from "@/components/ui/drawer";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

import BasicStep from "../create/basic-step.jsx";
import SettingsStep from "../create/settings-step.jsx";
import TranslationsStep from "../create/translations-step.jsx";
import {
  CHALLENGES_QUERY_KEY,
  cleanupChallengeImage,
  getChallengeQueryKey,
  resolveChallengeApiErrorMessage,
  uploadChallengeImage,
} from "../api.js";

const STEP_KEYS = ["basic", "settings", "translations"];

const STEP_CONTENT = {
  basic: {
    title: "Musobaqani tahrirlash",
    description: "Sarlavha, ta'rif, holat va cover rasmini yangilang.",
  },
  settings: {
    title: "Musobaqa sozlamalari",
    description: "Vaqt, metrikalar va mukofot konfiguratsiyasi.",
  },
  translations: {
    title: "Tarjimalar",
    description: "Barcha aktiv tillardagi sarlavha va ta'rif matnlarini tahrirlang.",
  },
};

const formatDateTimeInput = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
};

const resolveLocalizedText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = String(translations?.[language] ?? "").trim();
    if (direct) return direct;

    const uzText = String(translations?.uz ?? "").trim();
    if (uzText) return uzText;

    const firstValue = find(
      values(translations),
      (value) => String(value ?? "").trim().length > 0,
    );
    if (firstValue) return String(firstValue).trim();
  }

  return String(fallback ?? "").trim();
};

const getChallengeRewardMode = (challenge) =>
  challenge.rewardMode || challenge.rewardDetails?.mode || "FIXED_XP";

const getChallengeImageUrl = (challenge) =>
  challenge.image?.url || challenge.imageUrl || "";

const extractPlaceRewards = (challenge) => {
  const source =
    challenge.rewardDetails?.placeRewards || challenge.placeRewards;
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  return source;
};

const cleanTranslations = (translations = {}) =>
  fromPairs(
    lodashFilter(
      entries(translations).map(([code, value]) => [code, String(value ?? "").trim()]),
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
  if (value === "") return null;
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
    lodashFilter(placeValues, ([, rawValue]) => String(rawValue).trim() !== "").map(
      ([place, rawValue]) => [place, parseNonNegativeInt(rawValue, `${place}-o'rin mukofoti`)],
    ),
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
    throw new Error("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak");
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
      throw new Error("Foizli mukofotda kirish narxi 0 dan katta bo'lishi kerak");
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
    metricTarget: parsePositiveFloat(formData.metricTarget, "Challenge maqsadi"),
    removeImage: Boolean(formData.removeImage),
    maxParticipants: parseNullablePositiveInt(formData.maxParticipants, "Maksimal ishtirokchi"),
  };
};

const buildFormDataFromChallenge = (challenge, currentLanguage) => {
  const rewardMode = getChallengeRewardMode(challenge);
  const placeRewards = extractPlaceRewards(challenge);
  const challengeTranslations =
    challenge.translations && typeof challenge.translations === "object"
      ? challenge.translations
      : {};
  const challengeDescriptionTranslations =
    challenge.descriptionTranslations &&
    typeof challenge.descriptionTranslations === "object"
      ? challenge.descriptionTranslations
      : {};

  return {
    title: resolveLocalizedText(
      challengeTranslations,
      challenge.title ?? "",
      currentLanguage,
    ),
    description: resolveLocalizedText(
      challengeDescriptionTranslations,
      challenge.description ?? "",
      currentLanguage,
    ),
    translations: challengeTranslations,
    descriptionTranslations: challengeDescriptionTranslations,
    status: challenge.status ?? "UPCOMING",
    startDate: formatDateTimeInput(challenge.startDate),
    endDate: formatDateTimeInput(challenge.endDate),
    joinFeeXp: String(challenge.joinFeeXp ?? 0),
    rewardMode,
    rewardXp: String(
      challenge.rewardDetails?.fixedXp ?? challenge.rewardXp ?? 0,
    ),
    rewardPercent: String(
      challenge.rewardDetails?.percent ?? challenge.rewardPercent ?? "",
    ),
    firstPlaceXp: String(placeRewards["1"] ?? ""),
    secondPlaceXp: String(placeRewards["2"] ?? ""),
    thirdPlaceXp: String(placeRewards["3"] ?? ""),
    maxParticipants:
      challenge.maxParticipants === null ||
      challenge.maxParticipants === undefined
        ? ""
        : String(challenge.maxParticipants),
    metricType:
      challenge.metricDetails?.type ?? challenge.metricType ?? "STEPS",
    metricAggregation:
      challenge.metricDetails?.aggregation ??
      challenge.metricAggregation ??
      "SUM",
    metricTarget: String(
      challenge.metricDetails?.target ?? challenge.metricTarget ?? 10000,
    ),
    imageFile: null,
    imagePreviewUrl: getChallengeImageUrl(challenge),
    imageId: challenge.imageId ?? challenge.image?.id ?? null,
    removeImage: false,
  };
};

const EditChallengePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const challengeQueryKey = React.useMemo(
    () => getChallengeQueryKey(id),
    [id],
  );

  const { data: challengeData, isLoading: isChallengeLoading, error: challengeError } =
    useGetQuery({
      url: `/admin/challenges/${id}`,
      queryProps: {
        queryKey: challengeQueryKey,
        enabled: Boolean(id),
      },
    });
  const updateMutation = usePatchQuery({
    queryKey: challengeQueryKey,
    listKey: CHALLENGES_QUERY_KEY,
  });

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);
  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );
  const currentLanguageMeta = React.useMemo(
    () => activeLanguages.find((l) => l.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const challenge = get(challengeData, "data", null);

  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (challenge && !formData) {
      setFormData(buildFormDataFromChallenge(challenge, currentLanguage));
    }
  }, [challenge, currentLanguage, formData]);

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/challenges/list");
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = React.useCallback(async () => {
    if (!formData) return;

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

      await updateMutation.mutateAsync({
        url: `/admin/challenges/${id}`,
        attributes: requestPayload,
      });

      toast.success("Musobaqa muvaffaqiyatli yangilandi");
      navigate("/admin/challenges/list");
    } catch (error) {
      toast.error(
        resolveChallengeApiErrorMessage(error, "Saqlashda xatolik"),
      );
      await cleanupChallengeImage(uploadedImageId);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentLanguage, formData, id, navigate, updateMutation]);

  const stepKey = STEP_KEYS[activeStep];
  const headerContent = get(STEP_CONTENT, stepKey);

  if (!isChallengeLoading && challengeError) {
    return (
      <Drawer open onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-sm outline-none">
          <DrawerHeader className="px-6 py-5">
            <DrawerTitle className="text-center">Xatolik</DrawerTitle>
            <DrawerDescription className="text-center">
              {resolveChallengeApiErrorMessage(
                challengeError,
                "Musobaqa ma'lumotlarini yuklab bo'lmadi",
              )}
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  if (isChallengeLoading || !formData) {
    return (
      <Drawer open onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-sm outline-none">
          <DrawerHeader className="px-6 py-5">
            <DrawerTitle className="text-center">Yuklanmoqda...</DrawerTitle>
            <DrawerDescription className="text-center">
              Musobaqa ma'lumotlari yuklanmoqda
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="flex items-center justify-center py-12">
            <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-sm outline-none">
        <DrawerHeader className="relative px-6 py-5">
          {activeStep > 0 && (
            <div className="absolute left-4 top-4 z-20">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-8 rounded-full"
                onClick={handleBack}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
            </div>
          )}
          <DrawerTitle className="text-center">{get(headerContent, "title")}</DrawerTitle>
          <DrawerDescription className="text-center">
            {get(headerContent, "description")}
          </DrawerDescription>
        </DrawerHeader>

        {activeStep === 0 && (
          <BasicStep
            formData={formData}
            setFormData={setFormData}
            currentLanguage={currentLanguage}
            currentLanguageMeta={currentLanguageMeta}
            onNext={() => setActiveStep(1)}
          />
        )}
        {activeStep === 1 && (
          <SettingsStep
            formData={formData}
            setFormData={setFormData}
            onNext={() => setActiveStep(2)}
            onBack={handleBack}
          />
        )}
        {activeStep === 2 && (
          <TranslationsStep
            formData={formData}
            setFormData={setFormData}
            activeLanguages={activeLanguages}
            currentLanguage={currentLanguage}
            currentLanguageMeta={currentLanguageMeta}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            submitLabel="Saqlash"
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default EditChallengePage;
