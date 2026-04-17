import React from "react";
import { sumBy, values } from "lodash";
import {
  BanknoteIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CrownIcon,
  DumbbellIcon,
  FlameIcon,
  GlassWaterIcon,
  MessageSquareIcon,
  TargetIcon,
  TrophyIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UtensilsIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  getTodayKey,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import {
  useCoachNotificationsFeed,
  useUserNotificationsFeed,
} from "@/hooks/app/use-notifications";
import {
  useAuthStore,
  useGamificationStore,
  useNotificationsStore,
} from "@/store";
import { PROFILE_SETTINGS_DEFAULTS } from "@/hooks/app/use-profile-settings";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

const formatTimeLabel = (value) => {
  if (!value) {
    return "Hozir";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" && value.trim() ? value : "Hozir";
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleDateString("uz-UZ");
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes <= 1) {
    return "Hozir";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} daqiqa oldin`;
  }

  if (diffHours < 24) {
    return `${diffHours} soat oldin`;
  }

  if (diffDays < 7) {
    return `${diffDays} kun oldin`;
  }

  return date.toLocaleDateString("uz-UZ");
};

const resolveNotificationPresentation = (notification) => {
  const type = String(notification?.type || "");
  const severity = String(notification?.severity || "");

  switch (type) {
    case "challenge_invitation":
      return { icon: TrophyIcon, color: "text-amber-500" };
    case "friend_request_incoming":
      return { icon: UserPlusIcon, color: "text-emerald-500" };
    case "friend_request_outgoing_summary":
      return { icon: ClockIcon, color: "text-cyan-500" };
    case "coach_invitation":
      return { icon: UserPlusIcon, color: "text-blue-500" };
    case "weekly_check_in":
    case "checkin_overdue":
      return {
        icon: CalendarIcon,
        color: severity === "high" ? "text-red-500" : "text-violet-500",
      };
    case "check_in_submitted":
    case "coach_check_in_submitted":
      return { icon: CalendarIcon, color: "text-emerald-500" };
    case "coach_session_reminder":
    case "session_reminder":
      return { icon: ClockIcon, color: "text-cyan-500" };
    case "coach_feedback":
      return { icon: MessageSquareIcon, color: "text-violet-500" };
    case "coach_task":
      return {
        icon: TargetIcon,
        color: severity === "high" ? "text-red-500" : "text-cyan-500",
      };
    case "coach_plan_update":
    case "plan_update_pending":
      return { icon: UtensilsIcon, color: "text-orange-500" };
    case "coach_connected":
      return { icon: MessageSquareIcon, color: "text-emerald-500" };
    case "coach_payment_due":
    case "coach_payment_overdue":
    case "payment_overdue":
    case "client_payment":
      return {
        icon: BanknoteIcon,
        color: severity === "high" ? "text-red-500" : "text-amber-500",
      };
    case "coach_course_purchase":
    case "course_purchase":
      return { icon: CrownIcon, color: "text-emerald-500" };
    case "coach_bot_error":
    case "bot_error":
      return { icon: BellIcon, color: "text-red-500" };
    case "premium_expiring":
      return { icon: CrownIcon, color: "text-amber-500" };
    case "premium_upsell":
      return { icon: CrownIcon, color: "text-primary" };
    case "client_request":
      return { icon: UserPlusIcon, color: "text-blue-500" };
    case "sent_invitations_summary":
      return { icon: ClockIcon, color: "text-cyan-500" };
    case "inactive_client":
      return { icon: TrendingUpIcon, color: "text-orange-500" };
    case "marketplace_review":
      return {
        icon: BellIcon,
        color: severity === "medium" ? "text-orange-500" : "text-emerald-500",
      };
    default:
      return { icon: BellIcon, color: "text-muted-foreground" };
  }
};

const normalizeFeedNotifications = (items = []) =>
  items.map((notification) => {
    const presentation = resolveNotificationPresentation(notification);

    return {
      ...notification,
      icon: presentation.icon,
      color: presentation.color,
      time: formatTimeLabel(notification.createdAt),
      read: Boolean(notification.read),
      source: "server",
    };
  });

const mergeNotifications = (...groups) => {
  const itemsById = new Map();

  groups.flat().forEach((item) => {
    if (!item?.id) {
      return;
    }

    if (!itemsById.has(item.id)) {
      itemsById.set(item.id, item);
    }
  });

  return Array.from(itemsById.values()).sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
};

const useCoachNotifications = (roleKey, options = {}) => {
  const enabled = options.enabled ?? true;
  const {
    items,
    hasMore,
    loadMore,
    markNotificationRead,
    markAllNotificationsRead,
    isUpdatingNotificationState,
  } = useCoachNotificationsFeed({ enabled });

  return React.useMemo(() => {
    const notifications =
      normalizeFeedNotifications(items).length > 0
        ? normalizeFeedNotifications(items)
        : [
            {
              id: `${roleKey}:empty`,
              icon: ClockIcon,
              title: "Hozircha bildirishnoma yo'q",
              message:
                "Coach jarayonlari bo'yicha signal va yangilanishlar shu yerda ko'rinadi.",
              time: "",
              read: true,
              color: "text-muted-foreground",
              category: "system",
              createdAt: new Date(0).toISOString(),
              source: "local",
            },
          ];

    return {
      notifications,
      hasMore,
      loadMore,
      markNotificationRead,
      markAllNotificationsRead,
      isUpdatingNotificationState,
    };
  }, [
    enabled,
    hasMore,
    isUpdatingNotificationState,
    items,
    loadMore,
    markAllNotificationsRead,
    markNotificationRead,
    roleKey,
  ]);
};

const useUserNotifications = (roleKey, options = {}) => {
  const enabled = options.enabled ?? true;
  const user = useAuthStore((state) => state.user);
  const { streak } = useGamificationStore();
  const { goals } = useHealthGoals({ enabled });
  const { dayData } = useDailyTrackingDay(getTodayKey(), { enabled });
  const {
    items: feedItems,
    hasMore,
    loadMore,
    markNotificationRead,
    markAllNotificationsRead,
    isUpdatingNotificationState,
  } = useUserNotificationsFeed({ enabled });

  return React.useMemo(() => {
    if (!enabled) {
      return {
        notifications: [],
        hasMore: false,
        loadMore: () => {},
        markNotificationRead,
        markAllNotificationsRead,
        isUpdatingNotificationState,
      };
    }

    const settings = {
      ...PROFILE_SETTINGS_DEFAULTS,
      ...(user?.settings ?? {}),
    };
    const mealCount = values(dayData.meals ?? {}).reduce(
      (count, items) => count + items.length,
      0,
    );
    const waterGoalMl = Number(goals.waterMl) || 0;
    const cupSize = Number(goals.cupSize) || 250;
    const waterConsumedMl =
      Array.isArray(dayData.waterLog) && dayData.waterLog.length > 0
        ? sumBy(dayData.waterLog, (entry) => Number(entry.amountMl) || cupSize)
        : (Number(dayData.waterCups) || 0) * cupSize;
    const stepGoal = Number(goals.steps) || 0;
    const workoutGoal = Number(goals.workoutMinutes) || 0;
    const currentHour = new Date().getHours();
    const progressNotifications = [];

    if (
      settings.pushWater &&
      waterGoalMl > 0 &&
      currentHour >= 10 &&
      waterConsumedMl < waterGoalMl
    ) {
      progressNotifications.push({
        id: `${roleKey}:water:${getTodayKey()}`,
        icon: GlassWaterIcon,
        title: "Suv eslatmasi",
        message: `${(waterConsumedMl / 1000).toFixed(1)}L ichildi. Bugungi maqsad ${(waterGoalMl / 1000).toFixed(1)}L.`,
        time: "Hozir",
        read: waterConsumedMl >= waterGoalMl * 0.8,
        color: "text-sky-500",
        target: "/user/water",
        category: "progress",
        createdAt: new Date().toISOString(),
        source: "local",
      });
    }

    if (settings.pushMeal && currentHour >= 12) {
      if (mealCount === 0) {
        progressNotifications.push({
          id: `${roleKey}:meal-empty:${getTodayKey()}`,
          icon: UtensilsIcon,
          title: "Ovqatlanish eslatmasi",
          message:
            "Bugungi ovqatlar hali kiritilmagan. Kunlik rejangizni to'ldiring.",
          time: "Bugun",
          read: false,
          color: "text-orange-500",
          target: "/user/nutrition",
          category: "progress",
          createdAt: new Date().toISOString(),
          source: "local",
        });
      } else if (currentHour >= 18 && mealCount < 2) {
        progressNotifications.push({
          id: `${roleKey}:meal-progress:${getTodayKey()}`,
          icon: UtensilsIcon,
          title: "Kunlik reja hali to'liq emas",
          message: `Hozircha ${mealCount} ta ovqat kiritilgan. Kechki ovqatni ham belgilab qo'ying.`,
          time: "Bugun",
          read: false,
          color: "text-orange-500",
          target: "/user/nutrition",
          category: "progress",
          createdAt: new Date().toISOString(),
          source: "local",
        });
      }
    }

    if (
      settings.pushProgress &&
      streak > 0 &&
      (!settings.showActivity || currentHour >= 9)
    ) {
      progressNotifications.push({
        id: `${roleKey}:streak`,
        icon: FlameIcon,
        title: "Streak davom etmoqda",
        message: `${streak} kunlik streakni bugun ham davom ettiring.`,
        time: "Bugun",
        read: false,
        color: "text-amber-500",
        target: "/user/dashboard",
        category: "progress",
        createdAt: new Date().toISOString(),
        source: "local",
      });
    }

    if (
      settings.pushProgress &&
      stepGoal > 0 &&
      currentHour >= 18 &&
      (Number(dayData.steps) || 0) < stepGoal
    ) {
      progressNotifications.push({
        id: `${roleKey}:steps:${getTodayKey()}`,
        icon: TargetIcon,
        title: "Qadam maqsadi qolmoqda",
        message: `${Number(dayData.steps) || 0} / ${stepGoal.toLocaleString("en-US")} qadam bajarildi.`,
        time: "Bugun",
        read: false,
        color: "text-emerald-500",
        target: "/user/dashboard",
        category: "progress",
        createdAt: new Date().toISOString(),
        source: "local",
      });
    }

    if (
      settings.pushProgress &&
      workoutGoal > 0 &&
      currentHour >= 17 &&
      (Number(dayData.workoutMinutes) || 0) < workoutGoal
    ) {
      progressNotifications.push({
        id: `${roleKey}:workout:${getTodayKey()}`,
        icon: DumbbellIcon,
        title: "Mashg'ulot hali yopilmadi",
        message: `${Number(dayData.workoutMinutes) || 0} / ${workoutGoal} daqiqa mashg'ulot yozilgan.`,
        time: "Bugun",
        read: false,
        color: "text-violet-500",
        target: "/user/workout",
        category: "progress",
        createdAt: new Date().toISOString(),
        source: "local",
      });
    }

    const notifications = mergeNotifications(
      normalizeFeedNotifications(feedItems),
      progressNotifications,
    );

    if (notifications.length > 0) {
      return {
        notifications,
        hasMore,
        loadMore,
        markNotificationRead,
        markAllNotificationsRead,
        isUpdatingNotificationState,
      };
    }

    return {
      notifications: [
        {
          id: `${roleKey}:summary`,
          icon: TrendingUpIcon,
          title: "Hammasi joyida",
          message: "Bugungi asosiy maqsadlar va eslatmalar nazorat ostida.",
          time: "Bugun",
          read: true,
          color: "text-emerald-500",
          target: "/user/dashboard",
          category: "system",
          createdAt: new Date(0).toISOString(),
          source: "local",
        },
      ],
      hasMore: false,
      loadMore: () => {},
      markNotificationRead,
      markAllNotificationsRead,
      isUpdatingNotificationState,
    };
  }, [
    dayData,
    enabled,
    feedItems,
    goals,
    hasMore,
    isUpdatingNotificationState,
    loadMore,
    markAllNotificationsRead,
    markNotificationRead,
    roleKey,
    streak,
    user,
  ]);
};

