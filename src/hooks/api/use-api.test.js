import { describe, expect, it } from "vitest";
import { shouldSkipAuthRetry } from "./use-api.js";

describe("use-api auth retry guard", () => {
  it("lets OTP verification 401 errors stay on the OTP form", () => {
    expect(shouldSkipAuthRetry("/auth/verify-otp")).toBe(true);
    expect(shouldSkipAuthRetry("/api/v1/auth/verify-otp")).toBe(true);
  });

  it("lets OTP resend 401 errors stay in the OTP flow", () => {
    expect(shouldSkipAuthRetry("/auth/resend-otp")).toBe(true);
  });

  it("still retries protected API 401 errors", () => {
    expect(shouldSkipAuthRetry("/user/onboarding/status")).toBe(false);
  });
});
