import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachClients,
  useCoachSessions,
  useCoachSessionsMutations,
} from "@/modules/coach/lib/hooks";
import { useSessionFilters } from "../list/use-filters.js";
import CoachSessionsListPage from "../list/index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachClients: vi.fn(),
  useCoachSessions: vi.fn(),
  useCoachSessionsMutations: vi.fn(),
}));

vi.mock("../list/use-filters.js", () => ({
  useSessionFilters: vi.fn(),
}));

const setPageQuery = vi.fn();

const sessionFixture = {
  id: "session-1",
  roomId: "room-1",
  title: "Jasur bilan check-in",
  date: "2026-04-22",
  durationMinutes: 60,
  selectedSlot: "10:00",
  slots: ["10:00"],
  status: "scheduled",
  note: "Progress review",
  client: { id: "client-1", name: "Jasur Karimov" },
};

describe("CoachSessionsListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders list view and queries sessions with filters", () => {
    vi.mocked(useSessionFilters).mockReturnValue({
      status: "scheduled",
      clientId: "client-1",
      dateFrom: "2026-04-20",
      dateTo: "2026-04-30",
      view: "list",
      currentPage: 1,
      pageSize: 12,
      setStatus: vi.fn(),
      setClientId: vi.fn(),
      setDateFrom: vi.fn(),
      setDateTo: vi.fn(),
      setView: vi.fn(),
      setPageQuery,
    });
    vi.mocked(useCoachSessions).mockReturnValue({
      data: {
        data: {
          data: [sessionFixture],
          meta: { total: 1, page: 1, pageSize: 12, totalPages: 1 },
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    vi.mocked(useCoachClients).mockReturnValue({
      data: {
        data: {
          data: [{ id: "client-1", name: "Jasur Karimov", roomId: "room-1" }],
        },
      },
      isLoading: false,
    });
    vi.mocked(useCoachSessionsMutations).mockReturnValue({
      createSession: vi.fn(),
      rescheduleSession: vi.fn(),
      cancelSession: vi.fn(),
      completeSession: vi.fn(),
      isMutating: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/sessions/list"]}>
        <CoachSessionsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sessiyalar")).toBeInTheDocument();
    expect(screen.getByText("Jasur bilan check-in")).toBeInTheDocument();
    expect(screen.getAllByText("Jasur Karimov")[0]).toBeInTheDocument();
    expect(useCoachSessions).toHaveBeenCalledWith({
      status: "scheduled",
      clientId: "client-1",
      dateFrom: "2026-04-20",
      dateTo: "2026-04-30",
      sortBy: "scheduledAt",
      sortDir: "asc",
      page: 1,
      pageSize: 12,
    });
  });
});
