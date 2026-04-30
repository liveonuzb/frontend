import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChallengeInvitationsSection from "./challenge-invitations-section.jsx";
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
import useReminderTrigger from "./use-reminder-trigger.js";

const mutateAsync = vi.fn();
const invalidateQueries = vi.fn();
const navigate = vi.fn();

vi.mock("@/hooks/api/use-get-query", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/api/use-post-query", () => ({
  default: vi.fn(),
}));

vi.mock("./use-reminder-trigger.js", () => ({
  default: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) => selector({ user: { id: "user-1" } }),
}));

vi.mock("@/modules/user/lib/gamification-query-keys", () => ({
  invalidateGamificationQueries: vi.fn(() => Promise.resolve()),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerContent: ({ children, ...props }) => <section {...props}>{children}</section>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

const invitation = {
  id: "inv-1",
  message: "Join me",
  inviter: {
    name: "Ali Vali",
    avatarUrl: null,
  },
  challenge: {
    id: "challenge-1",
    title: "Step challenge",
    startDate: "2026-04-29T00:00:00.000Z",
    endDate: "2026-05-06T00:00:00.000Z",
    metricType: "STEPS",
    metricTarget: 10000,
    rewardXp: 100,
    maxParticipants: 10,
    _count: { participants: 2 },
  },
};

const storageKey =
  "challenge-invitations-reminder:last-dismissed-at:user-1:inv-1";

const lastReminderArgs = () =>
  vi.mocked(useReminderTrigger).mock.calls.at(-1)?.[0] || {};

const mockPendingInvitation = () => {
  vi.mocked(useGetQuery).mockReturnValue({
    data: { data: [invitation] },
  });
};

describe("ChallengeInvitationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockPendingInvitation();
    vi.mocked(usePostQuery).mockImplementation(({ mutationProps } = {}) => ({
      mutateAsync: async (variables) => {
        mutateAsync(variables);
        await mutationProps?.onSuccess?.({}, variables);
      },
    }));
  });

  it("responds to invitations with POST action payload", async () => {
    render(<ChallengeInvitationsSection />);

    fireEvent.click(screen.getByRole("button", { name: /Challenge takliflari/i }));
    fireEvent.click(screen.getByRole("button", { name: /Qabul qilish/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        url: "/challenges/invitations/inv-1/respond",
        attributes: { action: "ACCEPT" },
      });
    });
    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("snoozes pending invitations for one hour", async () => {
    window.localStorage.setItem(storageKey, String(Date.now()));

    render(<ChallengeInvitationsSection />);

    await waitFor(() => {
      expect(lastReminderArgs().enabled).toBe(false);
    });
  });

  it("enables reminder again after the hourly snooze expires", async () => {
    window.localStorage.setItem(
      storageKey,
      String(Date.now() - 60 * 60 * 1000 - 1000),
    );

    render(<ChallengeInvitationsSection />);

    await waitFor(() => {
      expect(lastReminderArgs().enabled).toBe(true);
    });
  });
});
