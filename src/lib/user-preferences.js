const THEME_VALUES = new Set(["light", "dark"]);
const FONT_SIZE_VALUES = new Set(["small", "medium", "large"]);

export const resolveTheme = (theme) => {
  if (THEME_VALUES.has(theme)) return theme;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("theme");
    if (THEME_VALUES.has(stored)) return stored;
  }
  return "light";
};

export const resolveFontSize = (fontSize) => {
  if (FONT_SIZE_VALUES.has(fontSize)) return fontSize;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("fontSize");
    if (FONT_SIZE_VALUES.has(stored)) return stored;
  }
  return "medium";
};

export const applyTheme = (theme) => {
  if (typeof window === "undefined") {
    return;
  }

  const resolvedTheme = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  window.localStorage.setItem("theme", resolvedTheme);
  window.dispatchEvent(
    new CustomEvent("app-theme-change", {
      detail: resolvedTheme,
    }),
  );
};

export const applyFontSize = (fontSize) => {
  if (typeof window === "undefined") {
    return;
  }

  const resolvedFontSize = resolveFontSize(fontSize);
  document.documentElement.dataset.fontSize = resolvedFontSize;
  window.localStorage.setItem("fontSize", resolvedFontSize);
  window.dispatchEvent(
    new CustomEvent("app-font-size-change", {
      detail: resolvedFontSize,
    }),
  );
};

export const applyUserPreferences = (settings = {}) => {
  // applyTheme(settings.theme); // Removed to decouple from backend
  if (settings.fontSize) {
    applyFontSize(settings.fontSize);
  }
};
