import { some, reduce, values, isArray } from "lodash";
import React from "react";
import { createPortal } from "react-dom";
import {
  CameraIcon,
  GlassWaterIcon,
  KeyboardIcon,
  MicIcon,
  PlusIcon,
  SearchIcon,
  ScaleIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMeasurements from "@/hooks/app/use-measurements";
import { useAddMealOverlayStore } from "@/store";

const getTodayKey = () => new Date().toISOString().split("T")[0];
const FAB_VISIBLE_PATHS = [
  "/user/dashboard",
  "/user/nutrition",
  "/user/workout",
  "/user/challenges",
  "/user/measurement",
];

const FabMenuPanel = ({
  latestWeight,
  waterAmount,
  remainingCalories,
  onNavigateMeasurements,
  onAddWater,
  onFoodAction,
}) => (
  <div className="absolute bottom-full right-0 z-[71] mb-3 w-[320px] max-w-[calc(100vw-1.5rem)] animate-in rounded-[2rem] border bg-background p-5 text-foreground shadow-2xl fade-in slide-in-from-bottom-2 duration-200">
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Weight</p>
          <p className="text-2xl font-bold">
            {latestWeight > 0 ? `${latestWeight} kg` : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateMeasurements}
          className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
        >
          <ScaleIcon className="size-7" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Water</p>
          <p className="text-2xl font-bold">{waterAmount} ml</p>
        </div>
        <button
          type="button"
          onClick={onAddWater}
          className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
        >
          <GlassWaterIcon className="size-7" />
        </button>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Food</p>
          <p className="text-2xl font-bold">{remainingCalories} kcal left</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onFoodAction("text")}
            className="flex size-14 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <KeyboardIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => onFoodAction("manual")}
            className="flex size-14 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <SearchIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => onFoodAction("camera")}
            className="flex size-14 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <CameraIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => onFoodAction("audio")}
            className="flex size-14 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <MicIcon className="size-6" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addWaterCup } = useDailyTrackingActions();
  const { goals } = useHealthGoals();
  const { getLatest } = useMeasurements();
  const { dayData } = useDailyTrackingDay(getTodayKey());
  const openActionDrawer = useAddMealOverlayStore(
    (state) => state.openActionDrawer,
  );
  const isVisible = some(FAB_VISIBLE_PATHS, (path) =>
    location.pathname.startsWith(path),
  );

  const latestWeight = getLatest()?.weight || 0;
  const waterAmount = React.useMemo(() => {
    const waterLog = dayData?.waterLog || [];
    const cupSize = goals?.cupSize || 250;
    return waterLog.length > 0
      ? reduce(waterLog, (sum, entry) => sum + (entry?.amountMl || 0), 0)
      : (dayData?.waterCups || 0) * cupSize;
  }, [dayData?.waterLog, dayData?.waterCups, goals?.cupSize]);
  const consumedCalories = React.useMemo(() => {
    const meals = dayData?.meals || {};
    return reduce(
      values(meals),
      (sectionSum, foods) => {
        return (
          sectionSum +
          (isArray(foods)
            ? reduce(
                foods,
                (sum, food) => sum + (food?.cal || 0) * (food?.qty || 1),
                0,
              )
            : 0)
        );
      },
      0,
    );
  }, [dayData?.meals]);
  const remainingCalories = Math.max(
    0,
    (goals?.calories || 0) - consumedCalories,
  );

  const closeFab = React.useCallback(() => setIsOpen(false), []);

  React.useEffect(() => {
    if (!isVisible && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, isVisible]);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeFab();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeFab, isOpen]);

  if (!isVisible) {
    return null;
  }

  const handleAddWater = async () => {
    try {
      await addWaterCup();
      toast.success("250ml suv qo'shildi!");
      closeFab();
    } catch {
      toast.error("Suvni saqlab bo'lmadi");
    }
  };

  const handleNavigateMeasurements = () => {
    navigate("/user/measurements");
    closeFab();
  };

  const handleFoodAction = (type) => {
    openActionDrawer({
      dateKey: getTodayKey(),
      initialNested: type === "manual" ? "catalog" : type,
    });
    closeFab();
  };

  const toggleButton = (
    <button
      type="button"
      aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
      className={cn(
        "flex size-16 items-center justify-center rounded-full bg-foreground text-background shadow-2xl transition-transform duration-300 active:scale-95",
        isOpen ? "rotate-45" : "rotate-0",
      )}
      onClick={() => setIsOpen((value) => !value)}
    >
      <PlusIcon className="size-7" />
    </button>
  );

  const portalContent =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              data-testid="fab-overlay"
              className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm md:hidden"
              onClick={closeFab}
            />
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[71] flex justify-end px-8 pb-8 pb-safe-or-4 md:hidden">
              <div className="relative pointer-events-auto">
                <FabMenuPanel
                  latestWeight={latestWeight}
                  waterAmount={waterAmount}
                  remainingCalories={remainingCalories}
                  onNavigateMeasurements={handleNavigateMeasurements}
                  onAddWater={handleAddWater}
                  onFoodAction={handleFoodAction}
                />
                {toggleButton}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {isOpen ? (
        <div className="size-16 shrink-0" aria-hidden="true" />
      ) : (
        toggleButton
      )}
      {portalContent}
    </>
  );
};

export default FloatingActionButton;
