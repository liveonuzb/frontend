import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetQuery } from "@/hooks/api";
import AiAdminPage from ".";

const mockPostMutateAsync = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
  usePostQuery: () => ({
    mutateAsync: mockPostMutateAsync,
    isPending: false,
  }),
  usePatchQuery: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/modules/admin/lib/permissions.js", () => ({
  useAdminPermissions: () => ({
    canManageSettings: true,
  }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const queryByUrl = ({ url }) => {
  if (url === "/admin/ai/overview") {
    return {
      data: {
        data: {
          data: {
            settings: [],
            analytics: {
              totalRequests: 7,
              successRate: 85.7,
              totalTokens: 150,
              estimatedCostUsd: 0.012345,
              byFeature: [],
            },
            recentLogs: [],
            reviewQueue: [{ id: "pending-log" }],
          },
        },
      },
      isLoading: false,
    };
  }

  if (url === "/admin/ai/copilot") {
    return {
      data: {
        data: {
          data: {
            nutrition: {
              scanReviewRate: 40,
              scanStarted: 25,
              scanReviewed: 10,
            },
            operations: {
              avgLatencyMs: 1234,
              uploadErrorCount: 2,
              throttlingErrorCount: 1,
              openAiFallbackCount: 1,
            },
            recommendations: [
              {
                id: "nutrition-scan-review-gap",
                severity: "medium",
                title: "Nutrition scan review gap",
                description: "AI scan review rate past.",
                actionLabel: "Dashboardni ochish",
                actionPath: "/admin/dashboard",
              },
            ],
          },
        },
      },
      isLoading: false,
    };
  }

  return {
    data: { data: { data: [] } },
    isLoading: false,
  };
};

describe("Admin AI page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostMutateAsync.mockResolvedValue({
      data: {
        data: {
          variants: [
            {
              id: "variant-1",
              name: "Balansli 30 kun - arzon variant",
              source: "ai_variant",
              sourceTemplateId: "template-1",
              isActive: false,
            },
          ],
        },
      },
    });
  });

  it("renders copilot recommendations for nutrition scan feedback", () => {
    vi.mocked(useGetQuery).mockImplementation(queryByUrl);

    render(
      <MemoryRouter>
        <AiAdminPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("AI copilot")).toBeInTheDocument();
    expect(screen.getByText("Nutrition scan review gap")).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText("Avg latency")).toBeInTheDocument();
    expect(screen.getByText("1234 ms")).toBeInTheDocument();
    expect(screen.getByText("Upload errors")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("creates inactive admin meal template variants from the AI tab", async () => {
    vi.mocked(useGetQuery).mockImplementation(queryByUrl);

    render(
      <MemoryRouter>
        <AiAdminPage defaultTab="template-variants" />
      </MemoryRouter>,
    );

    const sourceInput = await screen.findByLabelText("Source template ID");
    fireEvent.change(sourceInput, {
      target: { value: "template-1" },
    });
    fireEvent.change(screen.getByLabelText("Budget tier"), {
      target: { value: "cheap" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Variant yaratish/i }));

    await waitFor(() => {
      expect(mockPostMutateAsync).toHaveBeenCalledWith({
        url: "/admin/ai/nutrition/template-variants",
        attributes: {
          sourceTemplateId: "template-1",
          budgetTier: "cheap",
          variantCount: 1,
        },
      });
    });
    expect(
      await screen.findByText("Balansli 30 kun - arzon variant"),
    ).toBeInTheDocument();
    expect(screen.getByText("AI variant")).toBeInTheDocument();
    expect(screen.getByText("Inactive draft")).toBeInTheDocument();
  });
});
