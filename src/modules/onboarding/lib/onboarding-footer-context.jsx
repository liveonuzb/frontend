import React from "react";

/**
 * Context stores a REF (not state) for footer content + a subscriber list.
 * This breaks the re-render cycle: updating the ref never re-renders the
 * Provider (and therefore never re-renders containers), so there's no loop.
 * Only the <FooterSlot> component re-renders when footer content changes.
 */
const OnboardingFooterContext = React.createContext({
  contentRef: { current: null },
  setFooter: () => {},
  subscribe: () => () => {},
});

export const OnboardingFooterProvider = ({ children }) => {
  const contentRef = React.useRef(null);
  const listenersRef = React.useRef(new Set());

  // setFooter writes to the ref and notifies the FooterSlot — NO state change
  // so the Provider tree NEVER re-renders from this call.
  const setFooter = React.useCallback((content) => {
    contentRef.current = content;
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const subscribe = React.useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <OnboardingFooterContext.Provider
      value={{ contentRef, setFooter, subscribe }}
    >
      {children}
    </OnboardingFooterContext.Provider>
  );
};

/**
 * Rendered inside the layout's sticky footer.
 * This is the ONLY component that re-renders when footer content changes.
 */
export const FooterSlot = () => {
  const { contentRef, subscribe } = React.useContext(OnboardingFooterContext);
  const [, forceRender] = React.useReducer((c) => c + 1, 0);

  React.useEffect(() => {
    return subscribe(forceRender);
  }, [subscribe]);

  return contentRef.current || null;
};

/**
 * Hook for containers to push their footer content (e.g. Continue button).
 * Runs after every render so disabled/enabled state stays in sync.
 * Only FooterSlot (a sibling) re-renders — NOT the container itself.
 */
export const useOnboardingFooter = (content) => {
  const { setFooter } = React.useContext(OnboardingFooterContext);

  // Sync content to ref after every render (no loop because setFooter never
  // re-renders the provider/container, only the isolated FooterSlot)
  React.useLayoutEffect(() => {
    setFooter(content);
  });

  // Clear when container unmounts
  React.useEffect(() => {
    return () => setFooter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default OnboardingFooterContext;
