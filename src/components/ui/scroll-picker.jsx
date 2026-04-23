import React, { useRef, useEffect } from "react";
import { findIndex } from "lodash";
import { cn } from "@/lib/utils";

export const ScrollPicker = ({
  items,
  value,
  onChange,
  itemHeight = 60,
  itemWidth = 72,
  orientation = "vertical",
  selectedClassName,
  unselectedClassName,
}) => {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isHorizontal = orientation === "horizontal";

  const handleScroll = () => {
    if (!containerRef.current) return;

    clearTimeout(scrollTimeoutRef.current);
    isScrollingRef.current = true;

    const scrollOffset = isHorizontal
      ? containerRef.current.scrollLeft
      : containerRef.current.scrollTop;
    const itemSize = isHorizontal ? itemWidth : itemHeight;
    const index = Math.round(scrollOffset / itemSize);

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
      const nextOffset = index * (isHorizontal ? itemWidth : itemHeight);
      if (isHorizontal) {
        containerRef.current.scrollLeft = nextOffset;
      } else {
        containerRef.current.scrollTop = nextOffset;
      }
    }
  }, [value, items, itemHeight, itemWidth, isHorizontal]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: isHorizontal ? itemHeight : itemHeight * 5,
        maskImage: isHorizontal
          ? "linear-gradient(to right, transparent, black 12%, black 88%, transparent)"
          : "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage: isHorizontal
          ? "linear-gradient(to right, transparent, black 12%, black 88%, transparent)"
          : "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
      }}
    >
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full snap-mandatory",
          isHorizontal
            ? "flex overflow-x-auto overflow-y-hidden snap-x items-center"
            : "overflow-y-auto snap-y",
        )}
        onScroll={handleScroll}
        style={{
          paddingTop: isHorizontal ? 0 : itemHeight * 2,
          paddingBottom: isHorizontal ? 0 : itemHeight * 2,
          paddingLeft: isHorizontal ? itemWidth * 2 : 0,
          paddingRight: isHorizontal ? itemWidth * 2 : 0,
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
                  ? selectedClassName || "text-3xl font-black text-foreground"
                  : unselectedClassName ||
                      "text-2xl font-bold text-muted-foreground/30",
              )}
              style={
                isHorizontal
                  ? { width: itemWidth, height: itemHeight, flexShrink: 0 }
                  : { height: itemHeight }
              }
              onClick={() => {
                if (!isScrollingRef.current && containerRef.current) {
                  const index = findIndex(items, (i) => i.value === item.value);
                  containerRef.current.scrollTo(
                    isHorizontal
                      ? {
                          left: index * itemWidth,
                          behavior: "smooth",
                        }
                      : {
                          top: index * itemHeight,
                          behavior: "smooth",
                        },
                  );
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
