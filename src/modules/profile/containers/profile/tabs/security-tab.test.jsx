import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ActiveSessionsSection,
  SecurityActivitySection,
  TwoFactorSection,
} from "./security-tab.jsx";

const deleteRequest = vi.hoisted(() => vi.fn());
const refetchSessions = vi.hoisted(() => vi.fn());
const useGetQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/api", () => ({
  useGetQuery: useGetQueryMock,
  usePostQuery: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/api/use-api", () => ({
  default: () => ({
    request: {
      delete: deleteRequest,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  useProfileOverlay: () => ({
    activeProfileDrawer: null,
    closeProfileDrawer: vi.fn(),
    openProfileDrawer: vi.fn(),
  }),
}));

const t = (key) => key;

describe("ActiveSessionsSection", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses localized session copy for current-device logout semantics", () => {
    useGetQueryMock.mockReturnValue({
      data: {
        data: {
          currentSessionId: "session-current",
          sessions: [
            {
              id: "session-current",
              ipAddress: "127.0.0.1",
              userAgent: "Mozilla/5.0 iPhone",
              lastSeenAt: "2026-05-19T10:00:00.000Z",
            },
            {
              id: "session-other",
              ipAddress: "10.0.0.2",
              userAgent: "Mozilla/5.0 Mac",
              lastSeenAt: "2026-05-18T10:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
      refetch: refetchSessions,
    });

    render(
      <ActiveSessionsSection
        handleLogout={vi.fn()}
        isLoggingOut={false}
        t={t}
      />,
    );

    expect(
      screen.getByText("profile.security.session.currentDevice"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile.security.session.device.mobile"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile.security.session.device.desktop"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "profile.security.session.revoke",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "profile.security.session.button",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bu qurilma")).not.toBeInTheDocument();
    expect(screen.queryByText("Chiqish")).not.toBeInTheDocument();
    expect(screen.queryByText("Mobil qurilma")).not.toBeInTheDocument();
  });
});

describe("SecurityActivitySection", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses localized activity labels and empty copy", () => {
    useGetQueryMock.mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "activity-1",
              type: "login_success",
              ipAddress: "127.0.0.1",
              userAgent: "Mozilla/5.0",
              createdAt: "2026-05-19T10:00:00.000Z",
            },
            {
              id: "activity-2",
              type: "password_reset",
              createdAt: "2026-05-19T09:00:00.000Z",
            },
            {
              id: "activity-3",
              type: "session_revoked",
              createdAt: "2026-05-19T08:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
    });

    render(<SecurityActivitySection t={t} />);

    expect(
      screen.getByText("profile.security.activity.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile.security.activity.type.login_success"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile.security.activity.type.password_reset"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile.security.activity.type.session_revoked"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Muvaffaqiyatli kirish")).not.toBeInTheDocument();
    expect(screen.queryByText("Parol tiklandi")).not.toBeInTheDocument();
  });

  it("uses localized security activity empty state", () => {
    useGetQueryMock.mockReturnValue({
      data: {
        data: {
          items: [],
        },
      },
      isLoading: false,
    });

    render(<SecurityActivitySection t={t} />);

    expect(
      screen.getByText("profile.security.activity.empty"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Faoliyat tarixi yo'q")).not.toBeInTheDocument();
  });
});

describe("TwoFactorSection", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses localized 2FA copy for disabled state", () => {
    useGetQueryMock.mockReturnValue({
      data: {
        data: {
          enabled: false,
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<TwoFactorSection t={t} />);

    expect(screen.getByText("profile.security.2fa.totpTitle")).toBeInTheDocument();
    expect(screen.getByText("profile.security.2fa.totpDesc")).toBeInTheDocument();
    expect(screen.getByText("profile.security.2fa.disabled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "profile.security.2fa.enable" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Ikki bosqichli tasdiqlash (TOTP)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("2FA yoqish")).not.toBeInTheDocument();
  });

  it("uses localized 2FA copy for enabled actions", () => {
    useGetQueryMock.mockReturnValue({
      data: {
        data: {
          enabled: true,
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<TwoFactorSection t={t} />);

    expect(screen.getByText("profile.security.2fa.enabled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "profile.security.2fa.disable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /profile.security.2fa.backupCodes/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Zaxira kodlar")).not.toBeInTheDocument();
  });
});
