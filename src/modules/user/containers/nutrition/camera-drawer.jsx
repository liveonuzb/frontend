import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import {
  BarcodeIcon,
  ChevronUpIcon,
  FlipHorizontalIcon,
  ImageIcon,
  KeyboardIcon,
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
import {
  useSavedMeals,
  useSavedMealsActions,
} from "@/hooks/app/use-saved-meals";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
} from "./meal-draft-review-utils.js";
import {
  trackNutritionScanFailed,
  trackNutritionScanReviewed,
  trackNutritionScanStarted,
} from "./scan-review-analytics.js";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";
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
import CameraResultDrawer from "./camera-result-drawer.jsx";
import {
  getAiAccessStatus,
  isAiAccessLimitError,
  useAiAccessStatus,
} from "@/hooks/app/use-ai-access";

import filter from "lodash/filter";
import find from "lodash/find";
import forEach from "lodash/forEach";
import isArray from "lodash/isArray";
import map from "lodash/map";
import lodashToNumber from "lodash/toNumber";
import some from "lodash/some";
import trim from "lodash/trim";
import take from "lodash/take";

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

const toStrictNumber = (value) => {
  const normalized = lodashToNumber(value);
  return Number.isFinite(normalized) ? normalized : null;
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

const hasLowConfidenceDraft = (items = []) =>
  some(items, (item) => {
    const confidence = toNumber(item?.confidence, 1);

    return Boolean(item?.reviewNeeded) || confidence < 0.75;
  });

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
                  <img
                    loading="lazy"
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
        <span>Oxirgi ovqatlar</span>
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

    const enumerateDevices = navigator.mediaDevices?.enumerateDevices?.();
    enumerateDevices
      ?.then((devices) => {
        setHasMultipleCams(
          filter(devices, (device) => device.kind === "videoinput").length > 1,
        );
      })
      .catch(() => {
        // Device enumeration is best-effort; capture can still proceed.
      });

    if (navigator.mediaDevices?.getUserMedia) {
      startCamera("environment");
    }

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
    if (isPhotoScanDisabled) {
      onCapture("");
      return;
    }

    if (!videoRef.current || !ready || isScanning) return;

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

  const handleGalleryClick = useCallback(() => {
    if (isPhotoScanDisabled) {
      onCapture("");
      return;
    }

    fileInputRef.current?.click();
  }, [isPhotoScanDisabled, onCapture]);

  const handleGalleryChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

      if (isPhotoScanDisabled) {
        onCapture("");
        return;
      }

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
        className="relative w-full max-h-[58vh] overflow-hidden rounded-2xl bg-black"
        style={{ aspectRatio: "4 / 5" }}
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
            aria-label="Kamera ko'rinishi"
            className="size-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black opacity-40 pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative size-64 transition-all duration-500">
            <div className="absolute top-0 left-0 size-8 rounded-tl-lg border-t-[3px] border-l-[3px] border-primary" />
            <div className="absolute top-0 right-0 size-8 rounded-tr-lg border-t-[3px] border-r-[3px] border-primary" />
            <div className="absolute bottom-0 left-0 size-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-primary" />
            <div className="absolute right-0 bottom-0 size-8 rounded-br-lg border-r-[3px] border-b-[3px] border-primary" />

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
              scanMode === "camera"
                ? "bg-white text-foreground"
                : "text-white/75",
            )}
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => onScanModeChange("barcode")}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              scanMode === "barcode"
                ? "bg-white text-foreground"
                : "text-white/75",
            )}
          >
            Shtrix-kod
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
            aria-label="Galereyadan rasm tanlash"
            className="hidden"
            onChange={handleGalleryChange}
          />
          <button
            type="button"
            onClick={handleGalleryClick}
            disabled={isScanning || scanMode === "barcode"}
            aria-disabled={
              isPhotoScanDisabled || isScanning || scanMode === "barcode"
            }
            className={cn(
              "flex min-w-16 flex-col items-center gap-1.5 text-foreground transition-transform active:scale-95 disabled:opacity-50",
              isPhotoScanDisabled ? "opacity-50" : null,
            )}
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageIcon className="size-5" />
            </span>
            <span className="text-xs font-bold tracking-wide">Galereya</span>
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
            !isPhotoScanDisabled &&
            (!ready || isScanning)
          }
          aria-disabled={
            scanMode === "camera" &&
            (isPhotoScanDisabled || !ready || isScanning)
          }
          aria-label={
            scanMode === "barcode" ? "AI rejimiga qaytish" : "Rasmga olish"
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
            <span className="text-xs font-bold tracking-wide">Matn</span>
          </button>
        </div>
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
  isStackedChildOpen = false,
  initialMode = "camera",
}) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const user = useAuthStore((state) => state.user);
  const dayjsLocale = resolveDayjsLocale(currentLanguage);
  const mealDateMinKey = getMealDateStartKey(user, dateKey);
  const aiScanRequestRef = useRef(0);
  const barcodeLookupRequestRef = useRef(0);
  const resultDrawerOpenRef = useRef(false);
  const [view, setView] = useState("camera");
  const [scanMode, setScanMode] = useState(initialMode);
  const [resultDrawerOpen, setResultDrawerOpen] = useState(false);
  const [resultType, setResultType] = useState(null);
  const [aiResultStatus, setAiResultStatus] = useState("idle");
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
    dateKey: clampMealDateKey(
      dateKey || getDateKey(new Date()),
      mealDateMinKey,
    ),
    ...getTimePartsFromDate(),
  }));
  const { access: aiAccess } = useAiAccessStatus({ enabled: open });
  const photoScanCreditStatus = getAiAccessStatus({
    access: aiAccess,
  });

  const { addMeal: addMealAction } = useDailyTrackingActions();
  const { createSavedMeal } = useSavedMealsActions();
  const { lookupFoodByBarcode, isLookingUp: isBarcodeLookingUp } =
    useFoodBarcodeLookup();
  const { items: recentMeals, isLoading: isRecentMealsLoading } = useSavedMeals(
    {
      enabled: open && view === "camera",
    },
  );
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
  const setResultDrawerVisibility = useCallback((nextOpen) => {
    resultDrawerOpenRef.current = nextOpen;
    setResultDrawerOpen(nextOpen);
  }, []);

  /*
   * Opening/closing this drawer intentionally resets transient scan and copy
   * state so stale camera or meal data is never shown in a new flow.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    setView("camera");
    aiScanRequestRef.current += 1;
    barcodeLookupRequestRef.current += 1;
    setScanMode(initialMode);
    setResultDrawerVisibility(false);
    setResultType(null);
    setAiResultStatus("idle");
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
  }, [dateKey, initialMode, mealDateMinKey, open, setResultDrawerVisibility]);

  useEffect(() => {
    setCopyMealTime((current) => {
      const nextDateKey = clampMealDateKey(current.dateKey, mealDateMinKey);
      if (nextDateKey === current.dateKey) return current;

      return { ...current, dateKey: nextDateKey };
    });
  }, [mealDateMinKey]);

  useEffect(() => {
    if (!open) {
      aiScanRequestRef.current += 1;
      barcodeLookupRequestRef.current += 1;
      setView("camera");
      setScanMode(initialMode);
      setResultDrawerVisibility(false);
      setResultType(null);
      setAiResultStatus("idle");
      setRecentMealsOpen(false);
      setMealTimeOpen(false);
    }
  }, [initialMode, open, setResultDrawerVisibility]);

  useEffect(() => {
    if (!recentMealsOpen || selectedRecentMealId || recentMeals.length === 0) {
      return;
    }

    setSelectedRecentMealId(recentMeals[0].id);
  }, [recentMeals, recentMealsOpen, selectedRecentMealId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCapture = async (dataUrl) => {
    if (photoScanCreditStatus.isDisabled) {
      toast.error(
        "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring.",
      );
      return;
    }

    const requestId = aiScanRequestRef.current + 1;
    aiScanRequestRef.current = requestId;

    setCapturedImage(dataUrl);
    setCapturedImageUrl(null);
    setScannedItems([]);
    setScanError(null);
    setResultType("ai");
    setAiResultStatus("uploading");
    setResultDrawerVisibility(true);
    void trackNutritionScanStarted({
      sourceType: "camera",
      mode: "image",
    });

    let scanPhase = "upload";

    try {
      const uploadedImageUrl = await uploadMealCapture(dataUrl);
      if (aiScanRequestRef.current !== requestId) return;
      setCapturedImageUrl(uploadedImageUrl);
      setAiResultStatus("analyzing");
      scanPhase = "analysis";

      const response = await analyzeMealImageDraft({
        imageUrl: uploadedImageUrl,
      });
      if (aiScanRequestRef.current !== requestId) return;
      const items = isArray(response?.items) ? response.items : [];

      setScannedItems(items);
      if (items.length === 0) {
        setScanError("AI bu rasm uchun draft tayyorlay olmadi.");
      }
      setAiResultStatus(
        items.length > 0
          ? hasLowConfidenceDraft(items)
            ? "low-confidence"
            : "ready"
          : "empty",
      );
    } catch (error) {
      if (aiScanRequestRef.current !== requestId) return;
      const message = isAiAccessLimitError(error)
        ? "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring."
        : error?.response?.data?.message ||
          "Ovqatni AI orqali aniqlab bo'lmadi";
      setScanError(message);
      setAiResultStatus("error");
      void trackNutritionScanFailed({
        sourceType: "camera",
        reason: isAiAccessLimitError(error)
          ? "ai_access_limit"
          : scanPhase === "upload"
            ? "upload_failed"
            : "analysis_failed",
      });
      toast.error(message);
    }
  };

  const handleRetake = useCallback(() => {
    aiScanRequestRef.current += 1;
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setScannedItems([]);
    setScanError(null);
    setAiResultStatus("idle");
    setResultDrawerVisibility(false);
    setResultType(null);
  }, [setResultDrawerVisibility]);

  const resetBarcodeScanner = useCallback(() => {
    barcodeLookupRequestRef.current += 1;
    setScannedBarcode("");
    setBarcodeFood(null);
    setBarcodeAmount(100);
    setBarcodeStatus("scanning");
    setResultDrawerVisibility(false);
    setResultType(null);
    setBarcodeScannerKey((current) => current + 1);
  }, [setResultDrawerVisibility]);

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
    async (code, options = {}) => {
      const normalizedCode = trim(String(code || ""));

      if (
        !normalizedCode ||
        barcodeStatus === "loading" ||
        (!options.retry && barcodeStatus !== "scanning")
      ) {
        return;
      }

      const requestId = barcodeLookupRequestRef.current + 1;
      barcodeLookupRequestRef.current = requestId;

      setScannedBarcode(normalizedCode);
      setResultType("barcode");
      setResultDrawerVisibility(true);
      setBarcodeStatus("loading");
      setBarcodeFood(null);

      try {
        const food = await lookupFoodByBarcode(normalizedCode);
        if (barcodeLookupRequestRef.current !== requestId) return;

        if (!food) {
          setBarcodeStatus("not-found");
          return;
        }

        setBarcodeFood(food);
        setBarcodeAmount(food.defaultAmount || 100);
        setBarcodeStatus("found");
      } catch (error) {
        if (barcodeLookupRequestRef.current !== requestId) return;
        if (error?.response?.status === 404) {
          setBarcodeStatus("not-found");
          return;
        }

        setBarcodeStatus("error");
        toast.error("Shtrix-kod bo'yicha ovqatni tekshirib bo'lmadi");
      }
    },
    [barcodeStatus, lookupFoodByBarcode, setResultDrawerVisibility],
  );

  const handleBarcodeRetry = useCallback(() => {
    if (!scannedBarcode) return;
    void handleBarcodeScan(scannedBarcode, { retry: true });
  }, [handleBarcodeScan, scannedBarcode]);

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
      setResultDrawerVisibility(false);
      setResultType(null);
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
    setResultDrawerVisibility,
  ]);

  const handleAddManualBarcodeFood = useCallback(async () => {
    const name = trim(barcodeManualFood.name);
    const grams = toStrictNumber(barcodeManualFood.grams);
    const cal = toStrictNumber(barcodeManualFood.cal);
    const protein = toStrictNumber(barcodeManualFood.protein);
    const carbs = toStrictNumber(barcodeManualFood.carbs);
    const fat = toStrictNumber(barcodeManualFood.fat);

    if (!name) {
      toast.error("Ovqat nomini kiriting");
      return;
    }
    if (grams == null || grams <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    if (
      cal == null ||
      protein == null ||
      carbs == null ||
      fat == null ||
      cal < 0 ||
      protein < 0 ||
      carbs < 0 ||
      fat < 0
    ) {
      toast.error("Kaloriya va makro qiymatlar 0 yoki undan katta bo'lishi kerak");
      return;
    }

    try {
      await addMealAction(dateKey, mealType, {
        id: `barcode-${scannedBarcode || Date.now()}`,
        name,
        barcode: scannedBarcode || null,
        source: "barcode-manual",
        qty: 1,
        grams,
        unit: barcodeManualFood.unit || "g",
        cal: Math.round(cal),
        protein,
        carbs,
        fat,
        addedAt: loggedAt || undefined,
        addedFromPlan: false,
      });
      toast.success(`${name} qo'shildi!`);
      setResultDrawerVisibility(false);
      setResultType(null);
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
    setResultDrawerVisibility,
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
            : item,
        ),
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
          : item,
      ),
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
          : item,
      ),
    );
  }, []);

  const handleRemoveItem = useCallback((draftId) => {
    setScannedItems((current) =>
      filter(current, (item) => item.id !== draftId),
    );
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
          : item,
      ),
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
      void trackNutritionScanReviewed({
        sourceType: "camera",
        action: "saved",
        items: scannedItems,
      });
      setResultDrawerVisibility(false);
      setResultType(null);
      setAiResultStatus("idle");
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
    const selectedMeal = find(
      recentMeals,
      (meal) => meal.id === selectedRecentMealId,
    );

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
      toast.error("Oxirgi ovqatni qo'shib bo'lmadi");
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

  const handleResultDrawerOpenChange = useCallback(
    (nextOpen) => {
      setResultDrawerVisibility(nextOpen);
      if (nextOpen) return;

      if (resultType === "barcode") {
        resetBarcodeScanner();
        return;
      }

      handleRetake();
    },
    [handleRetake, resetBarcodeScanner, resultType, setResultDrawerVisibility],
  );

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (
            nextOpen ||
            isStackedChildOpen ||
            resultDrawerOpenRef.current ||
            resultDrawerOpen ||
            recentMealsOpen ||
            mealTimeOpen
          ) {
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
          <DrawerHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-3 text-center">
            <div className="flex w-full flex-col items-center gap-1">
              <DrawerTitle className="text-base font-semibold">
                {scanMode === "barcode"
                  ? "Shtrix-kod skanerlash"
                  : "Ovqatni aniqlash"}
              </DrawerTitle>
              <DrawerDescription>
                {scanMode === "barcode"
                  ? "Shtrix-kodni kadr ichiga joylashtiring."
                  : "Ovqatni kadr ichiga joylashtiring va AI uchun rasm oling."}
              </DrawerDescription>
            </div>
          </DrawerHeader>

          <DrawerBody className="px-5 pt-4 pb-8">
            <AnimatePresence mode="wait">
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
              </motion.div>
            </AnimatePresence>
          </DrawerBody>
        </NutritionDrawerContent>

        <CameraResultDrawer
          open={resultDrawerOpen}
          resultType={resultType}
          onOpenChange={handleResultDrawerOpenChange}
          ai={{
            status: aiResultStatus,
            items: scannedItems,
            imageUrl: capturedImage,
            scanError,
            goals,
            saveToMyMeals,
            onSaveToMyMealsChange: setSaveToMyMeals,
            onRetake: handleRetake,
            onIngredientUpdate: handleIngredientUpdate,
            onIngredientRemove: handleIngredientRemove,
            onIngredientAdd: handleIngredientAdd,
            onRemove: handleRemoveItem,
            onConfirm: handleConfirmItem,
            onSave: handleSave,
            isSaving,
            isAnalyzing: isAnalyzingDraftImage,
            isUploading: isUploadingCapture,
          }}
          barcode={{
            amount: barcodeAmount,
            foundFood: barcodeFood,
            foundMacros: barcodeMacros,
            isLookingUp: isBarcodeLookingUp,
            manualFood: barcodeManualFood,
            onAddFoundFood: handleAddBarcodeFood,
            onAddManualFood: handleAddManualBarcodeFood,
            onAmountChange: setBarcodeAmount,
            onManualFieldChange: handleBarcodeManualFieldChange,
            onReset: resetBarcodeScanner,
            onRetry: handleBarcodeRetry,
            scannedCode: scannedBarcode,
            status: barcodeStatus,
          }}
        />
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
