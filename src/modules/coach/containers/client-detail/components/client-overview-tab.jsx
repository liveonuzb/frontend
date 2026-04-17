import React from "react";
import { get, map } from "lodash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CalorieGaugeWidget from "@/modules/user/containers/dashboard/calorie-gauge-widget.jsx";
import MealsWidget from "@/modules/user/containers/dashboard/meals-widget.jsx";
import WaterWidget from "@/modules/user/containers/dashboard/water-widget.jsx";
import MoodWidget from "@/modules/user/containers/dashboard/mood-widget.jsx";
import WeightWidget from "@/modules/user/containers/dashboard/weight-widget.jsx";
import BmiWidget from "@/modules/user/containers/dashboard/bmi-widget.jsx";
import WorkoutWidget from "@/modules/user/containers/dashboard/workout-widget.jsx";
import {
  BanknoteIcon,
  CalendarPlusIcon,
} from "lucide-react";

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
};

const formatNumber = (value, suffix = "") => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toLocaleString("en-US")}${suffix}`;
};

const formatLongDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const statusLabel = (status) => {
  if (status === "active") return "Faol";
  if (status === "paused") return "Pauza";
  return "Faolsiz";
};

const SummaryMetricCard = ({ icon: Icon, label, value, hint, isLoading }) => (
  <Card className="py-6">
    <CardContent className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        )}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="rounded-full border p-3">
        <Icon className="size-5" />
      </div>
    </CardContent>
  </Card>
);

const EmptyCardState = ({ children }) => (
  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const ClientOverviewTab = ({
  client,
  isLoading,
  selectedLog,
  selectedDateKey,
  selectedDayData,
  selectedMeasurement,
  measurements,
  goals,
  paymentSummary,
  onOpenPricing,
  onOpenPayment,
  onOpenPaymentDay,
  onOpenPlans,
  onRemove,
}) => {
  return (
    <div className="space-y-6">
      <Card className="py-6">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="size-16 rounded-full" />
              ) : (
                <Avatar className="size-16 border">
                  <AvatarImage src={get(client, "avatar")} alt={get(client, "name")} />
                  <AvatarFallback>{getInitials(get(client, "name"))}</AvatarFallback>
                </Avatar>
              )}
              <div className="space-y-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-52" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-36" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {get(client, "name")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {get(client, "email") || get(client, "phone") || "Kontakt yo'q"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {statusLabel(get(client, "status"))}
                      </Badge>
                      <Badge variant="secondary">
                        {get(client, "goal") || "Maqsad yo'q"}
                      </Badge>
                      <Badge variant="secondary">
                        Progress {get(client, "progress", 0)}%
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isLoading && client ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={onOpenPricing}>
                  Narx
                </Button>
                <Button variant="outline" onClick={onOpenPayment}>
                  To&apos;lov
                </Button>
                <Button variant="outline" onClick={onOpenPaymentDay}>
                  To&apos;lov kuni
                </Button>
                <Button variant="outline" onClick={onOpenPlans}>
                  Rejalar
                </Button>
                <Button type="button" variant="destructive" onClick={onRemove}>
                  Ro&apos;yxatdan chiqarish
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryMetricCard
          icon={BanknoteIcon}
          label="To'lov holati"
          value={get(paymentSummary, "label", "Belgilanmagan")}
          hint={
            get(paymentSummary, "agreedAmount")
              ? `${formatNumber(get(paymentSummary, "agreedAmount"), " so'm")}`
              : "Kelishilgan summa yo'q"
          }
          isLoading={isLoading}
        />
        <SummaryMetricCard
          icon={CalendarPlusIcon}
          label="To'lov kuni"
          value={
            get(paymentSummary, "dayOfMonth")
              ? `${get(paymentSummary, "dayOfMonth")}-kun`
              : "—"
          }
          hint={
            get(paymentSummary, "lastPaidAt")
              ? `Oxirgi to'lov ${formatLongDate(get(paymentSummary, "lastPaidAt"))}`
              : "To'lov qayd etilmagan"
          }
          isLoading={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {map(Array.from({ length: 7 }), (_, index) => (
            <Skeleton
              key={`coach-dashboard-widget-skeleton-${index}`}
              className={`h-72 w-full rounded-3xl ${
                index === 1 ? "xl:col-span-2" : ""
              }`}
            />
          ))}
        </div>
      ) : selectedLog ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1fr_1.7fr_1fr]">
            <div className="xl:min-h-[320px]">
              <CalorieGaugeWidget
                totalCalories={get(selectedLog, "calories", 0)}
                goals={get({ v: goals }, "v", {})}
                macros={{
                  protein: {
                    current: get(selectedLog, "macros.protein", 0),
                    target: get(goals, "protein", 0),
                  },
                  carbs: {
                    current: get(selectedLog, "macros.carbs", 0),
                    target: get(goals, "carbs", 0),
                  },
                  fat: {
                    current: get(selectedLog, "macros.fat", 0),
                    target: get(goals, "fat", 0),
                  },
                }}
              />
            </div>

            <div className="xl:min-h-[320px]">
              <MealsWidget
                dayData={selectedDayData}
                goals={goals || {}}
                onOpen={onOpenPlans}
                showQuickAdd={false}
              />
            </div>

            <div className="grid gap-6">
              <WaterWidget
                waterConsumedMl={get(selectedLog, "waterMl", 0)}
                waterGoalMl={get(goals, "waterMl", 2500)}
                cupSize={get(goals, "cupSize", 250)}
                dateKey={selectedDateKey}
                interactive={false}
                hideAdd
              />
              <MoodWidget
                selectedMood={get(selectedLog, "mood")}
                onSelectMood={() => {}}
                readOnly
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.25fr]">
            <BmiWidget
              currentWeightValue={
                get(selectedMeasurement, "weight", get(client, "currentWeight", 0))
              }
              heightCmValue={get(client, "heightCm", 0)}
              interactive={false}
            />
            <WeightWidget
              currentWeightValue={
                get(selectedMeasurement, "weight", get(client, "currentWeight", 0))
              }
              targetWeightValue={get(client, "targetWeight", 0)}
              history={measurements}
              interactive={false}
            />
            <div className="h-full">
              <WorkoutWidget />
            </div>
          </div>
        </>
      ) : (
        <EmptyCardState>Tanlangan sana uchun daily log topilmadi.</EmptyCardState>
      )}
    </div>
  );
};

export default ClientOverviewTab;
