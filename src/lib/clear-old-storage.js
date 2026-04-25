import dayjs from "dayjs";

export const clearOldClientStorage = () => {
  const STORAGE_VERSION = dayjs().format("YYYY-MM-DD HH:mm");

  const currentVersion = localStorage.getItem("storage_version");

  if (currentVersion !== STORAGE_VERSION) {
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem("storage_version", STORAGE_VERSION);

    window.location.reload();
  }
};
