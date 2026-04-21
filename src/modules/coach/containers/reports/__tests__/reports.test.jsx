import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachClients,
  useCoachReportGenerator,
  useCoachReports,
} from "@/modules/coach/lib/hooks";
import ReportsContainer from "../index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachClients: vi.fn(),
  useCoachReports: vi.fn(),
  useCoachReportGenerator: vi.fn(),
}));

describe("ReportsContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders generated report history and queries history endpoint filters", () => {
    vi.mocked(useCoachReports).mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "report-1",
              type: "client_progress_pdf",
              entityId: "client-1",
              entityLabel: "Jasur Karimov",
              metadata: { period: "weekly" },
              createdAt: "2026-04-19T00:00:00.000Z",
            },
          ],
          meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    vi.mocked(useCoachClients).mockReturnValue({
      data: { data: { data: [{ id: "client-1", name: "Jasur Karimov" }] } },
    });
    vi.mocked(useCoachReportGenerator).mockReturnValue({
      generateReport: vi.fn(),
      isGenerating: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/reports"]}>
        <ReportsContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("Reportlar")).toBeInTheDocument();
    expect(screen.getAllByText("Client progress PDF")[0]).toBeInTheDocument();
    expect(screen.getByText(/Jasur Karimov/)).toBeInTheDocument();
    expect(useCoachReports).toHaveBeenCalledWith({
      sortBy: "createdAt",
      sortDir: "desc",
      page: 1,
      pageSize: 10,
    });
  });
});
