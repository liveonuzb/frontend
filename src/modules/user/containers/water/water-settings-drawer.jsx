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
import { Card, CardContent } from "@/components/ui/card";
import {
  SettingsIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  Link2Icon,
} from "lucide-react";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";
import useUserTelegram from "@/hooks/app/use-user-telegram";
import { cn } from "@/lib/utils";
import find from "lodash/find";
import map from "lodash/map";

import DailyGoalDrawer from "./daily-goal-drawer";
import CustomCupDrawer from "./custom-cup-drawer";
import TimeDrawer from "./time-drawer";
import IntervalDrawer from "./interval-drawer";

const CUP_SIZES = [
  { label: "50 ml", value: 50 },
  { label: "150 ml", value: 150 },
  { label: "250 ml", value: 250 },
  { label: "400 ml", value: 400 },
  { label: "500 ml", value: 500 },
];

const openTelegramLink = (url) => {
  if (!url) return;

  const tg = window.Telegram?.WebApp;
  if (typeof tg?.openTelegramLink === "function") {
    tg.openTelegramLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};

export default function WaterSettingsDrawer() {
  const { user } = useMe();
  const { createConnectLink, isCreatingConnectLink } = useUserTelegram();
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

  const isPredefinedCup = Boolean(find(CUP_SIZES, { value: cupSize }));
  const telegramConnected = Boolean(user?.telegramConnected);
  const handleConnectTelegram = React.useCallback(async () => {
    const payload = await createConnectLink();
    openTelegramLink(payload?.deepLink || payload?.botUrl);
  }, [createConnectLink]);

  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 rounded-full size-10"
        >
          <SettingsIcon className="size-5 text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Sozlamalar</DrawerTitle>
          <DrawerDescription className="text-center">
            Suv ichish sozlamalarini moslang
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-6 py-4">
          {/* Notification Settings Group */}
          <section className="flex flex-col gap-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground">
              Bildirishnomalar
            </h3>

            <Card>
              <CardContent className="flex flex-col p-0">
                {/* Main Toggle */}
                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="font-medium text-foreground">
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
                  <div className="flex flex-col border-t border-border/60">
                    {!telegramConnected ? (
                      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Link2Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Telegram bot</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Eslatmalarni olish uchun @liveonappbot ni ulang.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0"
                          disabled={isCreatingConnectLink}
                          onClick={handleConnectTelegram}
                        >
                          Telegramni ulash
                        </Button>
                      </div>
                    ) : null}
                    <TimeDrawer
                      label="Boshlanish vaqti"
                      goalKey="waterNotifStart"
                    >
                      <div className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/30">
                        <span className="font-medium text-foreground/90">
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

                    <div className="ml-4 h-px bg-border/60" />
                    <TimeDrawer label="Tugash vaqti" goalKey="waterNotifEnd">
                      <div className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/30">
                        <span className="font-medium text-foreground/90">
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

                    <div className="ml-4 h-px bg-border/60" />
                    <IntervalDrawer>
                      <div className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/30">
                        <span className="font-medium text-foreground/90">
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
              </CardContent>
            </Card>
          </section>

          {/* Widget & Goal Settings Group */}
          <section className="flex flex-col gap-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground">
              Asosiy sozlamalar
            </h3>
            <Card>
              <CardContent className="p-0">
                <DailyGoalDrawer>
                  <div className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/30">
                    <span className="font-medium text-foreground">
                      Kunlik maqsad
                    </span>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="font-medium">{waterMl} ml</span>
                      <ChevronRightIcon className="size-4 opacity-70" />
                    </div>
                  </div>
                </DailyGoalDrawer>
              </CardContent>
            </Card>
          </section>

          {/* Cup Settings Group */}
          <section className="flex flex-col gap-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground">
              Stakan hajmi
            </h3>
            <div className="grid grid-cols-3 gap-3 water-cup">
              {map(CUP_SIZES, (cup) => {
                const active = cupSize === cup.value;
                return (
                  <button
                    type="button"
                    key={cup.value}
                    aria-label={cup.label}
                    onClick={() => {
                      void setGoal("cupSize", cup.value);
                    }}
                    className={cn(
                      "group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <div className={cn("size-10", `cup_${cup.value}`)} />
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums transition-colors",
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
                  type="button"
                  className={cn(
                    "group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-4 transition-colors",
                    !isPredefinedCup
                      ? "border-solid border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary hover:bg-accent",
                  )}
                  aria-label={
                    !isPredefinedCup
                      ? `Maxsus hajm: ${cupSize} ml - tahrirlash`
                      : customCupSize
                        ? `Maxsus hajm: ${customCupSize} ml - tahrirlash`
                        : "Maxsus hajm qo'shish"
                  }
                >
                  {!isPredefinedCup ? (
                    <>
                      <div className="cup_custom size-10" />
                      <span className="text-sm font-medium text-primary tabular-nums transition-colors">
                        {cupSize} ml
                      </span>
                      <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <PencilIcon className="size-3" />
                      </span>
                    </>
                  ) : customCupSize ? (
                    <>
                      <div className="cup_custom size-10" />
                      <span className="text-sm font-medium text-muted-foreground tabular-nums transition-colors group-hover:text-primary">
                        {customCupSize} ml
                      </span>
                      <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground group-hover:text-primary">
                        <PencilIcon className="size-3" />
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="size-8 text-muted-foreground transition-colors group-hover:text-primary" />
                      <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                        Maxsus
                      </span>
                    </>
                  )}
                </button>
              </CustomCupDrawer>
            </div>
          </section>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
