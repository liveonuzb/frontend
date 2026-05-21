import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  BarcodeIcon,
  CheckIcon,
  ChevronUpIcon,
  FlipHorizontalIcon,
  ImageIcon,
  KeyboardIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  RefreshCcwIcon,
  XIcon,
  ZapIcon,
  ZapOffIcon,
} from "lucide-react";
import BarcodeScanner from "@/components/barcode-scanner";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils.js";
import useLanguageStore from "@/store/language-store";
import { useAuthStore } from "@/store";
import {
  useFoodBarcodeLookup,
  useFoodScan,
} from "@/hooks/app/use-food-catalog";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { toast } from "sonner";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  useSavedMeals,
  useSavedMealsActions,
} from "@/hooks/app/use-saved-meals";
import { MealDraftCard, MealDraftSummaryCard } from "./meal-draft-review.jsx";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
} from "./meal-draft-review-utils.js";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";
import SaveToMyMealsButton from "./save-to-my-meals-button.jsx";
import MealDateTimeDrawer from "./meal-date-time-drawer.jsx";
import {
  clampMealDateKey,
  formatMealTime,
  getDateKey,
  getMealDateStartKey,
  getTimePartsFromDate,
  resolveDayjsLocale,
  toMealDateTimeIso,
} from "./meal-date-time-utils.js";
import RecentMealsDrawer from "./recent-meals-drawer.jsx";
import { AiCreditStatusText } from "@/components/ai-credits";
import {
  AI_CREDIT_FEATURES,
  getAiCreditStatus,
  isAiCreditsExhaustedError,
  useAiCreditCosts,
  useAiCreditWallet,
} from "@/hooks/app/use-ai-credits";

import {
  filter,
  find,
  forEach,
  isArray,
  map,
  toNumber as lodashToNumber,
  trim,
  take,
} from "lodash";

const buildLoggedMealFromSavedMeal = (savedMeal, addedAt) => ({
  name: savedMeal.name,
  source: "saved-meal",
  savedMealId: savedMeal.id,
  cal: savedMeal.calories,
  protein: savedMeal.protein,
  carbs: savedMeal.carbs,
  fat: savedMeal.fat,
  fiber: savedMeal.fiber,
  grams: savedMeal.grams,
  image: savedMeal.imageUrl,
  ingredients: savedMeal.ingredients,
  addedAt,
});

