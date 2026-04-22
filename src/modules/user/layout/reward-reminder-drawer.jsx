import React from "react";
import { get } from "lodash";
import {
  AwardIcon,
  GiftIcon,
  LoaderCircleIcon,
  TrophyIcon,
  XIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useUserNotificationsFeed } from "@/hooks/app/use-notifications";
import { useAddMealOverlayStore } from "@/store";

const REWARD_TYPES = new Set(["achievement_earned", "referral_reward"]);

const getRewardMetadata = (notification) => {
  const metadata = notification?.metadata;
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : {};
};

const getRewardTarget = (notification) => {
  const type = String(notification?.type ?? "").trim().toLowerCase();
  return type === "achievement_earned"
    ? "/user/achievements"
    : "/user/referrals";
};

const getRewardConfirmLabel = (notification) => {
  const type = String(notification?.type ?? "").trim().toLowerCase();
  return type === "achievement_earned"
    ? "Yutuqlarni ko'rish"
    : "Referallarni ko'rish";
};

const getRewardIcon = (notification) => {
  const type = String(notification?.type ?? "").trim().toLowerCase();
  const metadata = getRewardMetadata(notification);
  const icon = typeof metadata.icon === "string" ? metadata.icon.trim() : "";

  if (type === "achievement_earned" && icon) {
    return <span className="text-4xl leading-none">{icon}</span>;
  }

  if (type === "achievement_earned") {
    return <TrophyIcon className="size-8 text-amber-500" />;
  }

  return <GiftIcon className="size-8 text-emerald-500" />;
};

const getRewardSubtitle = (notification) => {
  const type = String(notification?.type ?? "").trim().toLowerCase();
  return type === "achievement_earned"
    ? "Yangi achievement ochildi"
    : "Referral mukofoti tayyor";
};

const getRewardXpAmount = (notification) => {
  const metadata = getRewardMetadata(notification);
  const xpAmount = Number(
    metadata.xpReward ?? metadata.xpAmount ?? get(notification, "xpReward"),
  );

  return Number.isFinite(xpAmount) ? xpAmount : 0;
};

const getHasBlockingBottomDrawer = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector(
    '[data-slot="drawer-content"][data-vaul-drawer-direction="bottom"]:not([data-reward-reminder-drawer="true"])',
  ) !== null;
};

const RewardReminderDrawer = () => {
  const navigate = useNavigate();
  const isAddMealOverlayOpen = useAddMealOverlayStore(
    (state) => state.isActionDrawerOpen,
  );
  const { items, markNotificationRead } = useUserNotificationsFeed({
    filter: "unread",
  });

  const unreadRewards = React.useMemo(
    () =>
      (Array.isArray(items) ? items : [])
        .filter((notification) =>
          REWARD_TYPES.has(String(notification?.type ?? "").toLowerCase()),
        )
        .sort(
          (left, right) =>
            new Date(right?.createdAt ?? 0).getTime() -
            new Date(left?.createdAt ?? 0).getTime(),
        ),
    [items],
  );
  const [ackedId, setAckedId] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [acknowledgingId, setAcknowledgingId] = React.useState(null);
  const [hasBlockingBottomDrawer, setHasBlockingBottomDrawer] = React.useState(
    false,
  );
  const closingNotificationIdRef = React.useRef(null);

  const currentNotification = React.useMemo(
    () =>
      unreadRewards.find((notification) => notification.id !== ackedId) ?? null,
    [ackedId, unreadRewards],
  );

  React.useEffect(() => {
    const update = () => {
      setHasBlockingBottomDrawer(getHasBlockingBottomDrawer());
    };

    update();

    if (typeof MutationObserver === "undefined" || !document?.body) {
      return undefined;
    }

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-vaul-drawer-direction"],
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!ackedId) {
      return;
    }

    if (!unreadRewards.some((notification) => notification.id === ackedId)) {
      setAckedId(null);
    }
  }, [ackedId, unreadRewards]);

  React.useEffect(() => {
    if (!currentNotification) {
      setIsOpen(false);
      return;
    }

    if (
      isOpen ||
      acknowledgingId ||
      isAddMealOverlayOpen ||
      hasBlockingBottomDrawer
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (
        !getHasBlockingBottomDrawer() &&
        !useAddMealOverlayStore.getState().isActionDrawerOpen
      ) {
        setIsOpen(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    acknowledgingId,
    currentNotification,
    hasBlockingBottomDrawer,
    isAddMealOverlayOpen,
    isOpen,
  ]);

  const acknowledgeNotification = React.useCallback(
    async (notification, target = null) => {
      if (!notification?.id || acknowledgingId === notification.id) {
        return;
      }

      closingNotificationIdRef.current = notification.id;
      setAckedId(notification.id);
      setAcknowledgingId(notification.id);
      setIsOpen(false);

      try {
        await markNotificationRead(notification.id);
        if (target) {
          navigate(target);
        }
      } catch (error) {
        setAckedId(null);
        setIsOpen(true);
        toast.error("Reward reminder holatini saqlab bo'lmadi.");
      } finally {
        setAcknowledgingId(null);
        if (closingNotificationIdRef.current === notification.id) {
          closingNotificationIdRef.current = null;
        }
      }
    },
    [acknowledgingId, markNotificationRead, navigate],
  );

  const xpAmount = getRewardXpAmount(currentNotification);
  const confirmLabel = getRewardConfirmLabel(currentNotification);
  const target = getRewardTarget(currentNotification);

  return (
    <Drawer
      direction="bottom"
      shouldScaleBackground={false}
      open={Boolean(currentNotification) && isOpen}
      onOpenChange={(nextOpen) => {
        if (
          !nextOpen &&
          currentNotification &&
          closingNotificationIdRef.current !== currentNotification.id
        ) {
          void acknowledgeNotification(currentNotification);
        }
      }}
    >
      <DrawerContent
        data-reward-reminder-drawer="true"
        className="mx-auto max-w-md"
      >
        <DrawerHeader className="items-center text-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Reward reminderni yopish"
            className="absolute right-4 top-4 rounded-full"
            onClick={() => {
              if (currentNotification) {
                void acknowledgeNotification(currentNotification);
              }
            }}
            disabled={Boolean(acknowledgingId)}
          >
            <XIcon className="size-4" />
          </Button>
          <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-muted/60">
            {getRewardIcon(currentNotification)}
          </div>
          <DrawerDescription>
            {getRewardSubtitle(currentNotification)}
          </DrawerDescription>
          <DrawerTitle className="mt-1 text-xl font-semibold">
            {currentNotification?.title ?? "Yangi mukofot"}
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4 px-5 pb-5">
          <div className="rounded-3xl border border-border/60 bg-muted/40 p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-amber-500">
              <AwardIcon className="size-4" />
              <span className="text-sm font-semibold">Reward</span>
            </div>
            <p className="text-3xl font-black">+{xpAmount} XP</p>
          </div>

          <p className="text-center text-sm leading-6 text-muted-foreground">
            {currentNotification?.message || "Yangi reward sizni kutmoqda."}
          </p>

          <Button
            type="button"
            className="w-full"
            onClick={() =>
              currentNotification
                ? void acknowledgeNotification(currentNotification, target)
                : undefined
            }
            disabled={Boolean(acknowledgingId)}
          >
            {acknowledgingId ? (
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RewardReminderDrawer;
