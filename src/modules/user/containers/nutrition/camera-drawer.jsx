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
  FlipHorizontalIcon,
  ImageIcon,
  KeyboardIcon,
  Loader2Icon,
  RefreshCwIcon,
  ZapIcon,
  ZapOffIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils.js";
import { useFoodScan } from "@/hooks/app/use-food-catalog";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { toast } from "sonner";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { useSavedMealsActions } from "@/hooks/app/use-saved-meals";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
  MealDraftCard,
  MealDraftSummaryCard,
} from "./meal-draft-review.jsx";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";
import SaveToMyMealsButton from "./save-to-my-meals-button.jsx";

const ScanCameraView = ({ isActive, onCapture, onOpenText }) => {
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
    streamRef.current?.getTracks().forEach((track) => track.stop());
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

  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return undefined;
    }

    navigator.mediaDevices
      .enumerateDevices?.()
      .then((devices) => {
        setHasMultipleCams(
          devices.filter((device) => device.kind === "videoinput").length > 1,
        );
      })
      .catch(() => {});

    startCamera("environment");

    return stopCamera;
  }, [isActive, startCamera, stopCamera]);

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
    } catch {}
  };

  const handleCapture = useCallback(() => {
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
  }, [isScanning, onCapture, ready, stopCamera]);

  const handleGalleryChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

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
    [onCapture, stopCamera],
  );

  const handleOpenText = useCallback(() => {
    stopCamera();
    onOpenText?.();
  }, [onOpenText, stopCamera]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black"
      style={{ aspectRatio: "3/4" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black opacity-40 pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative h-64 w-64 transition-all duration-500">
          <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-[3px] border-l-[3px] border-primary" />
          <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-[3px] border-r-[3px] border-primary" />
          <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-primary" />
          <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-r-[3px] border-b-[3px] border-primary" />

          {isScanning ? (
            <motion.div
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute right-0 left-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_3px_theme('colors.primary.DEFAULT')]"
            />
          ) : null}
        </div>
      </div>

      {hasFlash ? (
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

      {hasMultipleCams ? (
        <button
          type="button"
          onClick={switchCamera}
          className="absolute top-3 left-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform active:scale-90"
          aria-label="Kamerani almashtirish"
        >
          <FlipHorizontalIcon className="size-5" />
        </button>
      ) : null}

      <div className="absolute right-0 bottom-28 left-0 z-10 text-center">
        <p className="inline-block rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-xs font-bold text-white/90 shadow-xl backdrop-blur-xl">
          Ovqatni ramka ichiga joylashtiring
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div className="absolute right-0 bottom-4 left-0 z-10 grid grid-cols-[1fr_auto_1fr] items-end gap-5 px-7">
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
            disabled={isScanning}
            className="flex min-w-16 flex-col items-center gap-1.5 text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <ImageIcon className="size-5" />
            </span>
            <span className="text-xs font-bold tracking-wide">Gallery</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || isScanning}
          className="flex size-16 items-center justify-center rounded-full border-[4px] border-white/60 bg-white/20 backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-40"
        >
          <div className="size-11 rounded-full bg-white" />
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleOpenText}
            disabled={isScanning}
            className="flex min-w-16 flex-col items-center gap-1.5 text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <KeyboardIcon className="size-5" />
            </span>
            <span className="text-xs font-bold tracking-wide">Type</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AnalyzeView = () => (
  <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 text-center">
    <div className="flex size-14 items-center justify-center rounded-full border bg-background">
      <Loader2Icon className="size-6 animate-spin" />
    </div>
    <div className="space-y-1">
      <h3 className="text-base font-semibold">
        Rasm AI orqali tahlil qilinmoqda
      </h3>
      <p className="text-sm text-muted-foreground">
        Bir nechta ovqat topilsa, hammasini alohida ko&apos;rsatamiz.
      </p>
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
          <img
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
          {items.map((item) => (
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

export default function CameraDrawer({
  dateKey,
  mealType,
  open,
  onClose,
  onOpenText,
}) {
  const [view, setView] = useState("camera");
  const [scannedItems, setScannedItems] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToMyMeals, setSaveToMyMeals] = useState(false);

  const { addMeal: addMealAction } = useDailyTrackingActions();
  const { createSavedMeal } = useSavedMealsActions();
  const {
    analyzeMealImageDraft,
    uploadMealCapture,
    isAnalyzingDraftImage,
    isUploadingCapture,
  } = useFoodScan();
  const { goals } = useHealthGoals();

  useEffect(() => {
    if (!open) return;

    setView("camera");
    setScannedItems([]);
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setScanError(null);
    setIsSaving(false);
    setSaveToMyMeals(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setView("camera");
    }
  }, [open]);

  const handleCapture = async (dataUrl) => {
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
      const items = Array.isArray(response?.items) ? response.items : [];

      setScannedItems(items);
      if (items.length === 0) {
        setScanError("AI bu rasm uchun draft tayyorlay olmadi.");
      }
      setView("result");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Ovqatni AI orqali aniqlab bo'lmadi";
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

  const handleIngredientUpdate = useCallback(
    (draftId, ingredientId, ingredient) => {
      setScannedItems((current) =>
        current.map((item) =>
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
      current.map((item) =>
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
      current.map((item) =>
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
    setScannedItems((current) => current.filter((item) => item.id !== draftId));
  }, []);

  const handleConfirmItem = useCallback((draftId) => {
    setScannedItems((current) =>
      current.map((item) =>
        item.id === draftId
          ? {
              ...item,
              reviewNeeded: false,
              ingredients: Array.isArray(item.ingredients)
                ? item.ingredients.map((ingredient) => ({
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

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      direction="bottom"
    >
      <NutritionDrawerContent size="sm">
        <DrawerHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-3 text-center">
          <div className="flex w-full flex-col items-center gap-1">
            {view === "result" ? (
              <div className="flex w-full items-start justify-between gap-3 text-left">
                <div className="min-w-0">
                  <DrawerTitle className="truncate text-base font-semibold">
                    AI topgan ovqatlar
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-muted-foreground">
                    {scannedItems.length > 0
                      ? `${scannedItems.length} ta natija · Ingredientlarni tekshiring`
                      : "Natijani tekshiring yoki qayta rasm oling"}
                  </DrawerDescription>
                </div>
                <SaveToMyMealsButton
                  checked={saveToMyMeals}
                  onCheckedChange={setSaveToMyMeals}
                />
              </div>
            ) : view === "analyzing" ? (
              <div className="min-w-0 text-center">
                <DrawerTitle className="text-base font-semibold">
                  AI analiz qilmoqda
                </DrawerTitle>
                <DrawerDescription>
                  Rasm ichidagi ovqatlar aniqlanmoqda
                </DrawerDescription>
              </div>
            ) : (
              <>
                <DrawerTitle className="text-base font-semibold">
                  Ovqatni aniqlash
                </DrawerTitle>
                <DrawerDescription>
                  Ovqatni kadr ichiga joylashtiring va AI uchun rasm oling.
                </DrawerDescription>
              </>
            )}
          </div>
        </DrawerHeader>

        <DrawerBody className="px-5 pt-4 pb-8">
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
                  onCapture={handleCapture}
                  onOpenText={onOpenText}
                />
              </motion.div>
            ) : null}

            {view === "analyzing" ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyzeView />
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
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DrawerBody>

        {view === "result" ? (
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
  );
}