const NOTIFICATION_FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "unread", label: "O'qilmagan" },
  { value: "friends", label: "Do'stlar" },
  { value: "challenge", label: "Challenge" },
  { value: "coach", label: "Coach" },
  { value: "payment", label: "To'lov" },
  { value: "progress", label: "Progress" },
];

const resolveNotificationCategory = (notification) => {
  if (notification?.category) {
    return notification.category;
  }

  const id = String(notification?.id || "");

  if (id.includes(":friend-request")) {
    return "friends";
  }

  if (id.includes(":challenge-")) {
    return "challenge";
  }

  if (
    id.includes(":coach-payment:") ||
    id.includes(":premium-") ||
    id.includes(":payout:")
  ) {
    return "payment";
  }

  if (
    id.includes(":coach-") ||
    id.includes(":client:") ||
    id.includes(":session:")
  ) {
    return "coach";
  }

  if (
    id.includes(":water:") ||
    id.includes(":meal") ||
    id.includes(":steps:") ||
    id.includes(":workout:") ||
    id.includes(":streak")
  ) {
    return "progress";
  }

  return "system";
};

export const useNotificationCenterModel = () => {
  const navigate = useNavigate();
  const { openProfile } = useProfileOverlay();
  const activeRole = useAuthStore((state) => state.activeRole);
  const isUser = activeRole === "USER";
  const isCoach = activeRole === "COACH";
  const roleKey = String(activeRole || "USER").toLowerCase();
  const coachNotificationsFeed = useCoachNotifications(roleKey, {
    enabled: isCoach,
  });
  const userNotificationsFeed = useUserNotifications(roleKey, {
    enabled: isUser,
  });
  const adminNotifications = React.useMemo(
    () => ({
      notifications: [
        {
          id: `${roleKey}:admin-summary`,
          icon: ClockIcon,
          title: "Admin bildirishnomalari",
          message:
            "Asosiy signal va yangilanishlar admin dashboard kartalarida ko'rsatiladi.",
          time: "Hozir",
          read: true,
          color: "text-muted-foreground",
          target: "/admin/dashboard",
          category: "system",
          source: "local",
        },
      ],
      markNotificationRead: null,
      markAllNotificationsRead: null,
      isUpdatingNotificationState: false,
    }),
    [roleKey],
  );
  const activeFeed = isCoach
    ? coachNotificationsFeed
    : isUser
      ? userNotificationsFeed
      : adminNotifications;
  const notifications = activeFeed.notifications;
  const hasMore = activeFeed.hasMore ?? false;
  const loadMore = activeFeed.loadMore ?? (() => {});
  const storedNotifications = useNotificationsStore(
    (state) => state.notifications,
  );
  const setInitialNotifications = useNotificationsStore(
    (state) => state.setInitialNotifications,
  );
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const [activeFilter, setActiveFilter] = React.useState("all");

  const handleNotificationClick = React.useCallback(
    async (notification) => {
      markRead(notification.id);

      if (notification.source === "server" && activeFeed.markNotificationRead) {
        try {
          await activeFeed.markNotificationRead(notification.id);
        } catch (error) {
          console.error("Failed to mark notification as read", error);
        }
      }

      if (notification.id.includes(":coach-connected:")) {
        openProfile();
        return;
      }

      if (notification.id.includes(":coach-plan-update:")) {
        navigate("/user/nutrition", {
          state: {
            openMealPlansDrawer: true,
            planFilter: "coach",
            planId: notification.id.split(":").pop(),
          },
        });
        return;
      }

      if (notification.id.includes(":weekly-check-in:")) {
        navigate("/user/dashboard", {
          state: {
            openWeeklyCheckInId: notification.id.split(":").pop(),
          },
        });
        return;
      }

      if (notification.id.includes(":challenge-invitation:")) {
        navigate(notification.target || "/user/challenges");
        return;
      }

      if (notification.target) {
        navigate(notification.target);
      }
    },
    [activeFeed, markRead, navigate, openProfile],
  );

  React.useEffect(() => {
    setInitialNotifications(notifications);
  }, [notifications, setInitialNotifications]);

  const unreadCount = storedNotifications.filter(
    (notification) => !notification.read,
  ).length;
  const filteredNotifications = React.useMemo(
    () =>
      storedNotifications.filter((notification) => {
        if (activeFilter === "all") {
          return true;
        }

        if (activeFilter === "unread") {
          return !notification.read;
        }

        return resolveNotificationCategory(notification) === activeFilter;
      }),
    [activeFilter, storedNotifications],
  );

  const handleMarkAllRead = React.useCallback(async () => {
    markAllRead();

    if (activeFeed.markAllNotificationsRead) {
      try {
        await activeFeed.markAllNotificationsRead();
      } catch (error) {
        console.error("Failed to mark all notifications as read", error);
      }
    }
  }, [activeFeed, markAllRead]);

  const openNotificationSettings = React.useCallback(() => {
    openProfile("notifications");
  }, [openProfile]);

  return {
    activeFilter,
    filteredNotifications,
    handleMarkAllRead,
    handleNotificationClick,
    hasMore,
    loadMore,
    isUpdatingNotificationState: activeFeed.isUpdatingNotificationState,
    openNotificationSettings,
    setActiveFilter,
    unreadCount,
  };
};

