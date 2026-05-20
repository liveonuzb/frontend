import { describe, expect, it } from "vitest";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getOtpToastDescription,
  getPostAuthRoute,
} from "./auth-utils.js";

describe("getAuthErrorMessage", () => {
  it("reads nested backend error messages", () => {
    expect(
      getAuthErrorMessage(
        {
          response: {
            data: {
              error: {
                statusCode: 401,
                message: "Invalid credentials.",
              },
            },
          },
        },
        "Login failed.",
      ),
    ).toBe("Invalid credentials.");
  });

  it("keeps support for top-level API messages", () => {
    expect(
      getAuthErrorMessage(
        {
          response: {
            data: {
              message: ["Phone is required.", "Password is required."],
            },
          },
        },
        "Login failed.",
      ),
    ).toBe("Phone is required., Password is required.");
  });

  it("prefers localized validation details from backend errors", () => {
    expect(
      getAuthErrorMessage(
        {
          response: {
            data: {
              error: {
                statusCode: 400,
                message: "Validation failed",
                details: [{ message: "Telefon formati noto'g'ri." }],
              },
            },
          },
        },
        "Login failed.",
      ),
    ).toBe("Telefon formati noto'g'ri.");
  });

  it("returns the fallback when no usable message exists", () => {
    expect(getAuthErrorMessage({}, "Login failed.")).toBe("Login failed.");
  });

  it("hides sensitive backend implementation errors behind the fallback", () => {
    expect(
      getAuthErrorMessage(
        {
          response: {
            data: {
              error: {
                statusCode: 500,
                message:
                  "Invalid `this.prisma.user.findMany()` invocation: The table public.User does not exist",
              },
            },
          },
        },
        "Login failed.",
      ),
    ).toBe("Login failed.");
  });
});

describe("getOtpToastDescription", () => {
  it("formats dev OTP codes through the translation function", () => {
    const t = (key, params) => `${key}:${params.code}`;

    expect(getOtpToastDescription({ otpCode: "123456" }, t)).toBe(
      "auth.devOtpCode:123456",
    );
  });
});

describe("getAuthResponseData", () => {
  it("unwraps standard API response wrappers", () => {
    expect(
      getAuthResponseData({
        data: {
          data: {
            flow: "login",
          },
        },
      }),
    ).toEqual({ flow: "login" });
  });

  it("unwraps login/register token responses from the standard envelope", () => {
    const body = {
      accessToken: "token",
      user: { id: "user-1", roles: ["USER"] },
    };

    expect(
      getAuthResponseData({
        data: {
          data: body,
        },
      }),
    ).toEqual(body);
  });

  it("unwraps refresh token responses from the standard envelope", () => {
    expect(
      getAuthResponseData({
        data: {
          data: {
            accessToken: "new-token",
          },
        },
      }),
    ).toEqual({ accessToken: "new-token" });
  });

  it("unwraps OTP resend debug responses from the standard envelope", () => {
    expect(
      getAuthResponseData({
        data: {
          data: {
            message: "OTP sent.",
            otpCode: "123456",
          },
        },
      }),
    ).toEqual({ message: "OTP sent.", otpCode: "123456" });
  });

  it("unwraps password-reset OTP responses from the standard envelope", () => {
    expect(
      getAuthResponseData({
        data: {
          data: {
            message: "OTP verified.",
            resetToken: "reset-token",
          },
        },
      }),
    ).toEqual({ message: "OTP verified.", resetToken: "reset-token" });
  });

  it("does not accept legacy raw auth response bodies", () => {
    expect(
      getAuthResponseData({
        data: {
          accessToken: "legacy-token",
        },
      }),
    ).toBeUndefined();
  });
});

describe("getPostAuthRoute", () => {
  const activatedUser = {
    onboardingCompleted: true,
    onboardingFlowStatus: "ACTIVATED",
  };

  it("redirects only SUPER_ADMIN users to the admin panel", () => {
    expect(
      getPostAuthRoute({
        ...activatedUser,
        roles: ["SUPER_ADMIN"],
      }),
    ).toBe("/admin/dashboard");
  });

  it.each([
    "ADMIN",
    "MODERATOR",
    "NUTRITION_MANAGER",
    "WORKOUT_MANAGER",
    "SUPPORT",
  ])("keeps %s out of the admin panel redirect", (role) => {
    expect(
      getPostAuthRoute({
        ...activatedUser,
        roles: [role],
      }),
    ).toBe("/user");
  });
});
