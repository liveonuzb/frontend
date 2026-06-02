import React, { useRef, useEffect, memo } from "react";
import map from "lodash/map";
import get from "lodash/get";
import size from "lodash/size";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils.js";

const BuilderHeader = memo(({
  trainDays,
  selectedDayId,
  onSelectDay,
  onAddDay,
  onClose,
  lockWeekDays,
  title = null,
  description = null,
  asPage = false,
  onEditMeta,
  onOpenMobileLibrary,
}) => {
  const { t } = useTranslation();
  const dayScrollRef = useRef(null);
  const activeDayRef = useRef(null);
  const HeaderWrapper = asPage ? "div" : DrawerHeader;
  const TitleWrapper = asPage ? "h2" : DrawerTitle;
  const DescriptionWrapper = asPage ? "p" : DrawerDescription;

  useEffect(() => {
    if (activeDayRef.current && dayScrollRef.current) {
      activeDayRef.current.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [selectedDayId]);

  const hasDays = size(trainDays) > 0;

  return (
    <HeaderWrapper className="gap-0.5 p-4 md:gap-1.5 md:text-left flex flex-col">
      <TitleWrapper className="flex items-center text-base font-medium md:gap-x-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label={t("components.workoutPlanBuilder.header.closeLabel")}
          className="transition-colors shrink-0 size-9 rounded-full"
        >
          {asPage ? <ArrowLeftIcon /> : <XIcon />}
        </Button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 md:justify-start">
          <span className="truncate font-black">
            {title || t("components.workoutPlanBuilder.header.title")}
          </span>
          {onEditMeta ? (
            <button
              type="button"
              onClick={onEditMeta}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("components.workoutPlanBuilder.header.editMetaLabel")}
            >
              <PencilIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </TitleWrapper>
      <DescriptionWrapper className="text-sm text-muted-foreground text-center md:text-start">
        {description || t("components.workoutPlanBuilder.header.editMode")}
      </DescriptionWrapper>

      {!hasDays && onOpenMobileLibrary ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            {t("components.workoutPlanBuilder.header.addFirstExercise")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => {
              if (!hasDays && !lockWeekDays) {
                onAddDay();
              }
              onOpenMobileLibrary();
            }}
          >
            <PlusIcon data-icon="inline-start" />
            {t("components.workoutPlanBuilder.mobile.addExercise")}
          </Button>
        </div>
      ) : null}

      {/* Day pills */}
      {hasDays ? (
        <div
          ref={dayScrollRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-none mt-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {map(trainDays, (day) => {
            const isActive = selectedDayId === get(day, "id");
            return (
              <button
                key={get(day, "id")}
                ref={isActive ? activeDayRef : null}
                type="button"
                onClick={() => onSelectDay(get(day, "id"))}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                    : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground",
                )}
              >
                {get(day, "name")}
                {get(day, "focus") && (
                  <span className="ml-1 opacity-60 hidden sm:inline">
                    · {get(day, "focus")}
                  </span>
                )}
              </button>
            );
          })}
          {!lockWeekDays ? (
            <button
              type="button"
              onClick={onAddDay}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap border border-dashed border-border/40 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
            >
              <PlusIcon className="size-3 inline mr-0.5" />
              {t("components.workoutPlanBuilder.header.addDay")}
            </button>
          ) : null}
        </div>
      ) : null}
    </HeaderWrapper>
  );
});

BuilderHeader.displayName = "BuilderHeader";

export default BuilderHeader;
