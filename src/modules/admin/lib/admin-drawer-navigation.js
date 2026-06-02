import React from "react";
import { useLocation, useNavigate } from "react-router";

import toNumber from "lodash/toNumber";

export const ADMIN_DRAWER_RETURN_TO_STATE_KEY = "adminDrawerReturnTo";

const buildReturnTo = (location) =>
  `${location.pathname}${location.search}${location.hash}`;

const hasBrowserHistoryEntry = () => {
  if (typeof window === "undefined") return false;

  const index = toNumber(window.history.state?.idx);
  return Number.isFinite(index) && index > 0;
};

const isSafeAdminPath = (path) =>
  typeof path === "string" && path.startsWith("/admin/");

export const useAdminDrawerListNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return React.useCallback(
    (to, options = {}) => {
      const nextState =
        options.state && typeof options.state === "object"
          ? options.state
          : {};

      navigate(to, {
        ...options,
        state: {
          ...nextState,
          [ADMIN_DRAWER_RETURN_TO_STATE_KEY]: buildReturnTo(location),
        },
      });
    },
    [location, navigate],
  );
};

export const useAdminDrawerCloseNavigation = (fallbackPath) => {
  const navigate = useNavigate();
  const location = useLocation();

  return React.useCallback(() => {
    const returnTo = location.state?.[ADMIN_DRAWER_RETURN_TO_STATE_KEY];

    if (returnTo && hasBrowserHistoryEntry()) {
      navigate(-1);
      return;
    }

    navigate(isSafeAdminPath(returnTo) ? returnTo : fallbackPath, {
      replace: true,
    });
  }, [fallbackPath, location.state, navigate]);
};
