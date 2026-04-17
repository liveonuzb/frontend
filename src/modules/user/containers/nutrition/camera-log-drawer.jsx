import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { get, round } from "lodash";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Slider } from "@/components/ui/slider.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  CalculatorIcon,
  FlipHorizontalIcon,
  RefreshCwIcon,
  XIcon,
  ZapIcon,
  ZapOffIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils.js";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

const calcMacros = (food, amount) => {
  const isUnit = food?.unit && food.unit !== "g" && food.unit !== "ml";
  const factor = isUnit ? amount / (food.defaultAmount || 1) : amount / 100;
  return {
    cal: round((food?.baseCal ?? food?.cal ?? 0) * factor),
    protein: round((food?.baseProtein ?? food?.protein ?? 0) * factor),
    carbs: round((food?.baseCarbs ?? food?.carbs ?? 0) * factor),
    fat: round((food?.baseFat ?? food?.fat ?? 0) * factor),
  };
};

const sliderMax = (food) => {
  const isUnit = food?.unit && food.unit !== "g" && food.unit !== "ml";
  return isUnit ? (food?.step || 1) * 20 : 1000;
};

// ─── CameraView ─────────────────────────────────────────────────────────────

const CameraView = ({ onCapture, onBack }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [hasMultipleCams, setHasMultipleCams] = useState(false);

  const startCamera = useCallback(async (facingMode) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
    } catch (_) {}
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices?.()
      .then((devices) => {
        setHasMultipleCams(
          devices.filter((d) => d.kind === "videoinput").length > 1,
        );
      })
      .catch(() => {});

    startCamera("environment");

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
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
    } catch (_) {}
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div
      className="relative w-full bg-black overflow-hidden rounded-2xl"
      style={{ aspectRatio: "3/4" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
      />

      {/* Corner guides */}
      {["tl", "tr", "bl", "br"].map((c) => (
        <div
          key={c}
          className={cn(
            "absolute w-7 h-7 border-primary pointer-events-none",
            c === "tl" &&
              "top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-lg",
            c === "tr" &&
              "top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-lg",
            c === "bl" &&
              "bottom-16 left-3 border-b-[3px] border-l-[3px] rounded-bl-lg",
            c === "br" &&
              "bottom-16 right-3 border-b-[3px] border-r-[3px] rounded-br-lg",
          )}
        />
      ))}

      {/* Close */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 size-9 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm"
      >
        <XIcon className="size-4" />
      </button>

      {/* Flash */}
      {hasFlash && (
        <button
          onClick={toggleFlash}
          className={cn(
            "absolute top-3 right-3 z-10 size-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all",
            flashOn ? "bg-yellow-400 text-black" : "bg-black/50 text-white",
          )}
        >
          {flashOn ? (
            <ZapIcon className="size-4 fill-current" />
          ) : (
            <ZapOffIcon className="size-4" />
          )}
        </button>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-10">
        {/* Camera switch */}
        {hasMultipleCams ? (
          <button
            onClick={switchCamera}
            className="size-11 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm active:scale-90 transition-transform"
          >
            <FlipHorizontalIcon className="size-5" />
          </button>
        ) : (
          <div className="size-11" />
        )}

        {/* Shutter */}
        <button
          onClick={capture}
          disabled={!ready}
          className="size-16 rounded-full border-[4px] border-white/60 bg-white/20 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          <div className="size-11 rounded-full bg-white" />
        </button>

        <div className="size-11" />
      </div>
    </div>
  );
};

// ─── PreviewView ─────────────────────────────────────────────────────────────

const PreviewView = ({ food, imageUrl, onRetake, onSave, isConsumed }) => {
  const { goals } = useHealthGoals();
  const defaultAmt = food?.defaultAmount || food?.grams || 100;
  const [grams, setGrams] = useState(defaultAmt);

  useLayoutEffect(() => {
    setGrams(defaultAmt);
  }, [defaultAmt]);

  const isGrams = !food?.unit || food?.unit === "g" || food?.unit === "ml";
  const maxVal = isGrams ? 1000 : (food?.step || 1) * 20;
  const step = food?.step || 10;
  const macros = calcMacros(food, grams);
  const maxCal = calcMacros(food, maxVal).cal;

  // Already consumed — just save the photo, no portion editing
  if (isConsumed) {
    const existingGrams = food?.grams || defaultAmt;
    const existingMacros = calcMacros(food, existingGrams);
    return (
      <div className="flex flex-col gap-4">
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-muted"
          style={{ aspectRatio: "3/4" }}
        >
          <img
            src={imageUrl}
            alt="Ovqat rasmi"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onRetake}
            className="absolute top-3 right-3 size-9 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <RefreshCwIcon className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={onRetake}>
            Qayta olish
          </Button>
          <Button
            className="w-full"
            onClick={() => onSave(imageUrl, existingGrams, existingMacros)}
          >
            Saqlash
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Photo */}
      <div
        className="relative  overflow-hidden rounded-2xl bg-muted mb-2 size-72 mx-auto"
        style={{ aspectRatio: "3/4" }}
      >
        <img
          src={imageUrl}
          alt="Ovqat rasmi"
          className="w-full h-full object-cover"
        />
        <button
          onClick={onRetake}
          className="absolute top-3 right-3 size-9 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm"
        >
          <RefreshCwIcon className="size-4" />
        </button>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <GaugeProgress
          value={macros.cal}
          min={0}
          max={maxCal}
          id={food?.id}
          label="QO'SHILMOQDA"
        />

        {/* Macros */}
        <div className="grid grid-cols-3 gap-8 w-full py-6">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              🍗 Oqsil
            </span>
            <span className="text-base font-black">
              <span className="text-red-500">{macros.protein}</span>
              <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                /{goals.protein}g
              </span>
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-l border-r border-border/50 px-4">
            <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              🍴 Uglevod
            </span>
            <span className="text-base font-black">
              <span className="text-orange-500">{macros.carbs}</span>
              <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                /{goals.carbs}g
              </span>
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              🥑 Yog&apos;
            </span>
            <span className="text-base font-black">
              <span className="text-green-500">{macros.fat}</span>
              <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                /{goals.fat}g
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-medium text-muted-foreground">
            Miqdori:
          </span>
          <span className="text-2xl font-black text-primary">
            {grams}
            {food?.unit || "g"}
          </span>
        </div>
        <Slider
          value={[grams]}
          min={step}
          max={maxVal}
          step={step}
          onValueChange={([v]) => setGrams(v)}
        />
      </div>

      {/* Vitamins */}
      {food?.vitamins && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 mt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <CalculatorIcon className="size-3" /> Vitaminlar va Minerallar
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(food.vitamins).map(([name, amount]) => (
              <div
                key={name}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground font-medium">
                  {name}
                </span>
                <span className="font-black text-foreground">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div className="space-y-3 pt-4">
        <Button variant="outline" className="w-full" onClick={onRetake}>
          Qayta olish
        </Button>
        <Button
          className="w-full"
          onClick={() => onSave(imageUrl, grams, macros)}
        >
          Saqlash
        </Button>
      </div>
    </div>
  );
};

// ─── CameraLogDrawer ─────────────────────────────────────────────────────────

const CameraLogDrawer = ({ food, open, onClose, onSave }) => {
  const [view, setView] = useState("camera");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (open) {
      setView("camera");
      setPreview(null);
    }
  }, [open]);

  const isConsumed = get(food, "isConsumed", false);
  const emoji = get(food, "emoji", "🍽️");
  const image = get(food, "image", null);

  if (!food) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction="bottom"
    >
      <NutritionDrawerContent size="sm">
        <DrawerHeader className="px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-muted/60 overflow-hidden flex items-center justify-center shrink-0 border border-border/30">
              {image ? (
                <img
                  src={image}
                  alt={food.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">{emoji}</span>
              )}
            </div>
            <div className="min-w-0">
              <DrawerTitle className="text-base font-black truncate">
                {food.name}
              </DrawerTitle>
              <span className="text-xs text-muted-foreground font-medium">
                {view === "camera"
                  ? "Kamera"
                  : isConsumed
                    ? "Rasm"
                    : "Rasm va porsiya"}
              </span>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="px-5 pt-4 pb-8">
          <AnimatePresence mode="wait">
            {view === "camera" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <CameraView
                  onCapture={(dataUrl) => {
                    setPreview(dataUrl);
                    setView("preview");
                  }}
                  onBack={onClose}
                />
              </motion.div>
            )}

            {view === "preview" && preview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PreviewView
                  food={food}
                  imageUrl={preview}
                  isConsumed={isConsumed}
                  onRetake={() => {
                    setPreview(null);
                    setView("camera");
                  }}
                  onSave={(dataUrl, grams, macros) => {
                    onSave(dataUrl, grams, macros);
                    onClose();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DrawerBody>
      </NutritionDrawerContent>
    </Drawer>
  );
};

export default CameraLogDrawer;