const toNumber = (value, fallback = 0) => {
  const normalized = lodashToNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const getSliderMax = (food) => {
  const unit = food?.unit || "g";
  const isUnit = unit !== "g" && unit !== "ml";
  return isUnit ? (food?.step || 1) * 20 : 1000;
};

const calcMacros = (food, amount) => {
  const unit = food?.unit || "g";
  const isUnit = unit !== "g" && unit !== "ml";
  const factor = isUnit ? amount / (food.defaultAmount || 1) : amount / 100;

  return {
    cal: Math.round((food?.baseCal ?? food?.cal ?? 0) * factor),
    protein: Math.round((food?.baseProtein ?? food?.protein ?? 0) * factor),
    carbs: Math.round((food?.baseCarbs ?? food?.carbs ?? 0) * factor),
    fat: Math.round((food?.baseFat ?? food?.fat ?? 0) * factor),
  };
};

const barcodeMacroInputs = [
  { key: "cal", label: "Kcal" },
  { key: "protein", label: "Oqsil" },
  { key: "carbs", label: "Uglevod" },
  { key: "fat", label: "Yog'" },
];

const RecentMealsPill = ({ meals = [], isLoading = false, onOpen }) => {
  if (!isLoading && meals.length === 0) return null;

  const previewMeals = take(meals, 2);

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-12 items-center gap-3 rounded-full border bg-background/95 px-4 text-sm font-black text-foreground shadow-sm transition-transform active:scale-95"
      >
        <span className="flex -space-x-2">
          {previewMeals.length > 0 ? (
            map(previewMeals, (meal) => (
              <span
                key={meal.id}
                className="flex size-8 overflow-hidden rounded-full border-2 border-background bg-muted"
              >
                {meal.imageUrl ? (
                  <img loading="lazy"
                    src={meal.imageUrl}
                    alt={meal.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-xs">
                    🍽️
                  </span>
                )}
              </span>
            ))
          ) : (
            <span className="grid size-8 place-items-center rounded-full border-2 border-background bg-muted text-xs">
              ...
            </span>
          )}
        </span>
        <span>Recent meals</span>
        <ChevronUpIcon className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
};

const ScanCameraView = ({
  isActive,
  scanMode,
  onScanModeChange,
  scannerKey,
  onBarcodeScan,
  isBarcodeLocked,
  onCapture,
  onOpenText,
  isPhotoScanDisabled = false,
  recentMeals,
  isRecentMealsLoading,
  onOpenRecentMeals,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [hasMultipleCams, setHasMultipleCams] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const stopCamera = useCallback(() => {
    forEach(streamRef.current?.getTracks(), (track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
    setFlashOn(false);
    setHasFlash(false);
  }, []);

  const startCamera = useCallback(
    async (facingMode) => {
      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        setHasFlash(!!caps?.torch);
      } catch {
        toast.error("Kameraga ruxsat berilmagan yoki kamera topilmadi.");
      }
    },
    [stopCamera],
  );

  /*
   * Camera lifecycle cleanup must synchronously stop tracks and reset transient
   * capture flags when the drawer mode changes.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isActive || scanMode !== "camera") {
      stopCamera();
      return undefined;
    }

    navigator.mediaDevices
      .enumerateDevices?.()
      .then((devices) => {
        setHasMultipleCams(
          filter(devices, (device) => device.kind === "videoinput").length > 1,
        );
      })
      .catch(() => {
        // Device enumeration is best-effort; capture can still proceed.
      });

    startCamera("environment");

    return stopCamera;
  }, [isActive, scanMode, startCamera, stopCamera]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const switchCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startCamera(next);
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      const next = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    } catch {
      // Torch support is optional and varies by browser/device.
    }
  };

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !ready || isScanning || isPhotoScanDisabled) return;

    setIsScanning(true);

    setTimeout(() => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      stopCamera();
      setIsScanning(false);
      onCapture(canvas.toDataURL("image/jpeg", 0.85));
    }, 1500);
  }, [isPhotoScanDisabled, isScanning, onCapture, ready, stopCamera]);

  const handleGalleryChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || isPhotoScanDisabled) return;

      if (!file.type?.startsWith("image/")) {
        toast.error("Iltimos, rasm faylini tanlang.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) {
          toast.error("Rasmni o'qib bo'lmadi.");
          return;
        }

        stopCamera();
        onCapture(dataUrl);
      };
      reader.onerror = () => toast.error("Rasmni o'qib bo'lmadi.");
      reader.readAsDataURL(file);
    },
    [isPhotoScanDisabled, onCapture, stopCamera],
  );

  const handleOpenText = useCallback(() => {
    onOpenText?.();
  }, [onOpenText]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-black"
        style={{ aspectRatio: "3/4" }}
      >
        {scanMode === "barcode" ? (
          <BarcodeScanner
            key={scannerKey}
            onScan={onBarcodeScan}
            onClose={() => onScanModeChange("camera")}
            showClose={false}
            showTopBar={false}
            showHint={false}
            showFrame={false}
            className="h-full min-h-0"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black opacity-40 pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-64 w-64 transition-all duration-500">
            <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-[3px] border-l-[3px] border-primary" />
            <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-[3px] border-r-[3px] border-primary" />
            <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-primary" />
            <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-r-[3px] border-b-[3px] border-primary" />

            {isScanning || isBarcodeLocked ? (
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
                className="absolute right-0 left-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_3px_theme('colors.primary.DEFAULT')]"
              />
            ) : null}
          </div>
        </div>

        <div className="absolute top-3 left-1/2 z-10 grid -translate-x-1/2 grid-cols-2 rounded-full border border-white/15 bg-black/45 p-1 text-[11px] font-black text-white shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => onScanModeChange("camera")}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              scanMode === "camera" ? "bg-white text-foreground" : "text-white/75",
            )}
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => onScanModeChange("barcode")}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              scanMode === "barcode" ? "bg-white text-foreground" : "text-white/75",
            )}
          >
            Barcode
          </button>
        </div>

        {hasFlash && scanMode === "camera" ? (
          <button
            type="button"
            onClick={toggleFlash}
            className={cn(
              "absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-all",
              flashOn ? "bg-yellow-400 text-black" : "bg-black/50 text-white",
            )}
          >
            {flashOn ? (
              <ZapIcon className="size-4 fill-current" />
            ) : (
              <ZapOffIcon className="size-4" />
            )}
          </button>
        ) : null}

        {hasMultipleCams && scanMode === "camera" ? (
          <button
            type="button"
            onClick={switchCamera}
            className="absolute top-3 left-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform active:scale-90"
            aria-label="Kamerani almashtirish"
          >
            <FlipHorizontalIcon className="size-5" />
          </button>
        ) : null}

        <div className="absolute right-0 bottom-5 left-0 z-10">
          {scanMode === "barcode" ? (
            <div className="mx-auto max-w-[280px] rounded-full border border-white/15 bg-black/50 px-4 py-2 text-center text-xs font-bold text-white shadow-lg backdrop-blur-md">
              Shtrix-kodni marker ichida ushlab turing
            </div>
          ) : (
            <RecentMealsPill
              meals={recentMeals}
              isLoading={isRecentMealsLoading}
              onOpen={onOpenRecentMeals}
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 px-7 pb-1">
        <div className="flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning || isPhotoScanDisabled || scanMode === "barcode"}
            className="flex min-w-16 flex-col items-center gap-1.5 text-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageIcon className="size-5" />
            </span>
            <span className="text-xs font-bold tracking-wide">Gallery</span>
          </button>
        </div>

        <button
          type="button"
          onClick={
            scanMode === "barcode"
              ? () => onScanModeChange("camera")
              : handleCapture
          }
          disabled={
            scanMode === "camera" &&
            (isPhotoScanDisabled || !ready || isScanning)
          }
          aria-disabled={
            scanMode === "camera" && (isPhotoScanDisabled || !ready || isScanning)
          }
          className="flex size-[72px] items-center justify-center rounded-full border-[5px] border-muted bg-background shadow-sm ring-1 ring-border transition-transform active:scale-95 disabled:opacity-40"
        >
          {scanMode === "barcode" ? (
            <BarcodeIcon className="size-7 text-foreground" />
          ) : (
            <div className="size-12 rounded-full bg-foreground" />
          )}
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleOpenText}
            disabled={isScanning || scanMode === "barcode"}
            className="flex min-w-16 flex-col items-center gap-1.5 text-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <KeyboardIcon className="size-5" />
            </span>
            <span className="text-xs font-bold tracking-wide">Type</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AnalyzeView = ({ imageUrl, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = ["Scanning plate.", "Estimating portions..."];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden bg-[#f6f6fa] px-6 text-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-10 grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-black/5"
        aria-label="Yopish"
      >
        <XIcon className="size-7" />
      </button>

      <div className="relative mt-6 size-72 overflow-hidden rounded-full bg-muted md:size-80">
        {imageUrl ? (
          <img loading="lazy"
            src={imageUrl}
            alt="Scan qilinayotgan rasm"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-5xl">🍽️</div>
        )}
        <motion.div
          className="absolute inset-x-0 top-0 h-1/2 bg-white/70 backdrop-blur-[1px]"
          animate={{ y: ["-90%", "180%"] }}
          transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
        />
      </div>

      <div className="mt-16 space-y-2">
        <AnimatePresence mode="wait">
          <motion.h3
            key={steps[stepIndex]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-2xl font-black tracking-tight text-foreground"
          >
            {steps[stepIndex]}
          </motion.h3>
        </AnimatePresence>
        <p className="text-lg font-semibold tracking-wide text-muted-foreground">
          Powered by AI ✨
        </p>
      </div>

      <div className="relative mt-16 h-36 w-48">
        <div className="absolute left-8 top-0 size-24 rotate-[-18deg] rounded-full bg-foreground" />
        <div className="absolute right-8 top-0 size-24 rotate-[18deg] rounded-full bg-foreground" />
        <div className="absolute inset-x-4 top-7 h-32 rounded-[48%] bg-[#d8d9e5] ring-8 ring-foreground">
          <div className="absolute left-8 top-8 size-8 rounded-full bg-white">
            <div className="absolute left-2 top-2 size-3 rounded-full bg-foreground" />
          </div>
          <div className="absolute right-8 top-8 size-8 rounded-full bg-white">
            <div className="absolute left-2 top-2 size-3 rounded-full bg-foreground" />
          </div>
          <div className="absolute left-16 top-16 h-4 w-6 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
};

const NoFoodView = ({ onRetry }) => (
  <div className="flex min-h-[78vh] flex-col bg-[#fee3c9] px-9 py-8">
    <div className="mt-16 space-y-4">
      <p className="text-lg font-black text-foreground/45">Sirko says</p>
      <h3 className="max-w-sm text-4xl font-black leading-tight tracking-tight text-foreground">
        Hmm, I don&apos;t think that&apos;s food. Let&apos;s try something
        edible, shall we?
      </h3>
    </div>

    <div className="relative mt-auto flex flex-col items-center">
      <div className="relative h-72 w-72">
        <div className="absolute left-8 top-10 h-28 w-24 -rotate-12 rounded-full bg-foreground" />
        <div className="absolute right-8 top-10 h-28 w-24 rotate-12 rounded-full bg-foreground" />
        <div className="absolute inset-x-6 top-20 h-40 rounded-[45%] bg-[#cacbd6] ring-8 ring-foreground">
          <div className="absolute left-12 top-9 size-16 rounded-full bg-white ring-8 ring-foreground">
            <div className="absolute left-6 top-6 size-3 rounded-full bg-foreground" />
          </div>
          <div className="absolute right-10 top-12 h-10 w-16 rounded-full border-t-8 border-foreground" />
          <div className="absolute left-32 top-24 h-7 w-12 -rotate-12 rounded-full bg-foreground" />
        </div>
        <div className="absolute bottom-2 left-24 h-24 w-24 rounded-b-full bg-[#cacbd6] ring-8 ring-foreground" />
      </div>

      <Button
        type="button"
        className="mb-3 h-14 w-64 rounded-full bg-foreground text-base font-black text-background hover:bg-foreground/90"
        onClick={onRetry}
      >
        Try other meal
      </Button>
    </div>
  </div>
);

const ResultView = ({
  items,
  imageUrl,
  scanError,
  goals,
  onRetake,
  onIngredientUpdate,
  onIngredientRemove,
  onIngredientAdd,
  onRemove,
  onConfirm,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {imageUrl ? (
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-muted"
          style={{ aspectRatio: "4/3" }}
        >
          <img loading="lazy"
            src={imageUrl}
            alt="Ovqat rasmi"
            className="h-full max-h-[320px] w-full object-cover"
          />
          <button
            type="button"
            onClick={onRetake}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          >
            <RefreshCwIcon className="size-4" />
          </button>
        </div>
      ) : null}
      <div className="space-y-3">
        <MealDraftSummaryCard
          items={items}
          goals={goals}
          emptyTitle="Ovqat aniqlanmadi"
          emptyDescription={
            scanError ||
            "Rasmni qayta olib ko'ring yoki boshqa burchakdan oling."
          }
        />
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {map(items, (item) => (
            <MealDraftCard
              key={item.id}
              item={item}
              onIngredientUpdate={(ingredientId, ingredient) =>
                onIngredientUpdate(item.id, ingredientId, ingredient)
              }
              onIngredientRemove={(ingredientId) =>
                onIngredientRemove(item.id, ingredientId)
              }
              onIngredientAdd={(ingredient) =>
                onIngredientAdd(item.id, ingredient)
              }
              onRemove={() => onRemove(item.id)}
              onConfirm={() => onConfirm(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
          Bu rasm uchun AI draft tayyorlab bo&apos;lmadi.
        </div>
      )}
    </div>
  );
};

const BarcodeLookupPanel = ({
  amount,
  foundFood,
  foundMacros,
  isLookingUp,
  manualFood,
  onAddFoundFood,
  onAddManualFood,
  onAmountChange,
  onManualFieldChange,
  onReset,
  scannedCode,
  status,
}) => {
  if (status === "scanning") return null;

  if (status === "loading" || isLookingUp) {
    return (
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2Icon className="size-5 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-black">Barcode tekshirilmoqda</p>
            <p className="text-xs text-muted-foreground">{scannedCode}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "found" && foundFood && foundMacros) {
    return (
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-3xl bg-muted flex items-center justify-center">
            {foundFood.image ? (
              <img
                src={foundFood.image}
                alt={foundFood.name}
                className="size-full object-cover"
              />
            ) : (
              <BarcodeIcon className="size-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
              <CheckIcon className="size-3" />
              Topildi
            </div>
            <h3 className="truncate text-lg font-black">{foundFood.name}</h3>
            <p className="text-xs font-semibold text-muted-foreground">
              {scannedCode}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {map([
            ["Kcal", foundMacros.cal],
            ["Oqsil", `${foundMacros.protein}g`],
            ["Uglevod", `${foundMacros.carbs}g`],
            ["Yog'", `${foundMacros.fat}g`],
          ], ([label, value]) => (
            <div key={label} className="rounded-2xl bg-muted/60 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
              <p className="text-sm font-black">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">Miqdori</span>
            <span className="text-xl font-black text-primary">
              {amount}
              {foundFood.unit || "g"}
            </span>
          </div>
          <Slider
            value={[amount]}
            min={foundFood.step || 10}
            max={getSliderMax(foundFood)}
            step={foundFood.step || 10}
            onValueChange={([value]) => onAmountChange(value)}
          />
        </div>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <Button type="button" variant="outline" size="icon" onClick={onReset}>
            <RefreshCcwIcon className="size-4" />
          </Button>
          <Button type="button" onClick={onAddFoundFood}>
            <PlusIcon className="mr-2 size-4" />
            Qo'shish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600">
          <BarcodeIcon className="size-3" />
          Topilmadi
        </div>
        <h3 className="text-lg font-black">Ovqatni qo'l bilan kiriting</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Barcode: {scannedCode || "noma'lum"}
        </p>
      </div>
      <div className="space-y-3">
        <Input
          placeholder="Ovqat nomi"
          value={manualFood.name}
          onChange={(event) => onManualFieldChange("name", event.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          {map(barcodeMacroInputs, (item) => (
            <label key={item.key} className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">
                {item.label}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                value={manualFood[item.key]}
                onChange={(event) =>
                  onManualFieldChange(item.key, event.target.value)
                }
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <label className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">
              Miqdor
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              value={manualFood.grams}
              onChange={(event) => onManualFieldChange("grams", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">
              Birlik
            </span>
            <Input
              value={manualFood.unit}
              onChange={(event) => onManualFieldChange("unit", event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
        <Button type="button" variant="outline" size="icon" onClick={onReset}>
          <RefreshCcwIcon className="size-4" />
        </Button>
        <Button type="button" onClick={onAddManualFood}>
          <PlusIcon className="mr-2 size-4" />
          Qo'l bilan qo'shish
        </Button>
      </div>
    </div>
  );
};

export default function CameraDrawer({
  dateKey,
  loggedAt = null,
  mealType,
  open,
  onClose,
  onOpenText,
  onInlineCapture,
  isStackedChildOpen = false,
  initialMode = "camera",
}) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const user = useAuthStore((state) => state.user);
  const dayjsLocale = resolveDayjsLocale(currentLanguage);
  const mealDateMinKey = getMealDateStartKey(user, dateKey);
  const [view, setView] = useState("camera");
  const [scanMode, setScanMode] = useState(initialMode);
  const [barcodeScannerKey, setBarcodeScannerKey] = useState(0);
  const [barcodeStatus, setBarcodeStatus] = useState("scanning");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeFood, setBarcodeFood] = useState(null);
  const [barcodeAmount, setBarcodeAmount] = useState(100);
  const [barcodeManualFood, setBarcodeManualFood] = useState({
    name: "",
    cal: "",
    protein: "0",
    carbs: "0",
    fat: "0",
    grams: "100",
    unit: "g",
  });
  const [scannedItems, setScannedItems] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToMyMeals, setSaveToMyMeals] = useState(false);
  const [recentMealsOpen, setRecentMealsOpen] = useState(false);
  const [mealTimeOpen, setMealTimeOpen] = useState(false);
  const [selectedRecentMealId, setSelectedRecentMealId] = useState(null);
  const [isCopyingRecentMeal, setIsCopyingRecentMeal] = useState(false);
  const [copyMealTime, setCopyMealTime] = useState(() => ({
    dateKey: clampMealDateKey(dateKey || getDateKey(new Date()), mealDateMinKey),
    ...getTimePartsFromDate(),
  }));
  const { wallet: aiCreditWallet } = useAiCreditWallet({ enabled: open });
  const { costs: aiCreditCosts } = useAiCreditCosts({ enabled: open });
  const photoScanCreditStatus = getAiCreditStatus({
    wallet: aiCreditWallet,
    costs: aiCreditCosts,
    feature: AI_CREDIT_FEATURES.foodPhotoScan,
  });

  const { addMeal: addMealAction } = useDailyTrackingActions();
  const { createSavedMeal } = useSavedMealsActions();
  const { lookupFoodByBarcode, isLookingUp: isBarcodeLookingUp } =
    useFoodBarcodeLookup();
  const { items: recentMeals, isLoading: isRecentMealsLoading } = useSavedMeals({
    enabled: open && view === "camera",
  });
  const {
    analyzeMealImageDraft,
    uploadMealCapture,
    isAnalyzingDraftImage,
    isUploadingCapture,
  } = useFoodScan();
  const { goals } = useHealthGoals();
  const barcodeMacros = React.useMemo(
    () => (barcodeFood ? calcMacros(barcodeFood, barcodeAmount) : null),
    [barcodeAmount, barcodeFood],
  );

  /*
   * Opening/closing this drawer intentionally resets transient scan and copy
   * state so stale camera or meal data is never shown in a new flow.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    setView("camera");
    setScanMode(initialMode);
    setBarcodeScannerKey((current) => current + 1);
    setBarcodeStatus("scanning");
    setScannedBarcode("");
    setBarcodeFood(null);
    setBarcodeAmount(100);
    setBarcodeManualFood({
      name: "",
      cal: "",
      protein: "0",
      carbs: "0",
      fat: "0",
      grams: "100",
      unit: "g",
    });
    setScannedItems([]);
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setScanError(null);
    setIsSaving(false);
    setSaveToMyMeals(false);
    setRecentMealsOpen(false);
    setMealTimeOpen(false);
    setSelectedRecentMealId(null);
    setIsCopyingRecentMeal(false);
    setCopyMealTime({
      dateKey: clampMealDateKey(
        dateKey || getDateKey(new Date()),
        mealDateMinKey,
      ),
      ...getTimePartsFromDate(),
    });
  }, [dateKey, initialMode, mealDateMinKey, open]);

  useEffect(() => {
    setCopyMealTime((current) => {
      const nextDateKey = clampMealDateKey(current.dateKey, mealDateMinKey);
      if (nextDateKey === current.dateKey) return current;

      return { ...current, dateKey: nextDateKey };
    });
  }, [mealDateMinKey]);

  useEffect(() => {
    if (!open) {
      setView("camera");
      setScanMode(initialMode);
      setRecentMealsOpen(false);
      setMealTimeOpen(false);
    }
  }, [initialMode, open]);

  useEffect(() => {
    if (!recentMealsOpen || selectedRecentMealId || recentMeals.length === 0) {
      return;
    }

    setSelectedRecentMealId(recentMeals[0].id);
  }, [recentMeals, recentMealsOpen, selectedRecentMealId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCapture = async (dataUrl) => {
    if (photoScanCreditStatus.isDisabled) {
      toast.error("AI kreditlaringiz yetarli emas. Photo scan uchun kredit kerak.");
      return;
    }

    if (onInlineCapture) {
      onInlineCapture(dataUrl);
      return;
    }

    setCapturedImage(dataUrl);
    setScannedItems([]);
    setScanError(null);
    setView("analyzing");

    try {
      const uploadedImageUrl = await uploadMealCapture(dataUrl);
      setCapturedImageUrl(uploadedImageUrl);

      const response = await analyzeMealImageDraft({
        imageUrl: uploadedImageUrl,
      });
      const items = isArray(response?.items) ? response.items : [];

      setScannedItems(items);
      if (items.length === 0) {
        setScanError("AI bu rasm uchun draft tayyorlay olmadi.");
      }
      setView("result");
    } catch (error) {
      const message = isAiCreditsExhaustedError(error)
        ? "AI kreditlaringiz yetarli emas. Photo scan uchun kredit kerak."
        : error?.response?.data?.message || "Ovqatni AI orqali aniqlab bo'lmadi";
      setScanError(message);
      setView("result");
      toast.error(message);
    }
  };

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setScannedItems([]);
    setScanError(null);
    setView("camera");
  }, []);

  const resetBarcodeScanner = useCallback(() => {
    setScannedBarcode("");
    setBarcodeFood(null);
    setBarcodeAmount(100);
    setBarcodeStatus("scanning");
    setBarcodeScannerKey((current) => current + 1);
  }, []);

  const handleScanModeChange = useCallback(
    (nextMode) => {
      setScanMode(nextMode);
      if (nextMode === "barcode") {
        resetBarcodeScanner();
      }
    },
    [resetBarcodeScanner],
  );

  const handleBarcodeScan = useCallback(
    async (code) => {
      const normalizedCode = trim(String(code || ""));

      if (!normalizedCode || barcodeStatus === "loading") {
        return;
      }

      setScannedBarcode(normalizedCode);
      setBarcodeStatus("loading");
      setBarcodeFood(null);

      try {
        const food = await lookupFoodByBarcode(normalizedCode);

        if (!food) {
          setBarcodeStatus("not-found");
          return;
        }

        setBarcodeFood(food);
        setBarcodeAmount(food.defaultAmount || 100);
        setBarcodeStatus("found");
      } catch (error) {
        if (error?.response?.status === 404) {
          setBarcodeStatus("not-found");
          return;
        }

        setBarcodeStatus("error");
        toast.error("Barcode bo'yicha ovqatni tekshirib bo'lmadi");
      }
    },
    [barcodeStatus, lookupFoodByBarcode],
  );

  const handleBarcodeManualFieldChange = useCallback((key, value) => {
    setBarcodeManualFood((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleAddBarcodeFood = useCallback(async () => {
    if (!barcodeFood || !barcodeMacros) return;

    try {
      await addMealAction(dateKey, mealType, {
        ...barcodeFood,
        source: "barcode",
        qty: 1,
        grams: barcodeAmount,
        cal: barcodeMacros.cal,
        protein: barcodeMacros.protein,
        carbs: barcodeMacros.carbs,
        fat: barcodeMacros.fat,
        addedAt: loggedAt || undefined,
        addedFromPlan: false,
      });
      toast.success(`${barcodeFood.name} qo'shildi!`);
      onClose();
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  }, [
    addMealAction,
    barcodeAmount,
    barcodeFood,
    barcodeMacros,
    dateKey,
    loggedAt,
    mealType,
    onClose,
  ]);

  const handleAddManualBarcodeFood = useCallback(async () => {
    const name = trim(barcodeManualFood.name);

    if (!name) {
      toast.error("Ovqat nomini kiriting");
      return;
    }

    try {
      await addMealAction(dateKey, mealType, {
        id: `barcode-${scannedBarcode || Date.now()}`,
        name,
        barcode: scannedBarcode || null,
        source: "barcode-manual",
        qty: 1,
        grams: Math.max(1, toNumber(barcodeManualFood.grams, 100)),
        unit: barcodeManualFood.unit || "g",
        cal: Math.max(0, Math.round(toNumber(barcodeManualFood.cal))),
        protein: Math.max(0, toNumber(barcodeManualFood.protein)),
        carbs: Math.max(0, toNumber(barcodeManualFood.carbs)),
        fat: Math.max(0, toNumber(barcodeManualFood.fat)),
        addedAt: loggedAt || undefined,
        addedFromPlan: false,
      });
      toast.success(`${name} qo'shildi!`);
      onClose();
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  }, [
    addMealAction,
    barcodeManualFood,
    dateKey,
    loggedAt,
    mealType,
    onClose,
    scannedBarcode,
  ]);

  const handleIngredientUpdate = useCallback(
    (draftId, ingredientId, ingredient) => {
      setScannedItems((current) =>
        map(current, (item) =>
          item.id === draftId
            ? {
                ...item,
                ingredients: updateMealIngredient(
                  item.ingredients,
                  ingredientId,
                  ingredient,
                ),
              }
            : item),
      );
    },
    [],
  );

  const handleIngredientRemove = useCallback((draftId, ingredientId) => {
    setScannedItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: removeMealIngredient(item.ingredients, ingredientId),
            }
          : item),
    );
  }, []);

  const handleIngredientAdd = useCallback((draftId, ingredient) => {
    setScannedItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: addMealIngredient(item.ingredients, ingredient),
            }
          : item),
    );
  }, []);

  const handleRemoveItem = useCallback((draftId) => {
    setScannedItems((current) => filter(current, (item) => item.id !== draftId));
  }, []);

  const handleConfirmItem = useCallback((draftId) => {
    setScannedItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              reviewNeeded: false,
              ingredients: isArray(item.ingredients)
                ? map(item.ingredients, (ingredient) => ({
                    ...ingredient,
                    reviewNeeded: false,
                  }))
                : [],
            }
          : item),
    );
  }, []);

  const handleSave = async () => {
    if (scannedItems.length === 0 || isSaving) return;

    setIsSaving(true);

    try {
      for (const item of scannedItems) {
        let savedMealId = null;
        if (saveToMyMeals) {
          const savedMeal = await createSavedMeal({
            name: item.title || "Ovqat",
            source: "camera",
            imageUrl: capturedImageUrl || getDraftImageUrl(item),
            ingredients: item.ingredients,
          });
          savedMealId = savedMeal.id;
        }

        await addMealAction(dateKey, mealType, {
          ...buildMealPayloadFromDraft(item, {
            source: "camera",
            image: capturedImageUrl,
            savedMealId,
            addedAt: loggedAt || undefined,
          }),
          addedFromPlan: false,
        });
      }

      toast.success(
        scannedItems.length === 1
          ? `${scannedItems[0].title} muvaffaqiyatli qo'shildi!`
          : `${scannedItems.length} ta ovqat muvaffaqiyatli qo'shildi!`,
      );
      onClose();
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRecentMeals = useCallback(() => {
    if (!selectedRecentMealId && recentMeals.length > 0) {
      setSelectedRecentMealId(recentMeals[0].id);
    }
    setRecentMealsOpen(true);
  }, [
    recentMeals,
    selectedRecentMealId,
    setRecentMealsOpen,
    setSelectedRecentMealId,
  ]);

  const handleCopyRecentMeal = useCallback(async () => {
    const selectedMeal = find(recentMeals, (meal) => meal.id === selectedRecentMealId);

    if (!selectedMeal || isCopyingRecentMeal) return;

    setIsCopyingRecentMeal(true);

    try {
      await addMealAction(
        copyMealTime.dateKey,
        mealType || "breakfast",
        buildLoggedMealFromSavedMeal(
          selectedMeal,
          toMealDateTimeIso(copyMealTime),
        ),
      );
      toast.success(`${selectedMeal.name} qo'shildi`);
      setRecentMealsOpen(false);
      onClose();
    } catch {
      toast.error("Recent mealni qo'shib bo'lmadi");
    } finally {
      setIsCopyingRecentMeal(false);
    }
  }, [
    addMealAction,
    copyMealTime,
    isCopyingRecentMeal,
    mealType,
    onClose,
    recentMeals,
    selectedRecentMealId,
    setIsCopyingRecentMeal,
    setRecentMealsOpen,
  ]);

  const isNoFoodView = view === "result" && scannedItems.length === 0;
  const showHeader = view !== "analyzing" && !isNoFoodView;

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen || isStackedChildOpen || recentMealsOpen || mealTimeOpen) {
            return;
          }
          onClose();
        }}
        direction="bottom"
      >
        <NutritionDrawerContent
          size="sm"
          className="data-[vaul-drawer-direction=bottom]:h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh]"
        >
          {showHeader ? (
            <DrawerHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-3 text-center">
              <div className="flex w-full flex-col items-center gap-1">
                {view === "result" ? (
                  <div className="flex w-full items-start justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <DrawerTitle className="truncate text-base font-semibold">
                        AI topgan ovqatlar
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground">
                        {`${scannedItems.length} ta natija · Ingredientlarni tekshiring`}
                      </DrawerDescription>
                    </div>
                    <SaveToMyMealsButton
                      checked={saveToMyMeals}
                      onCheckedChange={setSaveToMyMeals}
                    />
                  </div>
                ) : (
                  <>
                    <DrawerTitle className="text-base font-semibold">
                      {scanMode === "barcode"
                        ? "Barcode skanerlash"
                        : "Ovqatni aniqlash"}
                    </DrawerTitle>
                    <DrawerDescription>
                      {scanMode === "barcode"
                        ? "Shtrix-kodni kadr ichiga joylashtiring."
                        : "Ovqatni kadr ichiga joylashtiring va AI uchun rasm oling."}
                    </DrawerDescription>
                    {scanMode === "camera" ? (
                      <AiCreditStatusText
                        feature={AI_CREDIT_FEATURES.foodPhotoScan}
                        wallet={aiCreditWallet}
                        costs={aiCreditCosts}
                        className="justify-center"
                      />
                    ) : null}
                  </>
                )}
              </div>
            </DrawerHeader>
          ) : null}

          <DrawerBody
            className={
              view === "analyzing" || isNoFoodView
                ? "p-0"
                : "px-5 pt-4 pb-8"
            }
          >
            <AnimatePresence mode="wait">
              {view === "camera" ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScanCameraView
                    isActive={open && view === "camera"}
                    scanMode={scanMode}
                    onScanModeChange={handleScanModeChange}
                    scannerKey={barcodeScannerKey}
                    onBarcodeScan={handleBarcodeScan}
                    isBarcodeLocked={barcodeStatus !== "scanning"}
                    onCapture={handleCapture}
                    onOpenText={onOpenText}
                    isPhotoScanDisabled={photoScanCreditStatus.isDisabled}
                    recentMeals={recentMeals}
                    isRecentMealsLoading={isRecentMealsLoading}
                    onOpenRecentMeals={handleOpenRecentMeals}
                  />
                  {scanMode === "barcode" ? (
                    <div className="mt-4">
                      <BarcodeLookupPanel
                        amount={barcodeAmount}
                        foundFood={barcodeFood}
                        foundMacros={barcodeMacros}
                        isLookingUp={isBarcodeLookingUp}
                        manualFood={barcodeManualFood}
                        onAddFoundFood={handleAddBarcodeFood}
                        onAddManualFood={handleAddManualBarcodeFood}
                        onAmountChange={setBarcodeAmount}
                        onManualFieldChange={handleBarcodeManualFieldChange}
                        onReset={resetBarcodeScanner}
                        scannedCode={scannedBarcode}
                        status={barcodeStatus}
                      />
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              {view === "analyzing" ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnalyzeView imageUrl={capturedImage} onClose={onClose} />
                </motion.div>
              ) : null}

              {view === "result" ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isNoFoodView ? (
                    <NoFoodView onRetry={handleRetake} />
                  ) : (
                    <ResultView
                      items={scannedItems}
                      imageUrl={capturedImage}
                      scanError={scanError}
                      goals={goals}
                      onRetake={handleRetake}
                      onIngredientUpdate={handleIngredientUpdate}
                      onIngredientRemove={handleIngredientRemove}
                      onIngredientAdd={handleIngredientAdd}
                      onRemove={handleRemoveItem}
                      onConfirm={handleConfirmItem}
                    />
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </DrawerBody>

          {view === "result" && scannedItems.length > 0 ? (
            <DrawerFooter>
              <div className="grid w-full gap-3">
                <Button type="button" variant="outline" onClick={handleRetake}>
                  Qayta olish
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    scannedItems.length === 0 ||
                    isSaving ||
                    isAnalyzingDraftImage ||
                    isUploadingCapture
                  }
                >
                  {isSaving || isAnalyzingDraftImage || isUploadingCapture ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Saqlanmoqda
                    </>
                  ) : (
                    "Tasdiqlash va qo'shish"
                  )}
                </Button>
              </div>
            </DrawerFooter>
          ) : null}
        </NutritionDrawerContent>
      </Drawer>

      <RecentMealsDrawer
        open={recentMealsOpen}
        onOpenChange={setRecentMealsOpen}
        meals={recentMeals}
        isLoading={isRecentMealsLoading}
        selectedMealId={selectedRecentMealId}
        onSelectMeal={setSelectedRecentMealId}
        mealTimeLabel={formatMealTime(copyMealTime, dayjsLocale)}
        onOpenTime={() => setMealTimeOpen(true)}
        onCopy={handleCopyRecentMeal}
        isCopying={isCopyingRecentMeal}
      />

      <MealDateTimeDrawer
        open={mealTimeOpen}
        onOpenChange={setMealTimeOpen}
        value={copyMealTime}
        onChange={setCopyMealTime}
        onDone={() => setMealTimeOpen(false)}
        locale={dayjsLocale}
        minDateKey={mealDateMinKey}
      />
    </>
  );
}
