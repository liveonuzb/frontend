import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileDrawer from "./profile-drawer.jsx";
import { useAuthStore } from "@/store";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  useTranslation: () => ({
    i18n: { language: "uz" },
    t: (key, options = {}) =>
      typeof options === "string" ? options : options.defaultValue || key,
  }),
}));

vi.mock("@/hooks/api", async () => {
  const actual = await vi.importActual("@/hooks/api");
  const mutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  };

  return {
    ...actual,
    useGetQuery: () => ({
      data: undefined,
      isLoading: false,
      isFetching: false,
    }),
    usePatchQuery: () => mutation,
    usePostQuery: () => mutation,
    usePostFileQuery: () => mutation,
    usePutQuery: () => mutation,
  };
});

const renderProfileDrawer = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={["/user/dashboard?profile=open&profileTab=overview"]}
      >
        <ProfileDrawer />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ProfileDrawer", () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    useAuthStore.setState({
      isAuthenticated: true,
      roles: ["USER"],
      activeRole: "USER",
      user: {
        id: "user-1",
        firstName: "Fazliddin",
        lastName: "Liveon",
        username: "fazliddin",
        settings: { language: "uz" },
      },
    });
  });

  it("renders the overview without recursive updates", async () => {
    renderProfileDrawer();

    expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    });
  });

  it("renders the overview when user settings are missing", async () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        firstName: "Fazliddin",
        lastName: "Liveon",
        username: "fazliddin",
      },
    });

    renderProfileDrawer();

    await waitFor(() => {
      expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    });
  });
});
