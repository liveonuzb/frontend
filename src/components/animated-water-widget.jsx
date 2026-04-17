import { clamp, round } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon, PlusIcon, GlassWaterIcon } from "lucide-react";
import QuickCupDrawer from "@/modules/user/containers/water/quick-cup-drawer";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card.jsx";

export default function AnimatedWaterWidget({
  currentMl,
  maxMl,
  onAdd,
  onClick,
  className,
  hideAdd = false,
}) {
  const pct = clamp(round((currentMl / maxMl) * 100), 0, 100);
  const displayCurrent = currentMl;
  const displayMax = maxMl;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-6 group transition-all",
        onClick ? "cursor-pointer" : null,
        className,
      )}
      style={{ backgroundColor: "#202a37" }}
    >
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none overflow-hidden rounded-r-[2rem]">
        <div className="absolute right-[-20%] top-[-20%] w-[150%] h-[150%] opacity-20">
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full fill-blue-400"
          >
            <path
              d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96,-18,94.9,-3.1C93.8,11.8,86,26,76.5,38.5C67,51,55.8,61.8,42.8,70.1C29.8,78.4,14.9,84.1,0.2,83.7C-14.5,83.3,-29,76.8,-42.1,68.4C-55.2,60,-66.9,49.7,-75.4,36.9C-83.9,24.1,-89.2,8.8,-88.7,-6.2C-88.2,-21.2,-81.9,-35.9,-72.3,-47.5C-62.7,-59.1,-49.8,-67.6,-36.3,-75C-22.8,-82.4,-11.4,-88.7,2.1,-92.3C15.6,-95.9,30.5,-83.6,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-5 h-6 rounded-[4px] border border-white/20 overflow-hidden bg-white/5">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "70%" }}
              className="absolute bottom-0 left-0 right-0 bg-blue-400"
            />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">
            Suv ichish
          </span>
        </div>
        <div className="flex items-center gap-2">
          <QuickCupDrawer>
            <button
              onClick={(e) => e.stopPropagation()}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10 font-medium text-xs text-white"
            >
              <GlassWaterIcon className="size-4 hover:text-blue-300" />
            </button>
          </QuickCupDrawer>
          <ChevronRightIcon className="size-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>

      {/* Amount */}
      <div className="mb-6 flex items-baseline gap-2 relative z-10 pointer-events-none">
        <span className="text-[2.2rem] font-black text-white leading-none tracking-tight">
          {displayCurrent}
        </span>
        <span className="text-slate-400 font-medium text-sm">
          / {displayMax} ml
        </span>
      </div>

      {/* Progress Bar & Button */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Bar */}
        <div
          className="h-12 flex-1 rounded-full overflow-hidden relative shadow-inner"
          style={{ backgroundColor: "#2b384a" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, type: "spring", bounce: 0.2 }}
            className="absolute top-0 left-0 h-full bg-[#6a9bf4] relative flex items-center overflow-hidden"
            style={{ borderRadius: "9999px" }}
          >
            {/* Wavy animated highlights using SVG paths */}
            <motion.div
              animate={{ x: ["-50%", "0%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 w-[200%] opacity-20"
            >
              <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 1440 320"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#ffffff"
                  fillOpacity="1"
                  d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,165.3C960,181,1056,203,1152,192C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
            </motion.div>
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              className="absolute inset-0 w-[200%] opacity-20 -scale-y-100"
            >
              <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 1440 320"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#ffffff"
                  fillOpacity="1"
                  d="M0,192L60,186.7C120,181,240,171,360,181.3C480,192,600,224,720,224C840,224,960,192,1080,186.7C1200,181,1320,203,1380,213.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                ></path>
              </svg>
            </motion.div>

            {/* Curved wave cutoff edge at the front to match the image */}
            <div
              className="absolute right-0 top-0 bottom-0 w-8 shadow-[inset_-10px_0_15px_rgba(255,255,255,0.2)]"
              style={{ borderRadius: "50%" }}
            ></div>
          </motion.div>
        </div>

        {/* Add Button */}
        {!hideAdd ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                typeof window !== "undefined" &&
                window.navigator &&
                window.navigator.vibrate
              ) {
                window.navigator.vibrate(50);
              }
              onAdd?.();
            }}
            className="size-12 rounded-full bg-[#6a9bf4] text-white flex justify-center items-center hover:bg-[#83aef7] active:scale-95 transition-transform shadow-[0_4px_15px_rgba(106,155,244,0.4)] shrink-0 group/btn"
          >
            <PlusIcon className="size-6 stroke-[3] transition-transform group-active/btn:rotate-90 duration-300" />
          </button>
        ) : null}
      </div>
    </Card>
  );
}
