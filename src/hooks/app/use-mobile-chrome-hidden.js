import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";

export const useMobileChromeHidden = () => {
  const location = useLocation();
  const [mobileChromeHidden, setMobileChromeHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const mobileChromeHiddenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncChromeVisibility = () => {
      const currentScrollY = window.scrollY;
      const isDesktop = window.innerWidth >= 768;
      const delta = currentScrollY - lastScrollYRef.current;

      if (isDesktop || currentScrollY <= 24) {
        if (mobileChromeHiddenRef.current) {
          mobileChromeHiddenRef.current = false;
          setMobileChromeHidden(false);
        }
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (Math.abs(delta) < 8) {
        return;
      }

      const nextHidden = delta > 0;
      if (nextHidden !== mobileChromeHiddenRef.current) {
        mobileChromeHiddenRef.current = nextHidden;
        setMobileChromeHidden(nextHidden);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", syncChromeVisibility, { passive: true });
    window.addEventListener("resize", syncChromeVisibility);

    return () => {
      window.removeEventListener("scroll", syncChromeVisibility);
      window.removeEventListener("resize", syncChromeVisibility);
    };
  }, []);

  useEffect(() => {
    mobileChromeHiddenRef.current = false;
    setMobileChromeHidden(false);
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY;
    }
  }, [location.pathname]);

  return mobileChromeHidden;
};
