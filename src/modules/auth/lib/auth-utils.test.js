import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, getOtpToastDescription } from "./auth-utils.js";

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
});

describe("getOtpToastDescription", () => {
  it("formats dev OTP codes through the translation function", () => {
    const t = (key, params) => `${key}:${params.code}`;

    expect(getOtpToastDescription({ otpCode: "123456" }, t)).toBe(
      "auth.devOtpCode:123456",
    );
  });
});
