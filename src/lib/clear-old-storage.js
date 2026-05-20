export const clearOldClientStorage = () => {
  const STORAGE_VERSION = "v2";
  const OBSOLETE_STORE_KEYS = [
    "journal-storage",
    "workout-storage",
    "recipes-storage",
    "order-storage",
    "wearable-storage",
    "gallery-storage",
    "tour-storage",
  ];

  for (const key of OBSOLETE_STORE_KEYS) {
    localStorage.removeItem(key);
  }

  localStorage.removeItem("auth-storage");

  const currentVersion = localStorage.getItem("storage_version");

  if (currentVersion !== STORAGE_VERSION) {
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem("storage_version", STORAGE_VERSION);

    window.location.reload();
  }
};
