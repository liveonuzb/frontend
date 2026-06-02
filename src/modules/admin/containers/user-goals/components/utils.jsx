import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import trim from "lodash/trim";
import filter from "lodash/filter";
import { z } from "zod";

export const QUERY_KEY = ["admin", "user-goals"];
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
  "goalType",
  "calculationMode",
  "createdAt",
  "isActive",
];
export const SORT_DIRECTIONS = ["asc", "desc"];

export const STATUS_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "inactive", label: "Nofaol" },
];

export const CALCULATION_MODE_OPTIONS = [
  { value: "lose", label: "Vazn yo'qotish" },
  { value: "maintain", label: "Saqlash" },
  { value: "gain", label: "Vazn olish" },
];

export const GOAL_TYPE_OPTIONS = [
  { value: "weight", label: "Vazn bo'yicha" },
  { value: "other", label: "Boshqa" },
];

export const userGoalSchema = z
  .object({
    name: z.string().trim().min(1, "Nom kiriting"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    goalType: z.enum(["weight", "other"]),
    calculationMode: z.enum(["lose", "maintain", "gain"]).optional(),
    key: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.goalType === "weight" && !values.calculationMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["calculationMode"],
        message: "Hisoblash rejimini tanlang",
      });
    }
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

  return filter([baseMessage || fallback, dependencySummary], Boolean).join(" ");
};
