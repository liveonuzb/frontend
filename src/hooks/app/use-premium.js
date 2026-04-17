import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { ME_QUERY_KEY } from "@/hooks/app/use-profile-settings";

export const PREMIUM_QUERY_KEY = ["me", "premium"];
const PREMIUM_PENDING_CHECKOUT_KEY = "premium:pending-checkout";
const PREMIUM_PENDING_GIFT_KEY = "premium:pending-gift";

let isPremiumCheckoutReturnHandled = false;
let isPremiumGiftReturnHandled = false;

const readPendingCheckout = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PREMIUM_PENDING_CHECKOUT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const writePendingCheckout = (payload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    PREMIUM_PENDING_CHECKOUT_KEY,
    JSON.stringify(payload),
  );
};

const clearPendingCheckout = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PREMIUM_PENDING_CHECKOUT_KEY);
};

const readPendingGift = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PREMIUM_PENDING_GIFT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const clearPendingGift = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PREMIUM_PENDING_GIFT_KEY);
};

const writePendingGift = (payload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PREMIUM_PENDING_GIFT_KEY, JSON.stringify(payload));
};

const unwrapResponseData = (response) =>
  get(response, "data.data", get(response, "data", null));

const syncUserState = (queryClient, initializeUser, nextUser) => {
  if (!nextUser) {
    return;
  }

  initializeUser(nextUser);
  queryClient.setQueryData(ME_QUERY_KEY, { data: nextUser });
};

export const usePremium = () => {
  const queryClient = useQueryClient();
  const initializeUser = useAuthStore((state) => state.initializeUser);
  const { data, ...query } = useGetQuery({
    url: "/users/me/premium",
    queryProps: {
      queryKey: PREMIUM_QUERY_KEY,
    },
  });
  const premiumOverview = React.useMemo(
    () => unwrapResponseData(data) ?? {},
    [data],
  );

  const mutationProps = React.useMemo(
    () => ({
      onSuccess: async (response) => {
        const payload = unwrapResponseData(response) ?? {};
        syncUserState(
          queryClient,
          initializeUser,
          get(payload, "user", null),
        );
        await queryClient.invalidateQueries({ queryKey: PREMIUM_QUERY_KEY });
      },
    }),
    [initializeUser, queryClient],
  );

  const activateMutation = usePostQuery({
    queryKey: PREMIUM_QUERY_KEY,
    mutationProps,
  });
  const checkoutMutation = usePostQuery();
  const cancelMutation = usePatchQuery({
    queryKey: PREMIUM_QUERY_KEY,
    mutationProps,
  });
  const giftMutation = usePostQuery({ queryKey: PREMIUM_QUERY_KEY, mutationProps });
  const giftActivateMutation = usePostQuery({ queryKey: PREMIUM_QUERY_KEY, mutationProps });
  const [isFinalizingCheckout, setIsFinalizingCheckout] = React.useState(false);
  const [isFinalizingGift, setIsFinalizingGift] = React.useState(false);

  const activatePremium = React.useCallback(
    async (payload) =>
      activateMutation.mutateAsync({
        url: "/users/me/premium/activate",
        attributes: payload,
      }),
    [activateMutation],
  );

  const startPremiumCheckout = React.useCallback(
    async (payload) => {
      const response = await checkoutMutation.mutateAsync({
        url: "/users/me/premium/checkout",
        attributes: payload,
      });
      const data = unwrapResponseData(response) ?? {};

      if (data.mode === "redirect" && data.checkoutUrl) {
        writePendingCheckout(payload);
        window.location.assign(data.checkoutUrl);
        return { redirect: true, data };
      }

      const activationResponse = await activatePremium(payload);
      return {
        redirect: false,
        data: unwrapResponseData(activationResponse) ?? {},
      };
    },
    [activatePremium, checkoutMutation],
  );

  const cancelPremium = React.useCallback(
    async () =>
      cancelMutation.mutateAsync({
        url: "/users/me/premium/cancel",
        attributes: {},
      }),
    [cancelMutation],
  );

  const giftPremium = React.useCallback(
    async (payload) => {
      const response = await giftMutation.mutateAsync({
        url: "/users/me/premium/gift",
        attributes: {
          planSlug: payload.planSlug ?? payload.planCode,
          paymentMethod: payload.paymentMethod,
          recipientIdentifier: payload.recipientIdentifier,
          promoCode: payload.promoCode,
          note: payload.note,
        },
      });

      const data = unwrapResponseData(response) ?? {};

      if (data.mode === "redirect" && data.checkoutUrl) {
        writePendingGift({
          planSlug: payload.planSlug ?? payload.planCode,
          paymentMethod: payload.paymentMethod,
          recipientId: data.recipientId,
          promoCode: payload.promoCode,
          note: payload.note,
        });
      }

      return data;
    },
    [giftMutation],
  );

  const activateGift = React.useCallback(
    async (payload) =>
      giftActivateMutation.mutateAsync({
        url: "/users/me/premium/gift/activate",
        attributes: {
          planSlug: payload.planSlug ?? payload.planCode,
          paymentMethod: payload.paymentMethod,
          recipientId: payload.recipientId,
          promoCode: payload.promoCode,
          note: payload.note,
        },
      }),
    [giftActivateMutation],
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || isPremiumCheckoutReturnHandled) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("premiumCheckoutStatus") !== "paid") {
      return;
    }

    const pendingCheckout = readPendingCheckout();

    if (!pendingCheckout?.planCode) {
      return;
    }

    isPremiumCheckoutReturnHandled = true;
    setIsFinalizingCheckout(true);

    activatePremium(pendingCheckout)
      .catch(() => undefined)
      .finally(() => {
        clearPendingCheckout();
        params.delete("premiumCheckoutStatus");
        params.delete("planCode");
        params.delete("paymentMethod");
        params.delete("userId");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
        setIsFinalizingCheckout(false);
      });
  }, [activatePremium]);

  // Handle return from gift payment redirect
  React.useEffect(() => {
    if (typeof window === "undefined" || isPremiumGiftReturnHandled) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const giftStatus =
      params.get("premiumCheckoutStatus") ?? params.get("premiumGiftStatus");

    if (giftStatus !== "gift_paid" && giftStatus !== "paid") {
      return;
    }

    const pendingGift = readPendingGift();

    if (!pendingGift?.planSlug) {
      return;
    }

    isPremiumGiftReturnHandled = true;
    setIsFinalizingGift(true);

    activateGift(pendingGift)
      .catch(() => undefined)
      .finally(() => {
        clearPendingGift();
        params.delete("premiumCheckoutStatus");
        params.delete("premiumGiftStatus");
        params.delete("planSlug");
        params.delete("planCode");
        params.delete("paymentMethod");
        params.delete("recipientId");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
        setIsFinalizingGift(false);
      });
  }, [activateGift]);

  return {
    ...query,
    premium: get(premiumOverview, "premium", null),
    plans: get(premiumOverview, "plans", []),
    history: get(premiumOverview, "history", []),
    recentPayments: get(premiumOverview, "recentPayments", []),
    activatePremium,
    startPremiumCheckout,
    cancelPremium,
    giftPremium,
    activateGift,
    isPreparingCheckout: checkoutMutation.isPending,
    isActivating: activateMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isGifting: giftMutation.isPending,
    isFinalizingCheckout,
    isFinalizingGift,
  };
};

export default usePremium;
