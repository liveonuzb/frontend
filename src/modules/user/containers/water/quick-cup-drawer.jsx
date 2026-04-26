import React from "react";
import { find } from "lodash";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { cn } from "@/lib/utils";
import { PencilIcon, PlusIcon } from "lucide-react";
import CustomCupDrawer from "./custom-cup-drawer";

const CUP_SIZES = [
  { label: "50", value: 50 },
  { label: "150", value: 150 },
  { label: "250", value: 250 },
  { label: "400", value: 400 },
  { label: "500", value: 500 },
];

export default function QuickCupDrawer({ children }) {
  const {
    goals: { cupSize, customCupSize },
    setGoal,
  } = useHealthGoals();
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Stakan hajmi</DrawerTitle>
          <DrawerDescription>
            Har safar ichadigan suvingiz miqdorini tanlang.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4 py-6">
          <div className="grid grid-cols-3 gap-3 water-cup">
            {CUP_SIZES.map((cup) => {
              const active = cupSize === cup.value;
              return (
                <button
                  key={cup.value}
                  onClick={async () => {
                    try {
                      await setGoal("cupSize", cup.value);
                      setOpen(false);
                    } catch {
                      // noop
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 aspect-square group border",
                    active
                      ? "bg-primary/10 border-primary text-primary shadow-sm scale-105"
                      : "bg-card border-transparent hover:border-border hover:bg-accent hover:scale-105 shadow-sm",
                  )}
                >
                  <div
                    className={cn(
                      "text-3xl opacity-90 group-hover:opacity-100 transition-opacity size-10",
                      `cup_${cup.value}`,
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold text-sm transition-colors tabular-nums",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {cup.label} ml
                  </span>
                </button>
              );
            })}

            {/* Custom Capacity Button inline */}
            {(() => {
              const isCustomActive = !find(CUP_SIZES, { value: cupSize });
              const displayCustomSize =
                customCupSize || (isCustomActive ? cupSize : null);
              const hasCustom = Boolean(displayCustomSize);

              return (
                <CustomCupDrawer>
                  <button
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 aspect-square shadow-sm hover:scale-105 group border",
                      hasCustom ? "border-solid" : "border-dashed",
                      isCustomActive
                        ? "bg-primary/10 border-primary text-primary scale-105"
                        : "bg-card border-border hover:border-primary hover:bg-accent",
                    )}
                    aria-label={
                      hasCustom
                        ? `Maxsus hajm: ${displayCustomSize} ml — tahrirlash`
                        : "Maxsus hajm qo'shish"
                    }
                  >
                    {hasCustom ? (
                      <>
                        <div
                          className={cn(
                            "cup_custom size-10 transition-opacity",
                            isCustomActive
                              ? "opacity-100"
                              : "opacity-90 group-hover:opacity-100",
                          )}
                        />
                        <span
                          className={cn(
                            "font-semibold text-sm transition-colors tabular-nums",
                            isCustomActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {displayCustomSize} ml
                        </span>
                        {/* Edit affordance — visible hint that the custom
                            cup is editable. */}
                        <span
                          className={cn(
                            "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full shadow-sm transition-colors",
                            isCustomActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-background/90 text-muted-foreground group-hover:text-primary",
                          )}
                          aria-hidden
                        >
                          <PencilIcon className="size-3" />
                        </span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="size-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          Maxsus
                        </span>
                      </>
                    )}
                  </button>
                </CustomCupDrawer>
              );
            })()}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
