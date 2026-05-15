import React from "react";
import { Button } from "@/components/ui/button.jsx";
import {
  CameraIcon,
  CalendarClockIcon,
  ChefHatIcon,
  KeyboardIcon,
  MicIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { NutritionDrawerBody } from "./nutrition-drawer-layout.jsx";

const METHOD_ACTIONS = [
  {
    key: "camera",
    label: "Kamera",
    description: "Rasm yoki barcode",
    icon: CameraIcon,
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    handler: "onOpenCamera",
  },
  {
    key: "text",
    label: "Matn",
    description: "Ovqatni yozish",
    icon: KeyboardIcon,
    iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    handler: "onOpenText",
  },
  {
    key: "audio",
    label: "Audio",
    description: "Ovozdan draft",
    icon: MicIcon,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    handler: "onOpenAudio",
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

const getMacroSummary = (item) =>
  [
    ["P", item.protein],
    ["C", item.carbs],
    ["F", item.fat],
  ]
    .map(([label, value]) => `${label} ${Math.round(Number(value) || 0)}g`)
    .join(" · ");

const QuickAddCard = ({
  disabled,
  isAdding,
  item,
  onEditQuickAdd,
  onQuickAdd,
}) => (
  <div className="grid grid-cols-[minmax(0,1fr)_44px] items-stretch overflow-hidden rounded-2xl border bg-card shadow-sm">
    <button
      type="button"
      className="flex min-w-0 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/35 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      aria-label={`${item.title}ni ko'rish`}
      onClick={() => onEditQuickAdd?.(item)}
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40">
        {item.image ? (
          <img
            loading="lazy"
            src={item.image}
            alt={item.title}
            className="size-full object-cover"
          />
        ) : (
          <ChefHatIcon className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black leading-tight">
            {item.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
              item.type === "saved"
                ? "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                : "bg-primary/10 text-primary",
            )}
          >
            {item.type === "saved" ? "Saqlangan" : "Recent"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">
            {Math.round(Number(item.calories) || 0)} kcal
          </span>
          <span>{getMacroSummary(item)}</span>
        </div>
      </div>
    </button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-full w-11 rounded-none border-l text-primary hover:bg-primary hover:text-primary-foreground"
      disabled={disabled || isAdding}
      aria-label={`${item.title}ni tez qo'shish`}
      onClick={() => onQuickAdd?.(item)}
    >
      <PlusIcon className="size-4" />
    </Button>
  </div>
);

const MethodButton = ({ action, disabled, handlers }) => {
  const Icon = action.icon;
  const handler = handlers[action.handler];

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      aria-label={action.label}
      className="h-auto justify-start rounded-2xl px-3 py-3 text-left"
      onClick={handler}
    >
      <span
        className={cn(
          "mr-3 grid size-9 shrink-0 place-items-center rounded-full",
          action.iconClassName,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{action.label}</span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
          {action.description}
        </span>
      </span>
    </Button>
  );
};

export default function SmartAddSheet({
  disabled = false,
  formattedTime,
  isQuickAddingId = null,
  mealLabel,
  onEditQuickAdd,
  onOpenAudio,
  onOpenCamera,
  onOpenCatalog,
  onOpenSavedMeals,
  onOpenText,
  onOpenTime,
  onQuickAdd,
  quickItems = [],
}) {
  const handlers = {
    onOpenAudio,
    onOpenCamera,
    onOpenCatalog,
    onOpenText,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              Ovqat qo'shish
            </p>
            <h2 className="mt-1 truncate text-xl font-black">{mealLabel}</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto shrink-0 rounded-2xl px-3 py-2 text-left"
            disabled={disabled}
            onClick={onOpenTime}
          >
            <CalendarClockIcon className="size-4 text-emerald-600" />
            <span className="ml-2 max-w-32 truncate text-xs font-bold">
              {formattedTime}
            </span>
          </Button>
        </div>
      </div>

      <NutritionDrawerBody className="flex flex-col gap-5 pb-6">
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black">Tez qo'shish</h3>
              <p className="text-xs text-muted-foreground">
                So'nggi va saqlangan taomlar
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-xs"
              onClick={onOpenSavedMeals}
            >
              Barchasini ko'rish
            </Button>
          </div>

          {quickItems.length > 0 ? (
            <div className="space-y-2">
              {quickItems.map((item) => (
                <QuickAddCard
                  key={item.id}
                  disabled={disabled}
                  isAdding={isQuickAddingId === item.id}
                  item={item}
                  onEditQuickAdd={onEditQuickAdd}
                  onQuickAdd={onQuickAdd}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/15 px-4 py-6 text-center">
              <p className="text-sm font-black">Hali tez qo'shish yo'q</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Saqlangan yoki yaqinda ishlatilgan taomlar bu yerda chiqadi.
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-2">
            <h3 className="text-sm font-black">Yangi ovqat</h3>
            <p className="text-xs text-muted-foreground">
              Kerakli qo'shish usulini tanlang
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {METHOD_ACTIONS.map((action) => (
              <MethodButton
                key={action.key}
                action={action}
                disabled={disabled}
                handlers={handlers}
              />
            ))}
          </div>
        </section>
      </NutritionDrawerBody>
    </div>
  );
}
