export const loadMapProvider = async (provider = "yandex") => {
  if (provider !== "yandex") {
    throw new Error(`Unsupported map provider: ${provider}`);
  }

  const { loadYMaps } = await import("@/lib/ymaps.js");
  return loadYMaps();
};
