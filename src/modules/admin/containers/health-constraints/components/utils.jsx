import { get, isArray, join, trim } from "lodash";
import { z } from "zod";

export const QUERY_KEY = ["admin", "health-constraints"];
export const ITEMS_PER_PAGE = 10;
export const TEXT_OPERATORS = [
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is",
  "empty",
  "not_empty",
];
export const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
export const SORT_FIELDS = [
  "orderKey",
  "name",
  "type",
  "genderScope",
  "createdAt",
  "isActive",
  "isOnboarding",
];
export const SORT_DIRECTIONS = ["asc", "desc"];

export const TYPE_OPTIONS = [
  { value: "injury", label: "Jarohat" },
  { value: "medical_condition", label: "Kasallik" },
  { value: "mobility_limitation", label: "Harakat cheklovi" },
  { value: "preference", label: "Boshqa" },
];

export const GENDER_SCOPE_OPTIONS = [
  { value: "all", label: "Hamma" },
  { value: "male", label: "Erkak" },
  { value: "female", label: "Ayol" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "inactive", label: "Nofaol" },
];

export const ONBOARDING_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "yes", label: "Ko'rsatiladi" },
  { value: "no", label: "Yashirilgan" },
];

export const healthConstraintSchema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
  description: z.string().optional(),
  key: z.string().optional(),
  type: z.enum([
    "injury",
    "medical_condition",
    "mobility_limitation",
    "preference",
  ]),
  genderScope: z.enum(["all", "male", "female"]),
  isOnboarding: z.boolean().default(true),
});

export const translateSchema = z.object({}).catchall(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
);

export const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback ||
  "";

export const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

export const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  const dependencySummary = get(error, "response.data.dependencySummary");
  const baseMessage = isArray(message) ? join(message, ", ") : message;

  return [baseMessage || fallback, dependencySummary].filter(Boolean).join(" ");
};

export const optionLabel = (options, value) =>
  get(
    options.find((option) => option.value === value),
    "label",
    value || "-",
  );
