import React, { useRef, useEffect } from "react";
import { findIndex } from "lodash";
import { cn } from "@/lib/utils";

export const ScrollPicker = ({ items, value, onChange, itemHeight = 60 }) => {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const handleScroll = () => {
    if (!containerRef.current) return;

    clearTimeout(scrollTimeoutRef.current);
    isScrollingRef.current = true;

    // Calculate the centered item
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);

    if (items[index] && items[index].value !== value) {
      onChange(items[index].value);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  useEffect(() => {
    if (!containerRef.current || isScrollingRef.current) return;
    const index = findIndex(items, (item) => item.value === value);
    if (index >= 0) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [value, items, itemHeight]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: itemHeight * 5,
        maskImage:
          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
      }}
    >
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{
          paddingTop: itemHeight * 2,
          paddingBottom: itemHeight * 2,
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE and Edge
        }}
      >
        {/* Hide scrollbar for Chrome, Safari, and Opera */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          div::-webkit-scrollbar {
            display: none;
          }
        `,
          }}
        />
        {items.map((item) => {
          const isSelected = item.value === value;
          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                isSelected
                  ? "text-[40px] font-black text-foreground"
                  : "text-3xl font-bold text-muted-foreground/30",
              )}
              style={{ height: itemHeight }}
              onClick={() => {
                if (!isScrollingRef.current && containerRef.current) {
                  const index = findIndex(items, (i) => i.value === item.value);
                  containerRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: "smooth",
                  });
                  onChange(item.value);
                }
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
