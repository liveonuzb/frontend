import { describe, expect, it } from "vitest";
import {
  buildProfileRoutePath,
  getProfileRouteState,
  stripProfileRouteSuffix,
} from "./profile-route-state";

describe("profile-route-state", () => {
  it("detects profile overview suffix and strips it from the base path", () => {
    expect(getProfileRouteState("/user/dashboard/profile")).toEqual({
      isProfileOpen: true,
      basePath: "/user/dashboard",
      activeProfileTab: "overview",
      activeProfileDrawer: null,
      shouldSanitize: false,
      sanitizedPath: "/user/dashboard/profile",
    });
    expect(stripProfileRouteSuffix("/user/dashboard/profile")).toBe(
      "/user/dashboard",
    );
  });

  it("keeps nested page paths intact while extracting profile tab and drawer", () => {
    expect(
      getProfileRouteState(
        "/user/nutrition/overview/profile/security/2fa-disable",
      ),
    ).toMatchObject({
      isProfileOpen: true,
      basePath: "/user/nutrition/overview",
      activeProfileTab: "security",
      activeProfileDrawer: "2fa-disable",
      shouldSanitize: false,
    });
  });

  it("builds profile suffixes from the current route without duplicating profile segments", () => {
    expect(
      buildProfileRoutePath({
        pathname: "/admin/dashboard/profile/security",
        search: "?source=nav",
        tab: "premium",
        drawer: "checkout",
      }),
    ).toBe("/admin/dashboard/profile?source=nav");
  });

  it("normalizes removed premium profile routes to overview", () => {
    for (const path of [
      "/user/dashboard/profile/premium",
      "/user/dashboard/profile/premium/checkout",
      "/user/dashboard/profile/premium/invoices",
      "/user/dashboard/profile/premium/history",
    ]) {
      expect(getProfileRouteState(path)).toMatchObject({
        isProfileOpen: true,
        activeProfileTab: "overview",
        activeProfileDrawer: null,
        shouldSanitize: true,
        sanitizedPath: "/user/dashboard/profile",
      });
    }
  });

  it("supports XP history as a routed overview drawer", () => {
    expect(
      getProfileRouteState("/user/dashboard/profile/overview/xp-history"),
    ).toMatchObject({
      isProfileOpen: true,
      basePath: "/user/dashboard",
      activeProfileTab: "overview",
      activeProfileDrawer: "xp-history",
      shouldSanitize: false,
    });
    expect(
      buildProfileRoutePath({
        pathname: "/user/dashboard/profile/overview/xp",
        tab: "overview",
        drawer: "xp-history",
      }),
    ).toBe("/user/dashboard/profile/overview/xp-history");
  });

  it("supports target weight as a routed overview drawer", () => {
    expect(
      getProfileRouteState("/user/dashboard/profile/overview/target-weight"),
    ).toMatchObject({
      isProfileOpen: true,
      basePath: "/user/dashboard",
      activeProfileTab: "overview",
      activeProfileDrawer: "target-weight",
      shouldSanitize: false,
    });
    expect(
      buildProfileRoutePath({
        pathname: "/user/dashboard/profile",
        tab: "overview",
        drawer: "target-weight",
      }),
    ).toBe("/user/dashboard/profile/overview/target-weight");
  });

  it("supports friends as a routed profile section drawer", () => {
    expect(getProfileRouteState("/user/dashboard/profile/friends")).toMatchObject({
      isProfileOpen: true,
      basePath: "/user/dashboard",
      activeProfileTab: "friends",
      activeProfileDrawer: null,
      shouldSanitize: false,
    });
    expect(
      buildProfileRoutePath({
        pathname: "/user/dashboard",
        tab: "friends",
      }),
    ).toBe("/user/dashboard/profile/friends");
  });

  it("normalizes removed premium gift drawer routes", () => {
    expect(
      getProfileRouteState("/user/dashboard/profile/premium/gift"),
    ).toMatchObject({
      isProfileOpen: true,
      activeProfileTab: "overview",
      activeProfileDrawer: null,
      shouldSanitize: true,
      sanitizedPath: "/user/dashboard/profile",
    });
  });

  it("normalizes invalid drawers to their valid parent route", () => {
    expect(
      getProfileRouteState("/user/dashboard/profile/security/unknown-drawer"),
    ).toMatchObject({
      isProfileOpen: true,
      basePath: "/user/dashboard",
      activeProfileTab: "security",
      activeProfileDrawer: null,
      shouldSanitize: true,
      sanitizedPath: "/user/dashboard/profile/security",
    });
  });

  it("converts legacy query params into the path suffix model", () => {
    expect(
      getProfileRouteState("/user/dashboard", "?profile=open&profileTab=premium"),
    ).toMatchObject({
      isProfileOpen: true,
      activeProfileTab: "overview",
      shouldSanitize: true,
      sanitizedPath: "/user/dashboard/profile",
    });
  });
});
