export const PASSWORD_POLICY_MIN_LENGTH = 8;

export const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= PASSWORD_POLICY_MIN_LENGTH &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

export const applyStrongPasswordPolicy = (schema, t) =>
  schema
    .min(PASSWORD_POLICY_MIN_LENGTH, t("auth.validation.passwordMin"))
    .refine(isStrongPassword, {
      message: t("auth.validation.passwordComplexity"),
    });