export const NotificationFeedPanel = ({
  model,
  className,
  contentClassName,
  showSettingsAction = false,
  onSelectNotification,
}) => {
  const {
    activeFilter,
    filteredNotifications,
    handleMarkAllRead,
    handleNotificationClick,
    hasMore,
    loadMore,
    isUpdatingNotificationState,
    openNotificationSettings,
    setActiveFilter,
    unreadCount,
  } = model;

  const handleSelect = React.useCallback(
    (notification) => {
      if (onSelectNotification) {
        onSelectNotification(notification);
        return;
      }

      void handleNotificationClick(notification);
    },
    [handleNotificationClick, onSelectNotification],
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Bildirishnomalar</span>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {unreadCount} yangi
            </span>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={isUpdatingNotificationState}
            className="flex shrink-0 items-center gap-1 text-xs font-normal text-primary hover:underline disabled:opacity-60"
          >
            <CheckIcon className="size-3" />
            Barchasini o&apos;qish
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-3">
        {NOTIFICATION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              activeFilter === filter.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1",
          contentClassName,
        )}
      >
        {filteredNotifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:bg-muted/40"
            onClick={() => handleSelect(notification)}
          >
            <div
              className={cn(
                "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                notification.read ? "bg-muted" : "bg-primary/10",
              )}
            >
              <notification.icon className={cn("size-4", notification.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm",
                    !notification.read && "font-semibold",
                  )}
                >
                  {notification.title}
                </p>
                {!notification.read ? (
                  <div className="size-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </p>
              {notification.time ? (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {notification.time}
                </p>
              ) : null}
            </div>
          </button>
        ))}
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            className="mt-2 w-full rounded-xl border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            Ko&apos;proq yuklash
          </button>
        ) : null}
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            Bu filter uchun bildirishnoma topilmadi.
          </div>
        ) : null}
      </div>

      {showSettingsAction ? (
        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openNotificationSettings}
          >
            Bildirishnoma sozlamalari
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const NotificationCenter = ({ className, ...props }) => {
  const [open, setOpen] = React.useState(false);
  const model = useNotificationCenterModel();

  return (
    <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("relative", className)}
        onClick={() => setOpen(true)}
        {...props}
      >
        <BellIcon className="size-4" />
        {model.unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
            {model.unreadCount}
          </span>
        ) : null}
      </Button>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Bildirishnomalar</DrawerTitle>
          <DrawerDescription>
            So&apos;nggi signal va eslatmalar shu yerda ko&apos;rinadi.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <NotificationFeedPanel
            model={model}
            contentClassName="max-h-[50vh]"
            showSettingsAction={false}
            onSelectNotification={(notification) => {
              setOpen(false);
              void model.handleNotificationClick(notification);
            }}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              model.openNotificationSettings();
            }}
          >
            Bildirishnoma sozlamalari
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationCenter;
