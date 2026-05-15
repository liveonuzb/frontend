export const DEFAULT_MAP_PROVIDER = "maplibre";

export const loadMapProvider = async (provider = DEFAULT_MAP_PROVIDER) => {
  if (provider !== DEFAULT_MAP_PROVIDER && provider !== "openfreemap") {
    throw new Error(`Unsupported map provider: ${provider}`);
  }

  const { loadMapLibre } = await import("@/lib/maplibre.js");
  return loadMapLibre();
};
