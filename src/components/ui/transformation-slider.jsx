import React, { useState, useRef, useEffect } from "react";
import { clamp } from "lodash";
import { MoveHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TransformationSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Oldin",
  afterLabel = "Keyin",
  resultText = "-12 kg / 3 oyda",
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current || !isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const percent = clamp((x / rect.width) * 100, 0, 100);
    setPosition(percent);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    } else {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl group border-[6px] border-background shadow-2xl bg-muted"
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      {/* Before Image (Background) */}
      <img loading="lazy"
        src={beforeImage}
        alt="Transformation Before"
        className="w-full aspect-[4/5] md:aspect-square object-cover select-none pointer-events-none"
        draggable="false"
      />

      {/* Before Label */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <Badge
          variant="secondary"
          className="bg-background/80 backdrop-blur-md shadow-sm border-none font-bold"
        >
          {beforeLabel}
        </Badge>
      </div>

      {/* After Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden select-none pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <img loading="lazy"
          src={afterImage}
          alt="Transformation After"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
        {/* Filter overlay to make 'After' pop slightly more if desired */}
        <div className="absolute inset-0 bg-primary/5 pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* After Label */}
      <div
        className="absolute top-4 right-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: position < 80 ? 1 : 0 }}
      >
        <Badge className="bg-primary text-primary-foreground shadow-sm font-bold animate-in fade-in">
          {afterLabel}
        </Badge>
      </div>

      {/* Result Badge at Bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center w-full px-4">
        <div className="inline-flex bg-background/90 backdrop-blur-xl border border-border shadow-lg rounded-full px-4 py-2 font-bold text-sm tracking-tight text-foreground items-center gap-2">
          ✨ {resultText}
        </div>
      </div>

      {/* Slider Divider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center group/handle shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div
          className={`w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-xl transition-transform ${isDragging ? "scale-110 ring-4 ring-primary/30" : "group-hover/handle:scale-110"}`}
        >
          <MoveHorizontalIcon className="w-5 h-5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
