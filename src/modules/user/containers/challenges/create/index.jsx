import React from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { api } from "@/hooks/api/use-api";
import { useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import { cn } from "@/lib/utils";
import StepBasics from "./step-basics.jsx";
import StepDuration from "./step-duration.jsx";
import StepMetric from "./step-metric.jsx";
import StepReward from "./step-reward.jsx";
import StepParticipants from "./step-participants.jsx";

const STEPS = [
  { key: "basic", label: "Asosiy" },
  { key: "metric", label: "O'lchov" },
  { key: "duration", label: "Vaqt" },
  { key: "reward", label: "Mukofot" },
  { key: "participants", label: "Taklif" },
];

const STEP_KEYS = STEPS.map((step) => step.key);

const todayInput = () => format(new Date(), "yyyy-MM-dd");
const addDaysInput = (days) => format(addDays(new Date(), days), "yyyy-MM-dd");

const createInitialForm = () => ({
  title: "",
  description: "",
  imageFile: null,
  imagePreviewUrl: "",
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
  participants: [],
  participantObjects: [],
  rulesAccepted: false,
});

const toInputDate = (value, fallback) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : fallback;
};

const toIsoDate = (value, endOfDay = false) => {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return date.toISOString();
};

const parseRouteState = (pathname) => {
  const marker = "/challenges/create";
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex >= 0) {
    const suffix = pathname.slice(markerIndex + marker.length);
    const parts = suffix.split("/").filter(Boolean);

    if (parts.length === 0) {
      return { challengeId: null, stepKey: "basic", invalid: false, source: "create" };
    }

    if (parts.length === 2 && STEP_KEYS.includes(parts[1])) {
      return { challengeId: parts[0], stepKey: parts[1], invalid: false, source: "create" };
    }

    return {
      challengeId: parts[0] || null,
      stepKey: "basic",
      invalid: true,
      source: "create",
    };
  }

  const editMatch = pathname.match(/\/challenges\/([^/]+)\/edit$/);
  if (editMatch?.[1]) {
    return {
      challengeId: editMatch[1],
      stepKey: "basic",
      invalid: false,
      source: "edit",
    };
  }

  return { challengeId: null, stepKey: "basic", invalid: true, source: "create" };
};

const buildPlaceRewards = (items) =>
  items.slice(0, 3).reduce((result, item) => {
    if (Number(item.value) > 0) {
      result[String(item.place)] = Number(item.value);
    }
    return result;
  }, {});

const parsePlaceRewards = (value) => {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return [1, 2, 3].map((place) => ({
    place,
    value: Number(source[String(place)] ?? source[place]) || [50, 30, 20][place - 1],
  }));
};

const validateStep = (stepKey, form) => {
  if (stepKey === "basic" && !form.title.trim()) {
    throw new Error("Chellenj nomini kiriting");
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

  if (stepKey === "participants" && !form.rulesAccepted) {
    throw new Error("Chellenj qoidalarini qabul qiling");
  }
};

const buildCreatePayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim() || undefined,
  type: "USER_CREATED",
  metricType: "STEPS",
  metricAggregation: "SUM",
  metricTarget: 10000,
  startDate: toIsoDate(todayInput()),
  endDate: toIsoDate(addDaysInput(7), true),
  rewardMode: "FIXED_XP",
  rewardXp: 100,
  joinFeeXp: 0,
  maxParticipants: null,
});

const buildPatchPayload = (stepKey, form) => {
  if (stepKey === "basic") {
    return {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
    };
  }

  if (stepKey === "metric") {
    return {
      metricType: form.metricType,
      metricAggregation: form.metricAggregation,
      metricTarget: Number(form.metricTarget),
    };
  }

  if (stepKey === "duration") {
    return {
      startDate: toIsoDate(form.startDate),
      endDate: toIsoDate(form.endDate, true),
    };
  }

  const payload = {
    rewardMode: form.rewardMode,
    joinFeeXp: Number(form.joinFeeXp) || 0,
    maxParticipants: Number(form.maxParticipants) || null,
  };

  if (form.rewardMode === "FIXED_XP") {
    payload.rewardXp = Number(form.rewardXp) || 0;
  } else if (form.rewardMode === "PERCENT_OF_POOL") {
    payload.rewardPercent = Number(form.rewardPercent) || 0;
  } else {
    payload.placeRewards = buildPlaceRewards(form.placeRewards);
  }

  return payload;
};

