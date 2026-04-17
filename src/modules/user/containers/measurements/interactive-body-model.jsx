import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "@/components/reui/number-field";
import { Card } from "@/components/ui/card";
import { get, map } from "lodash";
import useMe from "@/hooks/app/use-me";

const MeasurementInput = ({ label, value, onChange, editing, unit, side }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 relative z-30",
        side === "left" ? "items-start" : "items-end",
        {
          "max-w-[100px]": !editing,
          "w-[120px]": editing,
        },
      )}
    >
      <span
        className={cn(
          "text-[9px] font-black uppercase tracking-widest px-1",
          value || editing ? "text-primary" : "text-muted-foreground/60",
        )}
      >
        {label}
      </span>
      {editing ? (
        <NumberField
          value={value !== "" ? Number(value) : undefined}
          onValueChange={(val) =>
            onChange(val !== undefined ? String(val) : "")
          }
          step={0.1}
          formatOptions={{ signDisplay: "never", maximumFractionDigits: 1 }}
          className={cn(
            "w-full transition-all duration-300",
            side === "left" ? "origin-left" : "origin-right",
          )}
        >
          <NumberFieldGroup className="border border-border/80 bg-background/90 backdrop-blur-md rounded-2xl p-0 flex items-center justify-between w-full h-10 px-1 shadow-lg ring-1 ring-primary/20 focus-within:ring-primary/60 transition-all">
            <NumberFieldDecrement className="size-8 rounded-xl bg-muted/50 hover:bg-muted shadow-none flex-shrink-0 [&_svg]:size-3" />
            <NumberFieldInput
              placeholder="0.0"
              className="w-full text-sm font-black text-center outline-none h-auto rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-0"
            />
            <NumberFieldIncrement className="size-8 rounded-xl bg-muted/50 hover:bg-muted shadow-none flex-shrink-0 [&_svg]:size-3" />
          </NumberFieldGroup>
        </NumberField>
      ) : (
        <div
          className={cn(
            "flex flex-col justify-center px-4 py-2 rounded-2xl border transition-all duration-500 backdrop-blur-xl w-full",
            value
              ? "bg-card/90 dark:bg-card/60 shadow-lg border-primary/20"
              : "bg-background/40 border-border/30 shadow-sm",
          )}
        >
          <div
            className={cn(
              "flex items-baseline gap-1.5",
              side === "left" ? "justify-start" : "justify-end",
            )}
          >
            <span
              className={cn(
                "text-lg font-black tracking-tighter leading-none",
                value ? "text-foreground" : "text-muted-foreground/30",
              )}
            >
              {value || "0.0"}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold",
                value ? "text-muted-foreground" : "text-muted-foreground/30",
              )}
            >
              {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const InteractiveBodyModel = ({
  values,
  onChange,
  editing,
  onEdit,
  measurementTypes,
  genderOverride,
  hideActionButton = false,
}) => {
  const { onboarding } = useMe();
  const queryGender = get(onboarding, "gender");
  const resolvedGender = genderOverride ?? queryGender;
  const gender =
    resolvedGender === "male" || resolvedGender === "erkak" ? "male" : "female";

  // Precise anatomical mapping over the 420x550 container
  // "left" percentage puts the dot on the X axis.
  // "side" tells us which edge the input card snaps to.
  const pointsMapBase = {
    male: {
      neck: { top: "31%", left: "50%", side: "right" },
      chest: { top: "36%", left: "50%", side: "left" },
      arm: { top: "43%", left: "62%", side: "right" },
      waist: { top: "48%", left: "50%", side: "left" },
      hips: { top: "58%", left: "56%", side: "right" },
      thigh: { top: "62%", left: "55%", side: "left" },
    },
    female: {
      neck: { top: "31%", left: "50%", side: "right" },
      chest: { top: "36%", left: "50%", side: "left" },
      arm: { top: "43%", left: "62%", side: "right" },
      waist: { top: "48%", left: "50%", side: "left" },
      hips: { top: "58%", left: "56%", side: "right" },
      thigh: { top: "62%", left: "55%", side: "left" },
    },
  };
  const pointsMap = get(pointsMapBase, gender);

  return (
    <Card className="py-6 relative items-center h-full bg-gradient-to-b from-muted/20 to-transparent overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="w-full max-w-[420px] h-full flex-grow min-h-[550px] mx-auto">
        {/* Tech Grid Background */}

        {/* Glowing Silhouette */}
        <div className="absolute inset-x-0 bottom-20 h-[85%] flex items-end justify-center z-10 pointer-events-none">
          {/* SVG Aura */}
          <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full" />

          {gender === "female" ? (
            <img
              src="/woman.png"
              alt="Female Model"
              className="h-[95%] w-auto drop-shadow-xl opacity-90 transition-all duration-1000 object-contain"
            />
          ) : (
            <img
              src="/man.png"
              alt="Male Model"
              className="h-[95%] w-auto drop-shadow-xl opacity-90 transition-all duration-1000 object-contain"
            />
          )}
        </div>

        {/* Points & Lines & Inputs */}
        <div className="absolute inset-0 z-20 pointer-events-none p-4">
          {map(measurementTypes, (m, i) => {
            const mId = get(m, "id");
            const pos = get(pointsMap, mId);
            if (!pos) return null;

            const mValue = get(values, mId);
            const isFilled = mValue && mValue !== "";

            return (
              <motion.div
                key={mId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Pulsating Anatomical Dot */}
                <div
                  className={cn(
                    "absolute size-2.5 rounded-full z-30 transition-colors duration-500",
                    isFilled || editing
                      ? "bg-primary shadow-[0_0_12px_var(--theme-primary)]"
                      : "bg-muted-foreground/30",
                  )}
                  style={{
                    top: get(pos, "top"),
                    left: get(pos, "left"),
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {(isFilled || editing) && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40"></div>
                  )}
                </div>

                {/* Connecting Line (Left Side) */}
                {get(pos, "side") === "left" && (
                  <div
                    className={cn(
                      "absolute border-t z-20 transition-all duration-700",
                      isFilled || editing
                        ? "border-solid border-primary/40"
                        : "border-dashed border-muted-foreground/20",
                    )}
                    style={{
                      top: get(pos, "top"),
                      left: "110px", // Box width + padding
                      width: `calc(${get(pos, "left")} - 110px)`,
                    }}
                  />
                )}

                {/* Connecting Line (Right Side) */}
                {get(pos, "side") === "right" && (
                  <div
                    className={cn(
                      "absolute border-t z-20 transition-all duration-700",
                      isFilled || editing
                        ? "border-solid border-primary/40"
                        : "border-dashed border-muted-foreground/20",
                    )}
                    style={{
                      top: get(pos, "top"),
                      left: get(pos, "left"),
                      width: `calc(100% - ${get(pos, "left")} - 110px)`,
                    }}
                  />
                )}

                {/* Aligned Input Card */}
                <div
                  className={cn(
                    "absolute pointer-events-auto",
                    get(pos, "side") === "left" ? "left-4" : "right-4",
                  )}
                  style={{
                    top: get(pos, "top"),
                    transform: "translateY(-50%)",
                  }}
                >
                  <MeasurementInput
                    label={get(m, "label")}
                    value={mValue || ""}
                    onChange={(val) => onChange(mId, val)}
                    editing={editing}
                    unit={get(m, "unit")}
                    side={get(pos, "side")}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button Over Image */}
      </div>
      {!hideActionButton ? (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-40 bg-gradient-to-t from-background/80 to-transparent pt-10 pb-4">
          {editing ? (
            <button
              type="submit"
              className="text-[11px] flex items-center justify-center font-black uppercase tracking-[0.2em] bg-foreground hover:bg-foreground/90 text-background px-12 py-3.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-border"
            >
              Saqlash
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onEdit?.();
              }}
              className="text-[11px] flex items-center justify-center font-black uppercase tracking-[0.2em] bg-background hover:bg-muted px-12 py-3.5 rounded-full border border-border/80 text-foreground shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
            >
              Yangilash
            </button>
          )}
        </div>
      ) : null}
    </Card>
  );
};
