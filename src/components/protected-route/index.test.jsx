import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "./index.jsx";

const authState = vi.hoisted(() => ({
  roles: ["USER"],
  isAuthenticated: true,
  user: { id: "user-1" },
  isHydrated: true,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div>page-loader</div>,
}));

vi.mock("@/store", () => ({
  useAuthStore: () => authState,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    Object.assign(authState, {
      roles: ["USER"],
      isAuthenticated: true,
      user: { id: "user-1" },
      isHydrated: true,
    });
  });

  it("waits for auth hydration before redirecting", () => {
    Object.assign(authState, {
      isAuthenticated: false,
      isHydrated: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected-content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("page-loader")).toBeInTheDocument();
    expect(screen.queryByText("protected-content")).not.toBeInTheDocument();
  });

  it("renders children after hydrated authenticated state", () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected-content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("protected-content")).toBeInTheDocument();
  });
});
