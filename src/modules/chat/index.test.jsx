import React from "react";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/chat/layout/index.jsx", () => ({
  default: () => (
    <div data-testid="chat-layout">
      <Outlet />
    </div>
  ),
}));

vi.mock("@/modules/chat/pages/chat-view/index.jsx", () => ({
  default: () => <div data-testid="chat-view">chat</div>,
}));

import ChatModule from "./index.jsx";

const setMobileViewport = (isMobile) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query) => ({
      matches: isMobile,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const renderChatRoute = (initialEntry) => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/chat/*",
        element: <ChatModule />,
      },
      {
        path: "/user/dashboard",
        element: <div>dashboard</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
};

describe("ChatModule mobile-only route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders chat on mobile viewports", () => {
    setMobileViewport(true);

    renderChatRoute("/user/chat");

    expect(screen.getByTestId("chat-layout")).toBeInTheDocument();
    expect(screen.getByTestId("chat-view")).toBeInTheDocument();
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("redirects desktop chat routes to the user dashboard", async () => {
    setMobileViewport(false);

    renderChatRoute("/user/chat/room-1");

    expect(await screen.findByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-view")).not.toBeInTheDocument();
  });
});
