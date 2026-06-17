import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const recipesDirectory = dirname(fileURLToPath(import.meta.url));

const collectRuntimeFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      return collectRuntimeFiles(filePath);
    }

    if (!/\.(js|jsx)$/.test(entry)) {
      return [];
    }

    if (entry.includes(".test.") || entry === "recipe-mock-data.js") {
      return [];
    }

    return [filePath];
  });

describe("nutrition recipe runtime contract", () => {
  it.each(collectRuntimeFiles(recipesDirectory))(
    "does not import test-only recipe mock data from %s",
    (filePath) => {
      const source = readFileSync(filePath, "utf8");
      const displayPath = relative(recipesDirectory, filePath);

      expect(source, displayPath).not.toContain("recipe-mock-data");
      expect(source, displayPath).not.toContain("MOCK_RECIPES");
    },
  );
});
