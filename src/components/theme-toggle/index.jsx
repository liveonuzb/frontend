/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, resolveTheme } from "@/lib/user-preferences";

function useTheme() {
  const [theme, setThemeState] = React.useState(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(localStorage.getItem("theme") || "light");
  });

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  React.useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail) {
        setThemeState(resolveTheme(event.detail));
      }
    };

    window.addEventListener("app-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("app-theme-change", handleThemeChange);
    };
  }, []);

  const setTheme = React.useCallback((nextTheme) => {
    const resolvedTheme = resolveTheme(nextTheme);
    setThemeState(resolvedTheme);
    applyTheme(resolvedTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={"size-11"}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
export { useTheme };
