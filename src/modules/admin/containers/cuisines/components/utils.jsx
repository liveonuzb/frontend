import { get, isArray, join, trim } from "lodash";
import { z } from "zod";

export const QUERY_KEY = ["admin", "cuisines"];
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
export const SORT_FIELDS = ["orderKey", "name", "createdAt", "isActive"];
export const SORT_DIRECTIONS = ["asc", "desc"];

export const cuisineSchema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
});

export const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;

export const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

export const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};