const challengeToForm = (challenge) => {
  const base = createInitialForm();
  const startDate = toInputDate(challenge?.startDate, base.startDate);
  const endDate = toInputDate(challenge?.endDate, base.endDate);
  const durationDays = differenceInCalendarDays(new Date(endDate), new Date(startDate));
  const rewardDetails = challenge?.rewardDetails || {};

  return {
    ...base,
    title: challenge?.title || "",
    description: challenge?.description || "",
    imagePreviewUrl: challenge?.image?.url || "",
    metricType: challenge?.metricDetails?.type || challenge?.metricType || base.metricType,
    metricAggregation:
      challenge?.metricDetails?.aggregation ||
      challenge?.metricAggregation ||
      base.metricAggregation,
    metricTarget:
      Number(challenge?.metricDetails?.target ?? challenge?.metricTarget) ||
      base.metricTarget,
    startDate,
    endDate,
    durationDays: durationDays > 0 ? durationDays : null,
    rewardMode: challenge?.rewardMode || rewardDetails.mode || base.rewardMode,
    rewardXp: Number(challenge?.rewardXp ?? rewardDetails.fixedXp) || base.rewardXp,
    rewardPercent:
      Number(challenge?.rewardPercent ?? rewardDetails.percent) || base.rewardPercent,
    placeRewards: parsePlaceRewards(challenge?.placeRewards || rewardDetails.placeRewards),
    joinFeeXp: Number(challenge?.joinFeeXp) || 0,
    maxParticipants: Number(challenge?.maxParticipants) || 0,
  };
};

const uploadChallengeImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/challenges/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data?.id ?? null;
};

const stepPath = (challengeId, stepKey) =>
  stepKey === "basic"
    ? `/user/challenges/create/${challengeId}/basic`
    : `/user/challenges/create/${challengeId}/${stepKey}`;

