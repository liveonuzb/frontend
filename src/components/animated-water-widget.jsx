import { clamp, round } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon, GlassWaterIcon } from "lucide-react";
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
      className={cn(
        "relative overflow-hidden p-6 group transition-all water-widget",
        onClick ? "cursor-pointer" : null,
        className,
      )}
      style={{ backgroundColor: "#202a37" }}
    >
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className={"icon size-8"} />
          <span className="font-bold text-white text-lg tracking-wide">
            Suv ichish
          </span>
        </div>
        <div className="flex items-center gap-2">
          <QuickCupDrawer>
            <button
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10 font-medium text-xs text-white"
            >
              <GlassWaterIcon className="size-4 hover:text-blue-300" />
            </button>
          </QuickCupDrawer>
          <ChevronRightIcon
            className="size-6 text-slate-300 transition-colors"
            onClick={onClick}
          />
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
          className="h-11 flex-1 rounded-full overflow-hidden relative shadow-inner"
          style={{ backgroundColor: "#2b384a" }}
        >
          <div
            className={
              "indicator size-10 absolute z-40 top-1/2 -translate-y-1/2 left-0.5"
            }
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, type: "spring", bounce: 0.2 }}
            className="absolute top-0 left-0 h-full  flex items-center overflow-hidden"
            style={{ borderRadius: "9999px" }}
          >
            {/* Water fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              className="absolute bottom-0 left-0 top-0 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-cyan-200"
            >
              {/* Wave 1 */}
              <motion.div
                animate={{ x: ["-50%", "0%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 w-[200%] opacity-40"
              >
                <svg
                  className="h-full w-full"
                  viewBox="0 0 1440 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="#ffffff"
                    d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,149.3C840,160,960,224,1080,218.7C1200,213,1320,139,1380,101.3L1440,64L1440,320L0,320Z"
                  />
                </svg>
              </motion.div>

              {/* Wave 2 */}
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute inset-0 w-[200%] opacity-30"
              >
                <svg
                  className="h-full w-full"
                  viewBox="0 0 1440 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="#ffffff"
                    d="M0,192L80,181.3C160,171,320,149,480,165.3C640,181,800,235,960,229.3C1120,224,1280,160,1360,128L1440,96L1440,320L0,320Z"
                  />
                </svg>
              </motion.div>

              <div className="absolute inset-0 bg-gradient-to-t from-cyan-700/30 to-white/20" />
            </motion.div>
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
            className="add size-14 rounded-full active:scale-95 transition-transform shadow-[0_4px_15px_rgba(106,155,244,0.4)] shrink-0 group/btn cursor-pointer"
          >
            {/*<PlusIcon className="size-6 stroke-[3] transition-transform group-active/btn:rotate-90 duration-300" />*/}
          </button>
        ) : null}
      </div>
    </Card>
  );
}
