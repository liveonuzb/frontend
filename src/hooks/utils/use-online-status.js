import { useState, useEffect } from "react";

const useOnlineStatus = () => {
  const getOnlineStatus = () =>
    typeof navigator === "undefined" ? true : navigator.onLine;

  const [isOnline, setIsOnline] = useState(getOnlineStatus);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;
