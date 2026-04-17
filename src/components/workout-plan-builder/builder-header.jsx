import React, { useRef, useEffect, memo } from "react";
import { map, get } from "lodash";
import { useTranslation } from "react-i18next";
import {
  XIcon,
  SparklesIcon,
  PlusIcon,
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
}) => {
  const { t } = useTranslation();
  const dayScrollRef = useRef(null);
  const activeDayRef = useRef(null);

  useEffect(() => {
    if (activeDayRef.current && dayScrollRef.current) {
      activeDayRef.current.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [selectedDayId]);

  return (
    <DrawerHeader>
      <DrawerTitle className="flex items-center md:gap-x-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label={t("components.workoutPlanBuilder.header.closeLabel")}
          className="hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 size-9 rounded-full"
        >
          <XIcon className="size-4" />
        </Button>
        <div className="flex-1 justify-center md:justify-start flex items-center gap-3">
          {title || t("components.workoutPlanBuilder.header.title")}
          <SparklesIcon className="size-3.5 text-amber-500" />
        </div>
      </DrawerTitle>
      <DrawerDescription className="text-center md:text-start">
        {description || t("components.workoutPlanBuilder.header.description")}
      </DrawerDescription>

      {/* Day pills */}
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
    </DrawerHeader>
  );
});

export default BuilderHeader;
