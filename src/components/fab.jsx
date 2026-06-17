import compact from "lodash/compact";
import get from "lodash/get";
import map from "lodash/map";
import some from "lodash/some";
import split from "lodash/split";
import React from "react";
import {
  AppleIcon,
  BarcodeIcon,
  CameraIcon,
  DumbbellIcon,
  FootprintsIcon,
  GlassWaterIcon,
  MicIcon,
  PlusIcon,
  ScaleIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useStartRunningSession } from "@/hooks/app/use-running-sessions";
import { useAddMealOverlayStore } from "@/store";
import { USER_CHALLENGES_ENABLED } from "@/modules/user/user-feature-flags.js";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";

const getTodayKey = () => split(new Date().toISOString(), "T")[0];
const FAB_VISIBLE_PATHS = compact([
  "/user/dashboard",
  "/user/nutrition",
  "/user/workout",
  USER_CHALLENGES_ENABLED ? "/user/challenges" : null,
  "/user/friends",
  "/user/measurement",
]);

const FabActionTile = ({ action }) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={cn(
        "flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-[1.5rem] p-3 text-center transition-transform active:scale-[0.98]",
        action.className,
      )}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full border bg-background/45",
          action.iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="text-base font-medium leading-tight tracking-normal text-foreground">
        {action.label}
      </span>
    </button>
  );
};

const FabUtilityRow = ({ item, isLast }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={item.onClick}
      disabled={item.disabled}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background/60 active:bg-background/80",
        item.disabled && "cursor-not-allowed opacity-60",
        !isLast && "border-b border-border/60",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full bg-background",
          item.iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-tight text-foreground">
          {item.label}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium leading-tight text-muted-foreground">
          {item.description}
        </span>
      </span>
    </button>
  );
};

const FabMenuPanel = ({
  onNavigateMeasurements,
  onNavigateWorkout,
  onStartRun,
  isStartingRun,
  onAddWater,
  onFoodAction,
}) => {
  const foodActions = [
    {
      label: "Log Food",
      icon: AppleIcon,
      className: "bg-orange-500/10",
      iconClassName: "border-orange-400/45 text-orange-500",
      onClick: () => onFoodAction("text"),
    },
    {
      label: "Barcode Scan",
      icon: BarcodeIcon,
      className: "bg-sky-500/10",
      iconClassName: "border-sky-400/45 text-sky-500",
      onClick: () => onFoodAction("barcode"),
    },
    {
      label: "Voice Log",
      icon: MicIcon,
      className: "bg-violet-500/10",
      iconClassName: "border-violet-400/45 text-violet-500",
      onClick: () => onFoodAction("audio"),
    },
    {
      label: "Meal scan",
      icon: CameraIcon,
      className: "bg-emerald-500/10",
      iconClassName: "border-emerald-400/45 text-emerald-500",
      onClick: () => onFoodAction("camera"),
    },
  ];
  const utilityActions = [
    {
      label: "Water",
      description: "Track daily hydration goals",
      icon: GlassWaterIcon,
      iconClassName: "text-sky-500",
      onClick: onAddWater,
    },
    {
      label: "Weight",
      description: "Monitor progress over time",
      icon: ScaleIcon,
      iconClassName: "text-orange-500",
      onClick: onNavigateMeasurements,
    },
    {
      label: "Exercise",
      description: "Log workouts and calories",
      icon: DumbbellIcon,
      iconClassName: "text-violet-500",
      onClick: onNavigateWorkout,
    },
    {
      label: "Run",
      description: isStartingRun ? "Starting GPS run" : "Start GPS run",
      icon: FootprintsIcon,
      iconClassName: "text-lime-600",
      onClick: onStartRun,
      disabled: isStartingRun,
    },
  ];

  return (
    <div className="px-5 pb-5 pt-3">
      <div className="grid grid-cols-2 gap-2.5">
        {map(foodActions, (action) => (
          <FabActionTile key={action.label} action={action} />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-muted/45">
        {map(utilityActions, (item, index) => (
          <FabUtilityRow
            key={item.label}
            item={item}
            isLast={index === utilityActions.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const FloatingActionButton = () => {
  const [openRouteKey, setOpenRouteKey] = React.useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addWaterCup } = useDailyTrackingActions();
  const { startRunningSession, isPending: isStartingRun } =
    useStartRunningSession();
  const openActionDrawer = useAddMealOverlayStore(
    (state) => state.openActionDrawer,
  );
  const isVisible = some(FAB_VISIBLE_PATHS, (path) =>
    location.pathname.startsWith(path),
  );
  const routeKey = location.key || location.pathname;
  const isOpen = isVisible && openRouteKey === routeKey;

  const closeFab = React.useCallback(() => setOpenRouteKey(null), []);
  const setFabOpen = React.useCallback(
    (nextOpen) => {
      setOpenRouteKey(nextOpen ? routeKey : null);
    },
    [routeKey],
  );

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

  const handleNavigateWorkout = () => {
    navigate("/user/workout/overview");
    closeFab();
  };

  const handleStartRun = async () => {
    try {
      const session = await startRunningSession({ source: "fab" });
      const workoutSessionId = get(
        session,
        "workoutSessionId",
        get(session, "id"),
      );

      if (workoutSessionId) {
        navigate(`/user/workout/running/live/${workoutSessionId}`);
      } else {
        navigate("/user/workout/history");
      }

      closeFab();
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Yugurishni boshlash imkoni bo'lmadi.",
      );
    }
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
        "flex size-[60px] items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_45px_rgba(132,204,22,0.35)] transition-transform duration-300 hover:shadow-[0_24px_52px_rgba(132,204,22,0.42)] active:scale-95 dark:text-white",
        isOpen ? "rotate-45" : "rotate-0",
      )}
      onClick={() => setFabOpen(!isOpen)}
    >
      <PlusIcon className="size-6 @max-2xs:size-7" />
    </button>
  );

  return (
    <>
      {isOpen ? (
        <div className="size-16 shrink-0" aria-hidden="true" />
      ) : (
        toggleButton
      )}
      <Drawer
        direction="bottom"
        open={isOpen}
        onOpenChange={setFabOpen}
        shouldScaleBackground={false}
      >
        <DrawerContent className="before:bg-[#f3f7f5] data-[vaul-drawer-direction=bottom]:max-h-[calc(100vh-4rem)] data-[vaul-drawer-direction=bottom]:md:max-w-sm dark:before:bg-[#111a16]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Quick actions</DrawerTitle>
            <DrawerDescription>
              Log food, hydration, weight, and workouts.
            </DrawerDescription>
          </DrawerHeader>
          <FabMenuPanel
            onNavigateMeasurements={handleNavigateMeasurements}
            onNavigateWorkout={handleNavigateWorkout}
            onStartRun={handleStartRun}
            isStartingRun={isStartingRun}
            onAddWater={handleAddWater}
            onFoodAction={handleFoodAction}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default FloatingActionButton;
