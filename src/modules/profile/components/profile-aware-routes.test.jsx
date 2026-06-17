import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router";
import { describe, expect, it } from "vitest";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import ProfileAwareRoutes from "./profile-aware-routes";

const OverlayProbe = () => {
  const { activeProfileTab, isProfileOpen } = useProfileOverlay();

  return (
    <div>
      profile-state:{String(isProfileOpen)}:{activeProfileTab}
    </div>
  );
};

describe("ProfileAwareRoutes", () => {
  it("matches the stripped route while the URL keeps the profile suffix", () => {
    render(
      <MemoryRouter
        initialEntries={["/user/nutrition/overview/profile/security"]}
      >
        <ProfileAwareRoutes>
          <Route
            path="/user/nutrition/overview"
            element={<div>Nutrition overview</div>}
          />
          <Route path="*" element={<div>Not found</div>} />
        </ProfileAwareRoutes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Nutrition overview")).toBeInTheDocument();
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
  });

  it("keeps the actual profile suffix available to overlay consumers", () => {
    render(
      <MemoryRouter initialEntries={["/user/dashboard/profile"]}>
        <ProfileAwareRoutes>
          <Route path="/user/dashboard" element={<OverlayProbe />} />
          <Route path="*" element={<div>Not found</div>} />
        </ProfileAwareRoutes>
      </MemoryRouter>,
    );

    expect(screen.getByText("profile-state:true:overview")).toBeInTheDocument();
  });
});
