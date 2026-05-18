import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

import { forEach, fromPairs, isArray, toPairs, filter, map, sortBy } from "lodash";

const onboardingRoot = path.join(process.cwd(), "src/modules/onboarding");
const localesRoot = path.join(onboardingRoot, "lib/locales");
const localeNames = ["uz", "en", "ru"];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const flattenKeys = (value, prefix = "") => {
  if (!value || typeof value !== "object" || isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return toPairs(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

const listSourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "locales" ? [] : listSourceFiles(entryPath);
    }

    if (!/\.(js|jsx)$/.test(entry.name) || /\.(test|spec)\.(js|jsx)$/.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });

const extractStaticI18nKeys = () => {
  const keys = new Set();
  const literalCallPattern = /\bt\(\s*(["'`])([^"'`$]+)\1/g;

  forEach(listSourceFiles(onboardingRoot), (filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    let match = literalCallPattern.exec(source);

    while (match) {
      const key = match[2];

      if (key.startsWith("onboarding.")) {
        keys.add(key);
      }

      match = literalCallPattern.exec(source);
    }
  });

  return sortBy(Array.from(keys));
};

describe("onboarding i18n", () => {
  const locales = fromPairs(map(localeNames, (locale) => [
    locale,
    readJson(path.join(localesRoot, `${locale}.json`)),
  ]));

  it("keeps uz, en, and ru locale key sets in sync", () => {
    const [baseLocale, ...otherLocales] = localeNames;
    const baseKeys = sortBy(flattenKeys(locales[baseLocale]));

    forEach(otherLocales, (locale) => {
      expect(sortBy(flattenKeys(locales[locale]))).toEqual(baseKeys);
    });
  });

  it("defines every static onboarding translation key used by source files", () => {
    const sourceKeys = extractStaticI18nKeys();

    forEach(localeNames, (locale) => {
      const localeKeys = new Set(flattenKeys(locales[locale]));
      const missing = filter(sourceKeys, (key) => !localeKeys.has(key));

      expect(missing, `${locale} missing onboarding i18n keys`).toEqual([]);
    });
  });

  it("does not leave report navigation labels untranslated in uz or ru", () => {
    expect(locales.uz.onboarding.report.progressTracker).toEqual({
      overview: "Umumiy ko'rinish",
      targets: "Maqsadlar",
      nutrition: "Ovqatlanish",
      workout: "Mashg'ulot",
      actionPlan: "Harakat rejasi",
    });

    expect(locales.ru.onboarding.report.progressTracker).toEqual({
      overview: "Обзор",
      targets: "Цели",
      nutrition: "Питание",
      workout: "Тренировки",
      actionPlan: "План действий",
    });
  });
});
