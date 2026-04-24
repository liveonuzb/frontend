import React from "react";

const AuthMobileKeyboardContext = React.createContext(false);

const isMobileInputTarget = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const coarsePointer =
    window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const narrowViewport =
    window.matchMedia?.("(max-width: 767px)")?.matches ?? false;

  return coarsePointer || narrowViewport;
};

const isTextInputFocused = () => {
  if (typeof document === "undefined") {
    return false;
  }

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  const tagName = activeElement.tagName;

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    activeElement.isContentEditable
  );
};

function useMobileKeyboardOpen() {
  const [isOpen, setIsOpen] = React.useState(false);
  const baselineHeightRef = React.useRef(0);
  const isOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const visualViewport = window.visualViewport;

    const setOpenState = (nextIsOpen) => {
      if (nextIsOpen !== isOpenRef.current) {
        isOpenRef.current = nextIsOpen;
        setIsOpen(nextIsOpen);
      }
    };

    const updateKeyboardState = () => {
      const focused = isTextInputFocused();
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const layoutHeight = Math.max(
        window.innerHeight,
        document.documentElement?.clientHeight ?? 0,
        viewportHeight,
      );

      if (!focused) {
        baselineHeightRef.current = layoutHeight;
      }

      const baselineHeight = Math.max(
        baselineHeightRef.current || layoutHeight,
        layoutHeight,
      );
      const heightDelta = Math.max(0, baselineHeight - viewportHeight);

      const shouldOpen = isMobileInputTarget() && focused && heightDelta > 72;
      const shouldClose = !focused || heightDelta < 36;
      const nextIsOpen = isOpenRef.current ? !shouldClose : shouldOpen;

      setOpenState(nextIsOpen);
    };

    const handleFocusIn = () => {
      if (isMobileInputTarget() && isTextInputFocused()) {
        setOpenState(true);
      }
      window.setTimeout(updateKeyboardState, 80);
    };

    const handleFocusOut = () => {
      window.setTimeout(updateKeyboardState, 120);
    };

    updateKeyboardState();

    visualViewport?.addEventListener("resize", updateKeyboardState);
    visualViewport?.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("resize", updateKeyboardState);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      visualViewport?.removeEventListener("resize", updateKeyboardState);
      visualViewport?.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("resize", updateKeyboardState);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return isOpen;
}

function AuthMobileKeyboardProvider({ value, children }) {
  return (
    <AuthMobileKeyboardContext.Provider value={value}>
      {children}
    </AuthMobileKeyboardContext.Provider>
  );
}

function useAuthMobileKeyboard() {
  return React.useContext(AuthMobileKeyboardContext);
}

function useAuthMobileAutoFocus({ enabled = true } = {}) {
  const elementRef = React.useRef(null);
  const shouldAutoFocus =
    enabled && typeof window !== "undefined" && isMobileInputTarget();

  const focusElement = React.useCallback(() => {
    const current = elementRef.current;
    const element =
      current && typeof current.focus === "function"
        ? current
        : current?.querySelector?.(
            "input, textarea, [contenteditable='true']",
          );

    if (!enabled || !isMobileInputTarget() || !element) {
      return;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
    ) {
      return;
    }

    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }

    if (
      "setSelectionRange" in element &&
      typeof element.value === "string"
    ) {
      const position = element.value.length;
      element.setSelectionRange(position, position);
    }
  }, [enabled]);

  const setAutoFocusRef = React.useCallback(
    (node) => {
      elementRef.current = node;
      if (node) {
        window.requestAnimationFrame?.(focusElement);
      }
    },
    [focusElement],
  );

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timers = [
      window.setTimeout(focusElement, 80),
      window.setTimeout(focusElement, 280),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [enabled, focusElement]);

  return { autoFocus: shouldAutoFocus, ref: setAutoFocusRef };
}

export {
  AuthMobileKeyboardProvider,
  useAuthMobileAutoFocus,
  useAuthMobileKeyboard,
  useMobileKeyboardOpen,
};
