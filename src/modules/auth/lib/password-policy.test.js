import { describe, expect, it } from "vitest";
import { isStrongPassword } from "./password-policy.js";

describe("auth password policy", () => {
  it.each(["password1!", "Password!", "Password1", "Pass1!", "password"])(
    "rejects weak password %s",
    (password) => {
      expect(isStrongPassword(password)).toBe(false);
    },
  );

  it("accepts password matching backend policy", () => {
    expect(isStrongPassword("Password123!")).toBe(true);
  });
});
