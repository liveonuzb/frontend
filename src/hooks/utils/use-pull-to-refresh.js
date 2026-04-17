import React from "react";

const THRESHOLD = 80;
const MAX_PULL = 120;

const usePullToRefresh = (onRefresh) => {
    const [pulling, setPulling] = React.useState(false);
    const [pullDistance, setPullDistance] = React.useState(0);
    const [refreshing, setRefreshing] = React.useState(false);
    const startY = React.useRef(0);
    const currentY = React.useRef(0);

    const canPull = React.useCallback(() => {
        return window.scrollY <= 0;
    }, []);

    const handleTouchStart = React.useCallback(
        (e) => {
            if (!canPull()) return;
            startY.current = e.touches[0].clientY;
            setPulling(true);
        },
        [canPull]
    );

    const handleTouchMove = React.useCallback(
        (e) => {
            if (!pulling || refreshing) return;
            currentY.current = e.touches[0].clientY;
            const diff = currentY.current - startY.current;
            if (diff > 0 && canPull()) {
                const distance = Math.min(diff * 0.5, MAX_PULL);
                setPullDistance(distance);
            }
        },
        [pulling, refreshing, canPull]
    );

    const handleTouchEnd = React.useCallback(() => {
        if (pullDistance >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            setPullDistance(THRESHOLD);
            Promise.resolve(onRefresh?.()).finally(() => {
                setRefreshing(false);
                setPullDistance(0);
                setPulling(false);
            });
        } else {
            setPullDistance(0);
            setPulling(false);
        }
    }, [pullDistance, refreshing, onRefresh]);

    React.useEffect(() => {
        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const progress = Math.min((pullDistance / THRESHOLD) * 100, 100);

    return { pulling, pullDistance, refreshing, progress };
};

export default usePullToRefresh;
