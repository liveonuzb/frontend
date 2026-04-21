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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import {
  FlipHorizontalIcon,
  Loader2Icon,
  RefreshCwIcon,
  ScanLineIcon,
  XIcon,
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
import {
  buildMealPayloadFromDraft,
  getDraftReviewCount,
  MealDraftCard,
  MealDraftSummaryCard,
} from "./meal-draft-review.jsx";

const ScanCameraView = ({ activeTab, onCapture }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [hasMultipleCams, setHasMultipleCams] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = useCallback(async (facingMode) => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setReady(false);
    setFlashOn(false);

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
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices?.()
      .then((devices) => {
        setHasMultipleCams(
          devices.filter((device) => device.kind === "videoinput").length > 1,
        );
      })
      .catch(() => {});

    startCamera("environment");

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [startCamera]);

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

  const handleCapture = () => {
    if (!videoRef.current || !ready || isScanning) return;

    setIsScanning(true);

    setTimeout(() => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsScanning(false);
      onCapture(canvas.toDataURL("image/jpeg", 0.85));
    }, 1500);
  };

  const isBarcode = activeTab === "barcode";

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
        <div
          className={cn(
            "relative transition-all duration-500",
            isBarcode ? "h-32 w-72" : "h-64 w-64",
          )}
        >
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

      <div className="absolute right-0 bottom-28 left-0 z-10 text-center">
        <p className="inline-block rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-xs font-bold text-white/90 shadow-xl backdrop-blur-xl">
          {isBarcode
            ? "Shtrix-kodni ramka ichiga joylashtiring"
            : "Ovqatni ramka ichiga joylashtiring"}
        </p>
      </div>

      <div className="absolute right-0 bottom-4 left-0 flex items-center justify-center gap-10">
        {hasMultipleCams ? (
          <button
            onClick={switchCamera}
            className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform active:scale-90"
          >
            <FlipHorizontalIcon className="size-5" />
          </button>
        ) : (
          <div className="size-11" />
        )}

        <button
          onClick={handleCapture}
          disabled={!ready || isScanning}
          className="flex size-16 items-center justify-center rounded-full border-[4px] border-white/60 bg-white/20 backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-40"
        >
          {isBarcode ? (
            <ScanLineIcon className="size-7 text-white" />
          ) : (
            <div className="size-11 rounded-full bg-white" />
          )}
        </button>

        <div className="size-11" />
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
  onPortionChange,
  onRemove,
  onConfirm,
  onSave,
  isSaving,
}) => {
  const reviewItemsCount = getDraftReviewCount(items);

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
          filledDescription="AI draftini tekshirib, keyin tasdiqlang."
        />

        {reviewItemsCount > 0 ? (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm text-amber-700 dark:text-amber-300">
            Ba&apos;zi ingredientlar taxminiy. Tasdiqlashdan oldin draftni bir
            ko&apos;zdan kechiring.
          </div>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <MealDraftCard
              key={item.id}
              item={item}
              onPortionChange={(value) => onPortionChange(item.id, value)}
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

      <DrawerFooter className="px-0 pb-0">
        <div className="grid w-full gap-3">
          <Button variant="outline" onClick={onRetake}>
            Qayta olish
          </Button>
          <Button onClick={onSave} disabled={items.length === 0 || isSaving}>
            {isSaving ? (
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
    </div>
  );
};

export default function CameraDrawer({ dateKey, mealType, open, onClose }) {
  const [view, setView] = useState("camera");
  const [activeTab, setActiveTab] = useState("barcode");
  const [scannedItems, setScannedItems] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { addMeal: addMealAction } = useDailyTrackingActions();
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
        mode: activeTab,
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

  const handlePortionChange = useCallback((draftId, grams) => {
    setScannedItems((current) =>
      current.map((item) => (item.id === draftId ? { ...item, grams } : item)),
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
        await addMealAction(dateKey, mealType, {
          ...buildMealPayloadFromDraft(item, {
            source: activeTab === "barcode" ? "camera-barcode" : "camera",
            image: capturedImageUrl,
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
        <DrawerHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-3">
            {view === "result" ? (
              <div className="min-w-0">
                <DrawerTitle className="truncate text-base font-semibold">
                  AI topgan ovqatlar
                </DrawerTitle>
                <p className="text-xs text-muted-foreground">
                  {scannedItems.length > 0
                    ? `${scannedItems.length} ta natija · Porsiyalarni tekshiring`
                    : "Natijani tekshiring yoki qayta rasm oling"}
                </p>
              </div>
            ) : view === "analyzing" ? (
              <div className="min-w-0">
                <DrawerTitle className="text-base font-semibold">
                  AI analiz qilmoqda
                </DrawerTitle>
                <DrawerDescription>
                  Rasm ichidagi ovqatlar aniqlanmoqda
                </DrawerDescription>
              </div>
            ) : (
              <DrawerTitle className="text-base font-semibold">
                Kamera
              </DrawerTitle>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full bg-muted/50 hover:bg-muted"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          {view === "camera" ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-3 w-full"
            >
              <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
                <TabsTrigger
                  value="barcode"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background"
                >
                  Shtrix-kod
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background"
                >
                  Ovqatni aniqlash
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
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
                  activeTab={activeTab}
                  onCapture={handleCapture}
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
                  onPortionChange={handlePortionChange}
                  onRemove={handleRemoveItem}
                  onConfirm={handleConfirmItem}
                  onSave={handleSave}
                  isSaving={
                    isSaving || isAnalyzingDraftImage || isUploadingCapture
                  }
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DrawerBody>
      </NutritionDrawerContent>
    </Drawer>
  );
}
