import React from "react";
import useIsMobile from "@/hooks/utils/use-mobile";
import { useSidebar } from "@/components/ui/sidebar.jsx";

const EDGE_START_PX = 24;
const MIN_SWIPE_DISTANCE_PX = 48;
const HORIZONTAL_DOMINANCE_RATIO = 1.2;

const INTERACTIVE_TARGET_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "label",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
  "[data-slot='drawer-content']",
  "[data-vaul-drawer-direction]",
  "[data-map-interactive]",
  ".maplibregl-map",
].join(",");

const isIgnoredTarget = (target) => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(INTERACTIVE_TARGET_SELECTOR));
};

const isTouchCapable = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.("(pointer: coarse)")?.matches ||
    window.matchMedia?.("(hover: none)")?.matches
  );
};

const MobileSidebarEdgeSwipe = ({ enabled = true }) => {
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const gestureRef = React.useRef(null);

  React.useEffect(() => {
    if (!enabled || !isMobile || !isTouchCapable()) {
      gestureRef.current = null;
      return undefined;
    }

    const resetGesture = () => {
      gestureRef.current = null;
    };

    const handlePointerDown = (event) => {
      if (event.button != null && event.button !== 0) {
        return;
      }

      if (event.clientX > EDGE_START_PX || isIgnoredTarget(event.target)) {
        return;
      }

      gestureRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handlePointerMove = (event) => {
      const gesture = gestureRef.current;
      if (!gesture) {
        return;
      }

      const deltaX = event.clientX - gesture.x;
      const deltaY = event.clientY - gesture.y;
      const absDeltaY = Math.abs(deltaY);

      if (deltaX < 0 || (absDeltaY > 24 && absDeltaY > Math.abs(deltaX))) {
        resetGesture();
        return;
      }

      if (
        deltaX >= MIN_SWIPE_DISTANCE_PX &&
        deltaX > absDeltaY * HORIZONTAL_DOMINANCE_RATIO
      ) {
        setOpenMobile(true);
        resetGesture();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", resetGesture, { passive: true });
    window.addEventListener("pointercancel", resetGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", resetGesture);
      window.removeEventListener("pointercancel", resetGesture);
    };
  }, [enabled, isMobile, setOpenMobile]);

  return null;
};

export default MobileSidebarEdgeSwipe;
