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
import { PlusIcon } from "lucide-react";
import CustomCupDrawer from "./custom-cup-drawer";

const CUP_SIZES = [
  { label: "50", value: 50 },
  { label: "100", value: 150 },
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
            <CustomCupDrawer>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 aspect-square shadow-sm hover:scale-105 group border border-dashed",
                  !find(CUP_SIZES, { value: cupSize })
                    ? "bg-primary/10 border-primary text-primary shadow-sm scale-105 border-solid"
                    : "bg-card hover:bg-accent hover:border-primary border-border",
                )}
              >
                {!find(CUP_SIZES, { value: cupSize }) ? (
                  <>
                    <div className="text-3xl opacity-90 group-hover:opacity-100 transition-opacity">
                      💧
                    </div>
                    <span className="font-semibold text-sm text-primary transition-colors">
                      {cupSize} ml
                    </span>
                  </>
                ) : customCupSize ? (
                  <>
                    <div className={`cup_custom size-10`} />
                    <span className="font-semibold text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      {customCupSize} ml
                    </span>
                  </>
                ) : (
                  <PlusIcon className="size-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform" />
                )}
              </button>
            </CustomCupDrawer>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
