/**
 * Chart color utilities for Recharts integration.
 * Reads --chart-1 through --chart-5 CSS custom properties from :root
 * and returns them as usable color strings.
 */

// Static fallback colors (oklch values converted to approximate hex)
export const CHART_COLORS = [
  "#e9b949", // --chart-1: oklch(0.88 0.15 92)
  "#d4893a", // --chart-2: oklch(0.77 0.16 70)
  "#b86e2c", // --chart-3: oklch(0.67 0.16 58)
  "#9a5624", // --chart-4: oklch(0.56 0.15 49)
  "#7d4520", // --chart-5: oklch(0.47 0.12 46)
]

/**
 * Reads --chart-1 through --chart-5 from the document root computed styles.
 * Returns an array of color strings usable by Recharts.
 * Falls back to CHART_COLORS if running outside a browser or properties are missing.
 */
export function getChartColors() {
  if (typeof document === "undefined") return CHART_COLORS

  const styles = getComputedStyle(document.documentElement)
  const colors = []

  for (let i = 1; i <= 5; i++) {
    const value = styles.getPropertyValue(`--chart-${i}`).trim()
    if (value) {
      colors.push(value)
    }
  }

  return colors.length === 5 ? colors : CHART_COLORS
}
