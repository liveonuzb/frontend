import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import {
  PROFILE_OVERVIEW_TAB,
  getNormalizedProfileOverlayState,
  useProfileOverlay,
} from "./use-profile-overlay";

const HookProbe = () => {
  const location = useLocation();
  const {
    isProfileOpen,
    activeProfileTab,
    activeProfileDrawer,
    openProfile,
    closeProfile,
    setProfileTab,
    openProfileDrawer,
    closeProfileDrawer,
  } = useProfileOverlay();

  return (
    <div>
      <div data-testid="location">
        {location.pathname}
        {location.search}
      </div>
      <div data-testid="state">
        {String(isProfileOpen)}:{activeProfileTab}:{activeProfileDrawer ?? "-"}
      </div>
      <button
        type="button"
        onClick={() => openProfile("premium", "checkout")}
      >
        open removed premium
      </button>
      <button type="button" onClick={() => setProfileTab("security")}>
        security tab
      </button>
      <button
        type="button"
        onClick={() => openProfileDrawer("theme")}
      >
        theme drawer
      </button>
      <button type="button" onClick={closeProfileDrawer}>
        close drawer
      </button>
      <button type="button" onClick={closeProfile}>
        close profile
      </button>
    </div>
  );
};

const renderHookProbe = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HookProbe />
    </MemoryRouter>,
  );

describe("getNormalizedProfileOverlayState", () => {
  it("keeps a valid overlay tab", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: "open",
        profileTab: "health",
      }),
    ).toEqual({
      isProfileOpen: true,
      activeProfileTab: "health",
      shouldSanitize: false,
    });
  });

  it("falls back to overview for invalid overlay tabs", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: "open",
        profileTab: "unknown-tab",
      }),
    ).toEqual({
      isProfileOpen: true,
      activeProfileTab: PROFILE_OVERVIEW_TAB,
      shouldSanitize: true,
    });
  });

  it("ignores profileTab when the overlay is closed", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: null,
        profileTab: "health",
      }),
    ).toEqual({
      isProfileOpen: false,
      activeProfileTab: PROFILE_OVERVIEW_TAB,
      shouldSanitize: false,
    });
  });

  it("reads profile state from a nested path suffix", () => {
    renderHookProbe("/user/nutrition/overview/profile/security/2fa-disable");

    expect(screen.getByTestId("state")).toHaveTextContent(
      "true:security:2fa-disable",
    );
  });

  it("opens and closes profile paths while preserving normal query params", async () => {
    renderHookProbe("/user/dashboard?source=top");

    fireEvent.click(
      screen.getByRole("button", { name: "open removed premium" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard/profile?source=top",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "close profile" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard?source=top",
      );
    });
  });

  it("updates tabs and overview drawers through the route", async () => {
    renderHookProbe("/user/dashboard/profile");

    fireEvent.click(screen.getByRole("button", { name: "security tab" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard/profile/security",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "theme drawer" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard/profile/overview/theme",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "close drawer" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard/profile",
      );
    });
  });
});
