import React from "react";
import { Button } from "@/components/ui/button.jsx";
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
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    handler: "onOpenCamera",
    feature: AI_USAGE_FEATURES.foodPhotoScan,
  },
  {
    key: "text",
    label: "Matn",
    description: "Ovqatni yozish",
    icon: KeyboardIcon,
    iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    handler: "onOpenText",
    feature: AI_USAGE_FEATURES.textMealLog,
    gateRootByAccess: true,
  },
  {
    key: "audio",
    label: "Audio",
    description: "Ovozdan draft",
    icon: MicIcon,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    handler: "onOpenAudio",
    feature: AI_USAGE_FEATURES.voiceMealLog,
    gateRootByAccess: true,
  },
  {
    key: "catalog",
    label: "Katalog",
    description: "Aniq qidirish",
    icon: SearchIcon,
    iconClassName: "bg-primary/10 text-primary",
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
    <Button
      type="button"
      variant="outline"
      {...accessDisabledProps}
      disabled={isDisabled}
      aria-label={action.label}
      className="h-auto w-full justify-start rounded-2xl border-border/70 p-3 text-left"
      onClick={handler}
    >
      <span
        className={cn(
          "mr-3 grid size-10 shrink-0 place-items-center rounded-full",
          action.iconClassName,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{action.label}</span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
          {action.description}
        </span>
      </span>
    </Button>
  );
};

const SavedMealsButton = ({ disabled, onOpenSavedMeals }) => (
  <Button
    type="button"
    variant="outline"
    disabled={disabled}
    aria-label="Saqlangan taomlar"
    className="h-auto w-full justify-start rounded-2xl border-border/70 p-3 text-left"
    onClick={onOpenSavedMeals}
  >
    <span className="mr-3 grid size-10 shrink-0 place-items-center rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300">
      <ChefHatIcon className="size-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-black">Saqlangan taomlar</span>
      <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
        Oldindan saqlangan ovqatlardan qo'shish
      </span>
    </span>
  </Button>
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
          <div data-testid="method-action-list" className="space-y-2">
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
          <div className="mt-2">
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
