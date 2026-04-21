import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachAi,
  useCoachPlanDraftGenerator,
} from "@/modules/coach/lib/hooks";
import CoachAiContainer from "../index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachAi: vi.fn(),
  useCoachPlanDraftGenerator: vi.fn(),
}));

describe("CoachAiContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders AI invocation history and generates plan drafts", async () => {
    const generatePlanDraft = vi.fn().mockResolvedValue({
      data: {
        title: "Meal draft",
        description: "Weekly plan",
        items: [{ name: "Breakfast", details: "Protein focused" }],
      },
    });
    vi.mocked(useCoachAi).mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "ai-1",
              type: "meal",
              goal: "Fat loss",
              itemCount: 6,
              latencyMs: 1200,
              createdAt: "2026-04-19T00:00:00.000Z",
            },
          ],
          meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        },
      },
      isLoading: false,
    });
    vi.mocked(useCoachPlanDraftGenerator).mockReturnValue({
      generatePlanDraft,
      isGenerating: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/ai"]}>
        <CoachAiContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("AI workspace")).toBeInTheDocument();
    expect(screen.getByText("Fat loss")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Goal"), {
      target: { value: "Muscle gain" },
    });
    fireEvent.change(screen.getByLabelText("Client context"), {
      target: { value: "Beginner client" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Draft yaratish" }));

    expect(generatePlanDraft).toHaveBeenCalledWith({
      type: "meal",
      goal: "Muscle gain",
      clientContext: "Beginner client",
    });
  });
});
