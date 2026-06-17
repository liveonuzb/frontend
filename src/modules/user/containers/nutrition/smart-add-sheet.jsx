import React from "react";
import {
  CameraIcon,
  ChefHatIcon,
  KeyboardIcon,
  MicIcon,
  SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { NutritionDrawerBody } from "./nutrition-drawer-layout.jsx";
import {
  AI_USAGE_FEATURES,
  getAiAccessDisabledProps,
  getAiAccessStatus,
} from "@/hooks/app/use-ai-access";

import map from "lodash/map";

const METHOD_ACTIONS = [
  {
    key: "camera",
    label: "Kamera",
    description: "Rasm yoki barcode",
    icon: CameraIcon,
    className: "bg-emerald-500/10",
    iconClassName: "border-emerald-400/45 text-emerald-500",
    handler: "onOpenCamera",
    feature: AI_USAGE_FEATURES.foodPhotoScan,
  },
  {
    key: "text",
    label: "Matn",
    description: "Ovqatni yozish",
    icon: KeyboardIcon,
    className: "bg-orange-500/10",
    iconClassName: "border-orange-400/45 text-orange-500",
    handler: "onOpenText",
    feature: AI_USAGE_FEATURES.textMealLog,
    gateRootByAccess: true,
  },
  {
    key: "audio",
    label: "Audio",
    description: "Ovozdan draft",
    icon: MicIcon,
    className: "bg-violet-500/10",
    iconClassName: "border-violet-400/45 text-violet-500",
    handler: "onOpenAudio",
    feature: AI_USAGE_FEATURES.voiceMealLog,
    gateRootByAccess: true,
  },
  {
    key: "catalog",
    label: "Katalog",
    description: "Aniq qidirish",
    icon: SearchIcon,
    className: "bg-sky-500/10",
    iconClassName: "border-sky-400/45 text-sky-500",
    handler: "onOpenCatalog",
  },
];

const getMealAddTitle = (mealLabel) => {
  const safeLabel = String(mealLabel || "Ovqat").trim();
  const lowerLabel = safeLabel.toLowerCase();
  const suffix = lowerLabel.endsWith("k")
    ? "ka"
    : lowerLabel.endsWith("q")
      ? "qa"
      : "ga";

  return `${safeLabel}${suffix} ovqat qo'shish`;
};

const MethodButton = ({ action, costs, disabled, handlers, wallet }) => {
  const Icon = action.icon;
  const handler = handlers[action.handler];
  const accessStatus = action.feature
    ? getAiAccessStatus({ wallet, costs, feature: action.feature })
    : null;
  const accessDisabledProps = action.feature && action.gateRootByAccess
    ? getAiAccessDisabledProps({ wallet, costs, feature: action.feature })
    : {};
  const isDisabled =
    disabled || Boolean(action.gateRootByAccess && accessStatus?.isDisabled);

  return (
    <button
      type="button"
      {...accessDisabledProps}
      disabled={isDisabled}
      aria-label={action.label}
      className={cn(
        "flex aspect-[1.55] min-h-[104px] w-full flex-col items-center justify-center gap-3 rounded-[1.5rem] p-3 text-center transition-transform active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        action.className,
      )}
      onClick={handler}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full border bg-background/45",
          action.iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold leading-tight tracking-normal text-foreground">
        {action.label}
      </span>
    </button>
  );
};

const SavedMealsButton = ({ disabled, onOpenSavedMeals }) => (
  <button
    type="button"
    disabled={disabled}
    aria-label="Saqlangan taomlar"
    className={cn(
      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background/60 active:bg-background/80",
      "disabled:cursor-not-allowed disabled:opacity-60",
    )}
    onClick={onOpenSavedMeals}
  >
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-orange-500">
      <ChefHatIcon className="size-5" strokeWidth={2.1} />
    </span>
    <span className="min-w-0">
      <span className="block text-base font-semibold leading-tight text-foreground">
        Saqlangan taomlar
      </span>
      <span className="mt-0.5 block truncate text-xs font-medium leading-tight text-muted-foreground">
        Oldindan saqlangan ovqatlardan qo'shish
      </span>
    </span>
  </button>
);

export default function SmartAddSheet({
  disabled = false,
  mealLabel,
  onOpenAudio,
  onOpenCamera,
  onOpenCatalog,
  onOpenSavedMeals,
  onOpenText,
  aiAccessCosts = {},
  aiAccessWallet,
}) {
  const title = getMealAddTitle(mealLabel);
  const handlers = {
    onOpenAudio,
    onOpenCamera,
    onOpenCatalog,
    onOpenText,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerHeader className="pb-3">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>
          Ovqat qo'shish usulini tanlang
        </DrawerDescription>
      </DrawerHeader>
      <NutritionDrawerBody className="flex flex-col pb-6 pt-0">
        <section>
          <div
            data-testid="method-action-list"
            className="grid grid-cols-2 gap-2.5"
          >
            {map(METHOD_ACTIONS, (action) => (
              <MethodButton
                key={action.key}
                action={action}
                costs={aiAccessCosts}
                disabled={disabled}
                handlers={handlers}
                wallet={aiAccessWallet}
              />
            ))}
          </div>
          <div
            data-testid="saved-meals-action-list"
            className="mt-4 overflow-hidden rounded-[1.5rem] bg-muted/45"
          >
            <SavedMealsButton
              disabled={disabled}
              onOpenSavedMeals={onOpenSavedMeals}
            />
          </div>
        </section>
      </NutritionDrawerBody>
    </div>
  );
}
