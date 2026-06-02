import React from "react";
import get from "lodash/get";
import round from "lodash/round";
import multiply from "lodash/multiply";
import map from "lodash/map";
import toPairs from "lodash/toPairs";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import {
  CameraIcon,
  CheckCircle2Icon,
  CopyIcon,
  MinusCircleIcon,
  CalculatorIcon,
  MoveRightIcon,
  PencilIcon,
  Share2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { getNutritionSourceMeta } from "./source-meta.js";
import { MEAL_LABELS } from "@/modules/user/lib/meal-config";
import useShare from "@/hooks/utils/use-share";

const formatLoggedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatLoggedDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const FoodLogDrawer = ({
  food,
  mealType,
  open,
  onClose,
  onEat,
  onCamera,
  onEditPortion,
  onTransfer,
  readOnly = false,
}) => {
  const { goals } = useHealthGoals();
  const { share } = useShare();
  const shareCardRef = React.useRef(null);
  const isConsumed = get(food, "isConsumed", false);
  const grams = get(food, "grams", null);
  const unit = get(food, "unit", "g");
  const qty = get(food, "qty", 1);
  const totalCal = round(multiply(get(food, "cal", 0), qty));
  const protein = get(food, "protein", 0);
  const carbs = get(food, "carbs", 0);
  const fat = get(food, "fat", 0);
  const emoji = get(food, "emoji", "🍽️");
  const image = get(food, "image", null);
  const loggedAt = formatLoggedAt(get(food, "addedAt", null));
  const loggedDate = formatLoggedDate(get(food, "addedAt", null));
  const source = get(food, "source", null);
  const sourceMeta = getNutritionSourceMeta(
    source,
    get(food, "isFromPlanLinked", false) ? "meal-plan" : "manual",
  );
  const mealTypeLabel = MEAL_LABELS[mealType] || mealType;

  if (!food) return null;

  const handleShare = async () => {
    const title = `${food.name} — ${totalCal} kcal`;
    const text = `Men bugun ${food.name} edim — ${totalCal} kcal`;

    try {
      if (
        shareCardRef.current &&
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare
      ) {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: null,
          scale: Math.min(2, window.devicePixelRatio || 1),
          useCORS: true,
        });
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.84),
        );

        if (blob) {
          const file = new File(
            [blob],
            `meal-${food.id || Date.now()}.webp`,
            { type: "image/webp" },
          );

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title, text, files: [file] });
            return;
          }
        }
      }
    } catch {
      // Fall back to plain text share below.
    }

    await share({ title, text });
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction="bottom"
    >
      <NutritionDrawerContent
        className={cn("data-[vaul-drawer-direction=bottom]:max-h-[100vh]")}
      >
        {/* Standard header — same pattern as PortionEditorDrawer */}
        <DrawerHeader className="border-b border-border/40 shrink-0">
          <div className="flex items-center justify-center gap-3">
            <div className="min-w-0 text-center">
              <DrawerTitle className="text-base font-black truncate">
                {food.name}
              </DrawerTitle>
              <DrawerDescription className="flex items-center justify-center gap-2 mt-0.5">
                {grams != null && (
                  <span className="text-[11px] font-bold bg-muted/60 text-muted-foreground rounded-md px-1.5 py-0.5">
                    {grams} {unit}
                  </span>
                )}
                <span
                  className={cn(
                    "text-[11px] font-bold rounded-md px-1.5 py-0.5",
                    sourceMeta.tone,
                  )}
                >
                  {sourceMeta.label}
                </span>
                <span className="text-[11px] font-bold text-primary">
                  {totalCal} kcal
                </span>
                {isConsumed && loggedAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    · {loggedAt}
                  </span>
                ) : null}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody>
          {isConsumed && (
            <div ref={shareCardRef} className="pb-2">
              <div className="flex flex-col items-center">
                <GaugeProgress
                  value={totalCal}
                  min={0}
                  max={goals.calories || goals.cal || 2000}
                  id={food.id}
                  label="ISTE'MOL QILINDI"
                />

                <div className="grid grid-cols-3 gap-8 w-full py-5">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                      🍗 Oqsil
                    </span>
                    <span className="text-base font-black">
                      <span className="text-red-500">{protein}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                        /{goals.protein}g
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 border-l border-r border-border/50 px-4">
                    <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                      🍴 Uglevod
                    </span>
                    <span className="text-base font-black">
                      <span className="text-orange-500">{carbs}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                        /{goals.carbs}g
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                      🥑 Yog&apos;
                    </span>
                    <span className="text-base font-black">
                      <span className="text-green-500">{fat}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                        /{goals.fat}g
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {image && (
                <div className="mb-4 h-48 overflow-hidden rounded-2xl bg-muted/30">
                  <img loading="lazy"
                    src={image}
                    alt={food.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {food.vitamins && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <CalculatorIcon className="size-3" /> Vitaminlar va
                    Minerallar
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {map(toPairs(food.vitamins), ([name, amount]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground font-medium">
                          {name}
                        </span>
                        <span className="font-black text-foreground">
                          {amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DrawerBody>
        <DrawerFooter>
          <div>
            {readOnly ? (
              <p className="text-sm text-muted-foreground">
                Bu ko&apos;rinishda faqat log qilingan ma&apos;lumotlar
                ko&apos;rsatiladi.
              </p>
            ) : (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${
                    3 + (isConsumed ? 3 : 0)
                  }, minmax(0, 1fr))`,
                }}
              >
                {isConsumed && onEditPortion ? (
                  <Button
                    onClick={() => {
                      onEditPortion();
                      onClose();
                    }}
                    variant={"outline"}
                    className={"h-12"}
                  >
                    <PencilIcon className="size-5 text-primary" />
                  </Button>
                ) : null}
                {isConsumed && onTransfer ? (
                  <Button
                    onClick={() => {
                      onTransfer("copy");
                      onClose();
                    }}
                    variant="outline"
                    className="h-12"
                    aria-label="Nusxa olish"
                  >
                    <CopyIcon className="size-5 text-sky-500" />
                  </Button>
                ) : null}
                {isConsumed && onTransfer ? (
                  <Button
                    onClick={() => {
                      onTransfer("move");
                      onClose();
                    }}
                    variant="outline"
                    className="h-12"
                    aria-label="Ko'chirish"
                  >
                    <MoveRightIcon className="size-5 text-amber-500" />
                  </Button>
                ) : null}
                {isConsumed ? (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="h-12"
                    aria-label="Ulashish"
                  >
                    <Share2Icon className="size-5 text-indigo-500" />
                  </Button>
                ) : null}
                {onCamera ? (
                  <Button
                    onClick={() => {
                      onCamera();
                      onClose();
                    }}
                    variant={"outline"}
                    className={"h-12"}
                  >
                    <CameraIcon className="size-6 text-blue-500" />
                  </Button>
                ) : null}
                {onEat ? (
                  <Button
                    onClick={() => {
                      onEat();
                      onClose();
                    }}
                    variant={"outline"}
                    className={"h-12"}
                  >
                    {isConsumed ? (
                      <MinusCircleIcon className="size-6 text-red-500" />
                    ) : (
                      <CheckCircle2Icon className="size-6 text-muted-foreground" />
                    )}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
};

export default FoodLogDrawer;
