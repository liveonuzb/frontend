import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarcodeIcon,
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCcwIcon,
} from "lucide-react";
import BarcodeScanner from "@/components/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useFoodBarcodeLookup } from "@/hooks/app/use-food-catalog";
import { toast } from "sonner";

import map from "lodash/map";
import lodashToNumber from "lodash/toNumber";
import trim from "lodash/trim";

const toNumber = (value, fallback = 0) => {
  const normalized = lodashToNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const toStrictNumber = (value) => {
  const normalized = lodashToNumber(value);
  return Number.isFinite(normalized) ? normalized : null;
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

const macroInputs = [
  { key: "cal", label: "Kcal" },
  { key: "protein", label: "Oqsil" },
  { key: "carbs", label: "Uglevod" },
  { key: "fat", label: "Yog'" },
];

const BarcodeAddDrawer = ({ dateKey, mealType, onClose }) => {
  const [scannerKey, setScannerKey] = useState(0);
  const [scannedCode, setScannedCode] = useState("");
  const [status, setStatus] = useState("scanning");
  const [foundFood, setFoundFood] = useState(null);
  const [amount, setAmount] = useState(100);
  const [manualFood, setManualFood] = useState({
    name: "",
    cal: "",
    protein: "0",
    carbs: "0",
    fat: "0",
    grams: "100",
    unit: "g",
  });

  const { addMeal } = useDailyTrackingActions();
  const { lookupFoodByBarcode, isLookingUp } = useFoodBarcodeLookup();

  const foundMacros = useMemo(
    () => (foundFood ? calcMacros(foundFood, amount) : null),
    [amount, foundFood],
  );

  const resetScanner = useCallback(() => {
    setScannedCode("");
    setFoundFood(null);
    setStatus("scanning");
    setScannerKey((current) => current + 1);
  }, []);

  const handleScan = useCallback(
    async (code) => {
      const normalizedCode = trim(String(code || ""));

      if (!normalizedCode) {
        return;
      }

      setScannedCode(normalizedCode);
      setStatus("loading");
      setFoundFood(null);

      try {
        const food = await lookupFoodByBarcode(normalizedCode);

        if (!food) {
          setStatus("not-found");
          return;
        }

        setFoundFood(food);
        setAmount(food.defaultAmount || 100);
        setStatus("found");
      } catch (error) {
        if (error?.response?.status === 404) {
          setStatus("not-found");
          return;
        }

        setStatus("error");
        toast.error("Shtrix-kod bo'yicha ovqatni tekshirib bo'lmadi");
      }
    },
    [lookupFoodByBarcode],
  );

  const handleAddFoundFood = async () => {
    if (!foundFood || !foundMacros) return;

    try {
      await addMeal(dateKey, mealType, {
        ...foundFood,
        source: "barcode",
        qty: 1,
        grams: amount,
        cal: foundMacros.cal,
        protein: foundMacros.protein,
        carbs: foundMacros.carbs,
        fat: foundMacros.fat,
        addedFromPlan: false,
      });
      toast.success(`${foundFood.name} qo'shildi!`);
      onClose?.();
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  };

  const handleAddManualFood = async () => {
    const name = trim(manualFood.name);
    const grams = toStrictNumber(manualFood.grams);
    const cal = toStrictNumber(manualFood.cal);
    const protein = toStrictNumber(manualFood.protein);
    const carbs = toStrictNumber(manualFood.carbs);
    const fat = toStrictNumber(manualFood.fat);

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
      await addMeal(dateKey, mealType, {
        id: `barcode-${scannedCode || Date.now()}`,
        name,
        barcode: scannedCode || null,
        source: "barcode-manual",
        qty: 1,
        grams,
        unit: manualFood.unit || "g",
        cal: Math.round(cal),
        protein,
        carbs,
        fat,
        addedFromPlan: false,
      });
      toast.success(`${name} qo'shildi!`);
      onClose?.();
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  };

  const updateManualField = (key, value) => {
    setManualFood((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black text-white">
      {status === "scanning" ? (
        <BarcodeScanner
          key={scannerKey}
          onScan={handleScan}
          onClose={onClose}
          className="h-full"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.04)_28%,rgba(0,0,0,1)_72%)]" />
          <BarcodeIcon className="relative size-16 text-white/20" />
        </div>
      )}
      <AnimatePresence>
        {(status === "loading" || isLookingUp) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[max(env(safe-area-inset-bottom),1rem)] left-4 right-4 z-40 rounded-3xl bg-white p-4 text-foreground shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2Icon className="size-5 animate-spin text-primary" />
              </div>
              <div>
                <p className="text-sm font-black">Shtrix-kod tekshirilmoqda</p>
                <p className="text-xs text-muted-foreground">{scannedCode}</p>
              </div>
            </div>
          </motion.div>
        )}

        {status === "found" && foundFood && foundMacros && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[2rem] bg-background p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-foreground shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
            <div className="flex items-start gap-4">
              <div className="size-16 overflow-hidden rounded-3xl bg-muted flex items-center justify-center shrink-0">
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

            <div className="mt-5 grid grid-cols-4 gap-2">
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
                onValueChange={([value]) => setAmount(value)}
              />
            </div>

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
              <Button type="button" variant="outline" size="icon" onClick={resetScanner}>
                <RefreshCcwIcon className="size-4" />
              </Button>
              <Button type="button" onClick={handleAddFoundFood}>
                <PlusIcon className="mr-2 size-4" />
                Qo'shish
              </Button>
            </div>
          </motion.div>
        )}

        {(status === "not-found" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="absolute bottom-0 left-0 right-0 z-50 max-h-[78dvh] overflow-y-auto rounded-t-[2rem] bg-background p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-foreground shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
            <div className="mb-5">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600">
                <BarcodeIcon className="size-3" />
                Topilmadi
              </div>
              <h3 className="text-lg font-black">Ovqatni qo'l bilan kiriting</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                Shtrix-kod: {scannedCode || "noma'lum"}
              </p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Ovqat nomi"
                value={manualFood.name}
                onChange={(event) => updateManualField("name", event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                {map(macroInputs, (item) => (
                  <label key={item.key} className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.label}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={manualFood[item.key]}
                      onChange={(event) => updateManualField(item.key, event.target.value)}
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
                    onChange={(event) => updateManualField("grams", event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Birlik
                  </span>
                  <Input
                    value={manualFood.unit}
                    onChange={(event) => updateManualField("unit", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
              <Button type="button" variant="outline" size="icon" onClick={resetScanner}>
                <RefreshCcwIcon className="size-4" />
              </Button>
              <Button type="button" onClick={handleAddManualFood}>
                <PlusIcon className="mr-2 size-4" />
                Qo'l bilan qo'shish
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BarcodeAddDrawer;
