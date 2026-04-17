import React from "react";
import { filter, get, size } from "lodash";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store";
import useMeasurements from "@/hooks/app/use-measurements";
import { ScaleIcon, RulerIcon } from "lucide-react";
import { useQueryState, parseAsStringEnum } from "nuqs";
import PageTransition from "@/components/page-transition";
import { WeightTab } from "./weight-tab";
import { MeasurementsTab } from "./measurements-tab";
import MeasurementTrendsSection from "./measurement-trends-section";
import { TrackingPageLayout } from "@/components/tracking-page-shell";

const measurementKeys = ["chest", "waist", "hips", "arm", "thigh", "neck"];

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    history,
    deleteMeasurement,
    saveMeasurement,
    getLatest,
    getChange,
    isLoading,
  } = useMeasurements();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum(["weight", "measurements"]).withDefault("weight"),
  );
  const latest = getLatest();
  const totalEntries = size(history);
  const trackedMeasurements = filter(
    measurementKeys,
    (key) => Number(get(latest, key)) > 0,
  ).length;
  const latestWeight = get(latest, "weight", 0);
  const latestDate = get(latest, "date", null);
  const activeTabMeta =
    activeTab === "weight"
      ? {
          title: "Vazn nazorati",
          description: "Vazn tarixi, BMI va maqsadga yaqinlashuv shu yerda.",
        }
      : {
          title: "Tana o'lchamlari",
          description:
            "Ko'krak, bel, qo'l va boshqa o'lchamlarni muntazam kuzating.",
        };

  const handleTabChange = (val) => {
    setActiveTab(val);
  };

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/measurements", title: "Tana o'lchamlari" },
    ]);
  }, [setBreadcrumbs]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TrackingPageLayout
            aside={
              <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Tracking
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">
                    {activeTabMeta.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTabMeta.description}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Vazn",
                      value: latestWeight > 0 ? `${latestWeight} kg` : "—",
                      hint: "oxirgi yozuv",
                    },
                    {
                      label: "O'lcham",
                      value: trackedMeasurements,
                      hint: "faol metrika",
                    },
                    {
                      label: "Yozuvlar",
                      value: totalEntries,
                      hint: "jami yozuv",
                    },
                    {
                      label: "Yangilandi",
                      value: latestDate || "—",
                      hint: "oxirgi sana",
                    },
                  ].map(({ label, value, hint }) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-border/60 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </p>
                      {isLoading ? (
                        <Skeleton className="mt-2 h-7 w-16 rounded-lg" />
                      ) : (
                        <p className="mt-2 text-xl font-black">{value}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hint}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="weight">
                      <ScaleIcon className="size-3.5" />
                      Vazn
                    </TabsTrigger>
                    <TabsTrigger value="measurements">
                      <RulerIcon className="size-3.5" />
                      O'lchamlar
                    </TabsTrigger>
                  </TabsList>
                </div>
              </section>
            }
          >
            <TabsContent value="weight" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-[28px]" />
                  <Skeleton className="h-24 w-full rounded-[28px]" />
                  <Skeleton className="h-24 w-full rounded-[28px]" />
                </div>
              ) : (
                <WeightTab
                  history={history}
                  saveMeasurement={saveMeasurement}
                  deleteMeasurement={deleteMeasurement}
                  getLatest={getLatest}
                  getChange={getChange}
                />
              )}
            </TabsContent>

            <TabsContent value="measurements" className="mt-0">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-[28px]" />
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-[22px]" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <MeasurementsTab
                    history={history}
                    saveMeasurement={saveMeasurement}
                    deleteMeasurement={deleteMeasurement}
                    getLatest={getLatest}
                    getChange={getChange}
                  />
                )}
                <MeasurementTrendsSection />
              </div>
            </TabsContent>
          </TrackingPageLayout>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Index;
