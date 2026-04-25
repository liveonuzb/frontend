export const clearOldClientStorage = () => {
  const STORAGE_VERSION = "v1";

  const currentVersion = localStorage.getItem("storage_version");

  if (currentVersion !== STORAGE_VERSION) {
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem("storage_version", STORAGE_VERSION);

    window.location.reload();
  }
};
