import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SettingsIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { cn } from "@/lib/utils";
import { some } from "lodash";

import DailyGoalDrawer from "./daily-goal-drawer";
import CustomCupDrawer from "./custom-cup-drawer";
import TimeDrawer from "./time-drawer";
import IntervalDrawer from "./interval-drawer";

const CUP_SIZES = [
  { label: "50 ml", value: 50, icon: "☕" },
  { label: "100 ml", value: 100, icon: "🥛" },
  { label: "200 ml", value: 200, icon: "🫗" },
  { label: "300 ml", value: 300, icon: "🍼" },
  { label: "500 ml", value: 500, icon: "🥤" },
];

export default function WaterSettingsDrawer() {
  const {
    goals: {
      waterNotification,
      waterNotifStart,
      waterNotifEnd,
      waterNotifInterval,
      waterMl,
      cupSize,
      customCupSize,
    },
    setGoal,
  } = useHealthGoals();

  const isPredefinedCup = some(CUP_SIZES, { value: cupSize });

  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 rounded-full h-10 w-10"
        >
          <SettingsIcon className="size-5 text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="outline-none">
        <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
          <DrawerTitle className="text-foreground text-xl font-bold text-center">
            Sozlamalar
          </DrawerTitle>
          <DrawerDescription className="text-center">
            Suv ichish sozlamalarini moslang
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-8 py-6">
          {/* Notification Settings Group */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              Bildirishnomalar
            </span>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {/* Main Toggle */}
              <div className="flex items-center justify-between p-4 bg-background/40">
                <span className="font-semibold text-foreground">
                  Suv eslatmalari
                </span>
                <Switch
                  checked={waterNotification}
                  onCheckedChange={(v) => {
                    void setGoal("waterNotification", v);
                  }}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Inner Settings (collapsible) */}
              {waterNotification && (
                <div className="flex flex-col bg-background/40">
                  <div className="h-[1px] bg-border/50 ml-4" />
                  <TimeDrawer
                    label="Boshlanish vaqti"
                    goalKey="waterNotifStart"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                      <span className="text-foreground/90 font-medium">
                        Boshlanish
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">
                          {waterNotifStart || "08:00"}
                        </span>
                        <ChevronRightIcon className="size-4 opacity-50" />
                      </div>
                    </div>
                  </TimeDrawer>

                  <div className="h-[1px] bg-border/50 ml-4" />
                  <TimeDrawer label="Tugash vaqti" goalKey="waterNotifEnd">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                      <span className="text-foreground/90 font-medium">
                        Tugash
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">
                          {waterNotifEnd || "22:00"}
                        </span>
                        <ChevronRightIcon className="size-4 opacity-50" />
                      </div>
                    </div>
                  </TimeDrawer>

                  <div className="h-[1px] bg-border/50 ml-4" />
                  <IntervalDrawer>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                      <span className="text-foreground/90 font-medium">
                        Interval
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">
                          {waterNotifInterval === "30 min"
                            ? "30 daq"
                            : waterNotifInterval === "1 hour"
                              ? "1 soat"
                              : waterNotifInterval === "1.5 hours"
                                ? "1.5 soat"
                                : waterNotifInterval === "2 hours"
                                  ? "2 soat"
                                  : waterNotifInterval === "3 hours"
                                    ? "3 soat"
                                    : waterNotifInterval}
                        </span>
                        <ChevronRightIcon className="size-4 opacity-50" />
                      </div>
                    </div>
                  </IntervalDrawer>
                </div>
              )}
            </div>
          </div>

          {/* Widget & Goal Settings Group */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              Asosiy sozlamalar
            </span>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:bg-background/40">
              <DailyGoalDrawer>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors bg-background/40">
                  <span className="text-foreground font-semibold">
                    Kunlik maqsad
                  </span>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="font-bold">{waterMl} ml</span>
                    <ChevronRightIcon className="size-4 opacity-70" />
                  </div>
                </div>
              </DailyGoalDrawer>
            </div>
          </div>

          {/* Cup Settings Group */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              Stakan hajmi
            </span>
            <div className="grid grid-cols-3 gap-3">
              {CUP_SIZES.map((cup) => {
                const active = cupSize === cup.value;
                return (
                  <button
                    key={cup.value}
                    onClick={() => {
                      void setGoal("cupSize", cup.value);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 aspect-square group border",
                      active
                        ? "bg-primary/10 border-primary text-primary shadow-sm scale-105"
                        : "bg-card border-transparent hover:border-border hover:bg-accent hover:scale-105 shadow-sm",
                    )}
                  >
                    <div className="text-3xl opacity-90 group-hover:opacity-100 transition-opacity">
                      {cup.icon}
                    </div>
                    <span
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {cup.label}
                    </span>
                  </button>
                );
              })}

              {/* Custom Capacity Button */}
              <CustomCupDrawer>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 aspect-square shadow-sm hover:scale-105 group border border-dashed",
                    !isPredefinedCup
                      ? "bg-primary/10 border-primary text-primary shadow-sm scale-105 border-solid"
                      : "bg-card hover:bg-accent hover:border-primary border-border",
                  )}
                >
                  {!isPredefinedCup ? (
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
                      <div className="text-3xl opacity-90 group-hover:opacity-100 transition-opacity">
                        💧
                      </div>
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
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
