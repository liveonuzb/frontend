import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const authContainerFiles = [
  "src/modules/auth/containers/forgot-password/phone-form.jsx",
  "src/modules/auth/containers/otp-verify/otp-form.jsx",
  "src/modules/auth/containers/reset-password/reset-password-form.jsx",
  "src/modules/auth/containers/set-password/set-password-form.jsx",
  "src/modules/auth/containers/sign-in-password/password-form.jsx",
  "src/modules/auth/containers/sign-up/password-form.jsx",
];

describe("auth mobile layout", () => {
  it("keeps validation errors in normal document flow", () => {
    for (const filePath of authContainerFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source, filePath).not.toMatch(
        /<FieldError[\s\S]*?className=\{["'`][^"'`]*\babsolute\b/,
      );
    }
  });
});
