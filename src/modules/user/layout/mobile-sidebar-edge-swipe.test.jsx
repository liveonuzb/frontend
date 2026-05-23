import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileSidebarEdgeSwipe from "./mobile-sidebar-edge-swipe.jsx";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar.jsx";

vi.mock("@/hooks/utils/use-mobile", () => ({
  default: () => true,
}));

const SidebarStateProbe = () => {
  const { openMobile } = useSidebar();

  return (
    <div data-testid="sidebar-mobile-state">
      {openMobile ? "open" : "closed"}
    </div>
  );
};

const renderEdgeSwipe = ({ enabled = true } = {}) =>
  render(
    <SidebarProvider>
      <MobileSidebarEdgeSwipe enabled={enabled} />
      <SidebarStateProbe />
      <button type="button" data-testid="edge-button">
        Edge button
      </button>
    </SidebarProvider>,
  );

const dispatchPointer = (target, type, properties) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, properties);
  target.dispatchEvent(event);
};

describe("MobileSidebarEdgeSwipe", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 1,
    });
  });

  it("opens the mobile sidebar after a right swipe from the left edge", async () => {
    renderEdgeSwipe();

    dispatchPointer(document.body, "pointerdown", { clientX: 8, clientY: 120 });
    dispatchPointer(window, "pointermove", { clientX: 72, clientY: 126 });
    dispatchPointer(window, "pointerup", { clientX: 72, clientY: 126 });

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-mobile-state")).toHaveTextContent(
        "open",
      );
    });
  });

  it("ignores swipes that do not start at the left edge", () => {
    renderEdgeSwipe();

    dispatchPointer(document.body, "pointerdown", {
      clientX: 40,
      clientY: 120,
    });
    dispatchPointer(window, "pointermove", { clientX: 120, clientY: 126 });
    dispatchPointer(window, "pointerup", { clientX: 120, clientY: 126 });

    expect(screen.getByTestId("sidebar-mobile-state")).toHaveTextContent(
      "closed",
    );
  });

  it("ignores mostly vertical scroll gestures", () => {
    renderEdgeSwipe();

    dispatchPointer(document.body, "pointerdown", { clientX: 8, clientY: 120 });
    dispatchPointer(window, "pointermove", { clientX: 64, clientY: 240 });
    dispatchPointer(window, "pointerup", { clientX: 64, clientY: 240 });

    expect(screen.getByTestId("sidebar-mobile-state")).toHaveTextContent(
      "closed",
    );
  });

  it("ignores interactive targets and disabled immersive contexts", () => {
    const { rerender } = renderEdgeSwipe();
    const edgeButton = screen.getByTestId("edge-button");

    dispatchPointer(edgeButton, "pointerdown", { clientX: 8, clientY: 120 });
    dispatchPointer(window, "pointermove", { clientX: 72, clientY: 126 });
    dispatchPointer(window, "pointerup", { clientX: 72, clientY: 126 });

    expect(screen.getByTestId("sidebar-mobile-state")).toHaveTextContent(
      "closed",
    );

    rerender(
      <SidebarProvider>
        <MobileSidebarEdgeSwipe enabled={false} />
        <SidebarStateProbe />
      </SidebarProvider>,
    );

    dispatchPointer(document.body, "pointerdown", { clientX: 8, clientY: 120 });
    dispatchPointer(window, "pointermove", { clientX: 72, clientY: 126 });
    dispatchPointer(window, "pointerup", { clientX: 72, clientY: 126 });

    expect(screen.getByTestId("sidebar-mobile-state")).toHaveTextContent(
      "closed",
    );
  });
});
