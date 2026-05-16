import { config } from "@/config.js";

let cache = null;

export const loadMapLibre = async () => {
  if (cache) {
    return cache;
  }

  const [{ default: maplibregl }] = await Promise.all([
    import("maplibre-gl"),
    import("maplibre-gl/dist/maplibre-gl.css"),
  ]);

  cache = {
    type: "maplibre",
    maplibregl,
    styleUrl: config.mapStyleUrl,
    styleUrls: config.mapStyleUrls,
  };

  return cache;
};
