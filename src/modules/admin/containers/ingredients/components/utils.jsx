/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { get, isArray, join, trim, filter, find, toNumber } from "lodash";
import { z } from "zod";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

export const QUERY_KEY = ["admin", "ingredients"];
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
  "calories",
  "pricePer100g",
  "budgetTier",
  "priceUpdatedAt",
  "createdAt",
  "isActive",
  "isOnboarding",
  "isAllergic",
];
export const SORT_DIRECTIONS = ["asc", "desc"];
export const SERVING_UNITS = [
  { value: "g", label: "Gram" },
  { value: "ml", label: "mL" },
  { value: "dona", label: "Dona" },
  { value: "qoshiq", label: "Qoshiq" },
];
export const PRICE_UNITS = [
  { value: "kg", label: "Kilogram" },
  { value: "100g", label: "100 gramm" },
  { value: "g", label: "Gramm" },
  { value: "litr", label: "Litr" },
  { value: "ml", label: "Millilitr" },
  { value: "dona", label: "Dona" },
];
export const BUDGET_TIERS = [
  { value: "auto", label: "Auto" },
  { value: "cheap", label: "Arzon" },
  { value: "medium", label: "O'rtacha" },
  { value: "expensive", label: "Qimmat" },
];
export const PRICE_SEASONS = [
  { value: "all", label: "Yil davomida" },
  { value: "spring", label: "Bahor" },
  { value: "summer", label: "Yoz" },
  { value: "autumn", label: "Kuz" },
  { value: "winter", label: "Qish" },
];
export const PRICE_REGIONS = [
  { value: "uzbekistan", label: "O'zbekiston" },
  { value: "tashkent", label: "Toshkent" },
  { value: "samarqand", label: "Samarqand" },
  { value: "buxoro", label: "Buxoro" },
  { value: "fargona", label: "Farg'ona" },
  { value: "andijon", label: "Andijon" },
  { value: "namangan", label: "Namangan" },
  { value: "qashqadaryo", label: "Qashqadaryo" },
  { value: "surxondaryo", label: "Surxondaryo" },
  { value: "xorazm", label: "Xorazm" },
  { value: "navoiy", label: "Navoiy" },
  { value: "jizzax", label: "Jizzax" },
  { value: "sirdaryo", label: "Sirdaryo" },
  { value: "qoraqalpogiston", label: "Qoraqalpog'iston" },
];

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  servingUnit: z.enum(["g", "ml", "dona", "qoshiq"]),
  dietaryTags: z.array(z.string()).default([]),
  allergenTags: z.array(z.string()).default([]),
  isAllergic: z.boolean().default(false),
  isOnboarding: z.boolean().default(true),
});

export const priceSchema = z.object({
  priceAmount: z.number().min(0, "Narx 0 dan kichik bo'lmasin"),
  priceUnit: z.enum(["kg", "100g", "g", "litr", "ml", "dona"]),
  currency: z.string().trim().min(1, "Valyuta kiriting").max(8),
  budgetTier: z.enum(["auto", "cheap", "medium", "expensive"]),
});

export const regionalPriceSchema = priceSchema.extend({
  regionKey: z.string().trim().min(1, "Region tanlang").max(64),
  regionName: z.string().trim().min(1, "Region nomi kerak").max(120),
  season: z.enum(["all", "spring", "summer", "autumn", "winter"]),
});

export const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;

export const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

export const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  const dependencySummary = get(error, "response.data.dependencySummary");
  const baseMessage = isArray(message) ? join(message, ", ") : message;

  return filter([baseMessage || fallback, dependencySummary], Boolean).join(" ");
};

export const formatMoney = (value, currency = "UZS") =>
  value === null || value === undefined
    ? "-"
    : `${toNumber(value).toLocaleString("uz-UZ", {
        maximumFractionDigits: 2,
      })} ${currency || "UZS"}`;

export const budgetTierLabel = (value) =>
  get(
    find(BUDGET_TIERS, (item) => item.value === value),
    "label",
    "-",
  );

export const budgetTierClassName = (value) =>
  ({
    cheap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    expensive: "border-rose-200 bg-rose-50 text-rose-700",
  })[value] || "";

export const NumberInput = ({ value, onChange, step = 1 }) => (
  <NumberField
    value={value ?? 0}
    onValueChange={(next) => onChange(next ?? 0)}
    minValue={0}
    step={step}
  >
    <NumberFieldGroup className="h-10 rounded-xl bg-background w-full">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput className="px-3 text-sm flex-1" />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);
