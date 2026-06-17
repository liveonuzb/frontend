import React from "react";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import isArray from "lodash/isArray";
import orderBy from "lodash/orderBy";
import some from "lodash/some";
import toLower from "lodash/toLower";
import trim from "lodash/trim";
import {
  CrownIcon,
  GiftIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
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

const PREMIUM_GIFT_TYPE = "premium_gift_received";

const getPremiumGiftMetadata = (notification) => {
  const metadata = notification?.metadata;
  return metadata && typeof metadata === "object" && !isArray(metadata)
    ? metadata
    : {};
};

const getHasBlockingBottomDrawer = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector(
    '[data-slot="drawer-content"][data-vaul-drawer-direction="bottom"]:not([data-premium-gift-drawer="true"])',
  ) !== null;
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PremiumGiftReceivedDrawer = () => {
  const isAddMealOverlayOpen = useAddMealOverlayStore(
    (state) => state.isActionDrawerOpen,
  );
  const { items, markNotificationRead } = useUserNotificationsFeed({
    filter: "unread",
  });

  const unreadPremiumGifts = React.useMemo(
    () =>
      orderBy(
        filter(
          isArray(items) ? items : [],
          (notification) =>
            toLower(String(notification?.type ?? "")) === PREMIUM_GIFT_TYPE,
        ),
        [(notification) => new Date(notification?.createdAt ?? 0).getTime()],
        ["desc"],
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
  const blockingDrawerValueRef = React.useRef(false);
  const blockingDrawerFrameRef = React.useRef(null);

  const currentNotification = React.useMemo(
    () =>
      find(unreadPremiumGifts, (notification) => notification.id !== ackedId) ??
      null,
    [ackedId, unreadPremiumGifts],
  );

  React.useEffect(() => {
    const update = () => {
      const nextValue = getHasBlockingBottomDrawer();

      if (blockingDrawerValueRef.current === nextValue) {
        return;
      }

      blockingDrawerValueRef.current = nextValue;
      setHasBlockingBottomDrawer(nextValue);
    };

    const scheduleUpdate = () => {
      if (typeof window === "undefined") {
        update();
        return;
      }

      if (blockingDrawerFrameRef.current !== null) {
        return;
      }

      blockingDrawerFrameRef.current = window.requestAnimationFrame(() => {
        blockingDrawerFrameRef.current = null;
        update();
      });
    };

    scheduleUpdate();

    if (typeof MutationObserver === "undefined" || !document?.body) {
      return () => {
        if (
          typeof window !== "undefined" &&
          blockingDrawerFrameRef.current !== null
        ) {
          window.cancelAnimationFrame(blockingDrawerFrameRef.current);
          blockingDrawerFrameRef.current = null;
        }
      };
    }

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-vaul-drawer-direction"],
    });

    return () => {
      observer.disconnect();
      if (
        typeof window !== "undefined" &&
        blockingDrawerFrameRef.current !== null
      ) {
        window.cancelAnimationFrame(blockingDrawerFrameRef.current);
        blockingDrawerFrameRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!ackedId) {
      return;
    }

    if (!some(unreadPremiumGifts, (notification) => notification.id === ackedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAckedId(null);
    }
  }, [ackedId, unreadPremiumGifts]);

  React.useEffect(() => {
    if (!currentNotification) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    async (notification) => {
      if (!notification?.id || acknowledgingId === notification.id) {
        return;
      }

      closingNotificationIdRef.current = notification.id;
      setAckedId(notification.id);
      setAcknowledgingId(notification.id);
      setIsOpen(false);

      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        setAckedId(null);
        setIsOpen(true);
        toast.error("Premium sovg'a holatini saqlab bo'lmadi.");
      } finally {
        setAcknowledgingId(null);
        if (closingNotificationIdRef.current === notification.id) {
          closingNotificationIdRef.current = null;
        }
      }
    },
    [acknowledgingId, markNotificationRead],
  );

  const metadata = getPremiumGiftMetadata(currentNotification);
  const planName = trim(String(get(metadata, "planName", ""))) || "Premium";
  const expiresAt = formatDate(get(metadata, "expiresAt"));
  const note = trim(String(get(metadata, "note", "")));

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
        data-premium-gift-drawer="true"
        className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
      >
        <DrawerHeader className="items-center text-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Premium sovg'a xabarini yopish"
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
          <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-amber-500/10">
            <GiftIcon className="size-9 text-amber-500" />
          </div>
          <DrawerDescription>Admin sovg'asi</DrawerDescription>
          <DrawerTitle className="mt-1 text-xl font-semibold">
            {currentNotification?.title ?? "Premium sovg'a qilindi"}
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4 px-5 pb-5">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-amber-500">
                <CrownIcon className="size-4" />
                <span className="text-xs font-semibold">Plan</span>
              </div>
              <p className="text-sm font-semibold">{planName}</p>
              {expiresAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {expiresAt} gacha
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-center text-sm leading-6 text-muted-foreground">
            {currentNotification?.message ||
              "Premium obuna hisobingizga qo'shildi."}
          </p>

          {note ? (
            <p className="rounded-2xl bg-muted/50 px-4 py-3 text-center text-sm text-foreground">
              {note}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            onClick={() =>
              currentNotification
                ? void acknowledgeNotification(currentNotification)
                : undefined
            }
            disabled={Boolean(acknowledgingId)}
          >
            {acknowledgingId ? (
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
            ) : null}
            Tushunarli
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default PremiumGiftReceivedDrawer;
