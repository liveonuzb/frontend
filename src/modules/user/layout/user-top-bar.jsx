import React from "react";
import get from "lodash/get";
import join from "lodash/join";
import map from "lodash/map";
import split from "lodash/split";
import take from "lodash/take";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import { useTranslation } from "react-i18next";
import { CalendarDaysIcon, FlameIcon } from "lucide-react";
import NotificationCenter from "@/components/notification-center";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";

const getDisplayName = (user, fallback) =>
  trim(`${user?.firstName || ""} ${user?.lastName || ""}`) ||
  user?.username ||
  fallback;

const getInitials = (displayName) =>
  toUpper(
    join(
      take(
        map(split(displayName, " "), (part) => get(part, "[0]", "")),
        2,
      ),
      "",
    ),
  );

const UserTopBar = ({
  user,
  selectedDateLabel,
  onOpenCalendar,
  showCalendarButton = true,
}) => {
  const { t } = useTranslation();
  const { openProfile } = useProfileOverlay();
  const displayName = getDisplayName(
    user,
    t("common.navUser.user", "Foydalanuvchi"),
  );
  const initials = getInitials(displayName);
  const streakDays = Math.max(0, toNumber(get(user, "currentStreak", 0)) || 0);

  return (
    <div
      data-testid="user-layout-top-bar"
      className="flex items-center justify-between gap-3 pt-[max(0.25rem,env(safe-area-inset-top))]"
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 rounded-2xl text-left outline-none transition-opacity active:opacity-80"
        onClick={() => openProfile(PROFILE_OVERVIEW_TAB)}
        aria-label={`Profilni ochish: ${displayName}`}
      >
        <Avatar className="size-11 shrink-0 border-[3px] border-border/70 bg-card">
          <AvatarImage src={user?.avatar} alt={displayName} />
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 space-y-0.5">
          <span
            data-testid="user-layout-greeting-line"
            className="flex min-w-0 items-baseline gap-1.5 leading-tight"
          >
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              {t("user.dashboard.mobileGreeting", "Salom")}
            </span>{" "}
            <span className="truncate text-[15px] font-semibold text-foreground">
              {displayName}
            </span>
          </span>
          <span
            data-testid="user-layout-streak"
            className="flex items-center gap-1 text-[11px] font-medium leading-tight text-muted-foreground"
          >
            <FlameIcon className="size-3.5 text-orange-500" />
            <span>
              {t("user.dashboard.mobileStreakDays", {
                count: streakDays,
                defaultValue: "{{count}} kun",
              })}
            </span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationCenter className="size-11 rounded-full border-0 bg-card/80 shadow-none hover:bg-card/80 dark:hover:bg-card/80" />
        {showCalendarButton ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11 rounded-full border-0 bg-card/80 shadow-none hover:bg-card/80 hover:shadow-none dark:hover:bg-card/80"
            onClick={onOpenCalendar}
            aria-label={`Sana tanlash: ${selectedDateLabel}`}
          >
            <CalendarDaysIcon className="size-5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default UserTopBar;