export default function ChallengeCreateContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    createCustomChallenge,
    updateChallenge,
    fetchChallengeDetail,
    inviteFriends,
    actionLoading,
    isDetailLoading,
  } = useChallengeStore();
  const [form, setForm] = React.useState(createInitialForm);
  const loadedChallengeIdRef = React.useRef(null);

  const routeState = React.useMemo(
    () => parseRouteState(location.pathname),
    [location.pathname],
  );
  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.key === routeState.stepKey),
  );
  const isExistingBasic = Boolean(routeState.challengeId) && routeState.stepKey === "basic";
  const isSaving = Boolean(
    actionLoading?.creating ||
      actionLoading?.updating ||
      actionLoading?.inviting ||
      isDetailLoading,
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/my", title: "Mening chellenjlarim" },
      { url: "/user/challenges/create", title: "Chellenj yaratish" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!routeState.invalid) return;
    if (routeState.challengeId) {
      navigate(stepPath(routeState.challengeId, "metric"), { replace: true });
    } else {
      navigate("/user/challenges/create", { replace: true });
    }
  }, [navigate, routeState.challengeId, routeState.invalid]);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (routeState.challengeId) return;
    loadedChallengeIdRef.current = null;
    setForm(createInitialForm());
  }, [routeState.challengeId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (!routeState.challengeId || routeState.challengeId === loadedChallengeIdRef.current) {
      return undefined;
    }

    let cancelled = false;
    fetchChallengeDetail(routeState.challengeId).then((challenge) => {
      if (!cancelled && challenge) {
        setForm(challengeToForm(challenge));
        loadedChallengeIdRef.current = routeState.challengeId;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchChallengeDetail, routeState.challengeId]);

  React.useEffect(
    () => () => {
      if (form.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.imagePreviewUrl);
      }
    },
    [form.imagePreviewUrl],
  );

  const handleImageChange = React.useCallback((file) => {
    const previewUrl = URL.createObjectURL(file);
    setForm((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }
      return {
        ...current,
        imageFile: file,
        imagePreviewUrl: previewUrl,
      };
    });
  }, []);

  const handleImageRemove = React.useCallback(() => {
    setForm((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }
      return { ...current, imageFile: null, imagePreviewUrl: "" };
    });
  }, []);

  const closeDrawer = React.useCallback(() => {
    if (routeState.source === "edit" && routeState.challengeId) {
      navigate(`/user/challenges/${routeState.challengeId}`);
      return;
    }

    navigate("/user/challenges/my");
  }, [navigate, routeState.challengeId, routeState.source]);

  const handleBack = () => {
    if (currentStepIndex === 0 || !routeState.challengeId) {
      closeDrawer();
      return;
    }

    navigate(stepPath(routeState.challengeId, STEPS[currentStepIndex - 1].key));
  };

  const handleSaveCurrentStep = async () => {
    let localUploadFailed = false;

    try {
      validateStep(routeState.stepKey, form);

      if (!routeState.challengeId) {
        const createdChallenge = await createCustomChallenge(
          buildCreatePayload(form),
          form.imageFile,
        );
        if (!createdChallenge?.id) {
          throw new Error("Yaratilgan challenge ID qaytmadi");
        }
        navigate(stepPath(createdChallenge.id, "metric"));
        return;
      }

      if (routeState.stepKey === "participants") {
        if (form.participants.length > 0) {
          await inviteFriends(routeState.challengeId, { userIds: form.participants });
        }
        navigate(`/user/challenges/${routeState.challengeId}`);
        return;
      }

      const payload = buildPatchPayload(routeState.stepKey, form);
      if (isExistingBasic && form.imageFile) {
        const imageId = await uploadChallengeImage(form.imageFile).catch((error) => {
          localUploadFailed = true;
          throw error;
        });
        if (imageId) {
          payload.imageId = imageId;
        }
      }

      await updateChallenge(routeState.challengeId, payload);
      const nextStep = STEPS[currentStepIndex + 1]?.key;
      navigate(
        nextStep
          ? stepPath(routeState.challengeId, nextStep)
          : `/user/challenges/${routeState.challengeId}`,
      );
    } catch (error) {
      if (!error?.response || localUploadFailed) {
        toast.error(error?.message || "Ma'lumotlarni saqlab bo'lmadi");
      }
    }
  };

  const renderStep = () => {
    if (routeState.stepKey === "metric") {
      return <StepMetric form={form} setForm={setForm} />;
    }
    if (routeState.stepKey === "duration") {
      return <StepDuration form={form} setForm={setForm} />;
    }
    if (routeState.stepKey === "reward") {
      return <StepReward form={form} setForm={setForm} />;
    }
    if (routeState.stepKey === "participants") {
      return <StepParticipants form={form} setForm={setForm} />;
    }

    return (
      <StepBasics
        form={form}
        setForm={setForm}
        imagePreviewUrl={form.imagePreviewUrl}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
      />
    );
  };

  return (
    <Drawer
      open
      direction="bottom"
      shouldScaleBackground={false}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-w-2xl">
        <DrawerHeader className="border-b text-left">
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
              <DrawerTitle>Chellenj yaratish</DrawerTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {STEPS[currentStepIndex]?.label} · {currentStepIndex + 1}/{STEPS.length}
              </p>
              <div className="mt-3 flex gap-1.5">
                {STEPS.map((step, index) => (
                  <span
                    key={step.key}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      index <= currentStepIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-4 py-5">{renderStep()}</DrawerBody>

        <DrawerFooter className="border-t sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="sm:flex-1"
            onClick={handleBack}
            disabled={isSaving}
          >
            Orqaga
          </Button>
          <Button
            type="button"
            className="sm:flex-1"
            onClick={handleSaveCurrentStep}
            disabled={isSaving || (routeState.stepKey === "participants" && !form.rulesAccepted)}
          >
            {isSaving ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" /> : null}
            {routeState.stepKey === "participants" ? "Yakunlash" : "Keyingi"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
