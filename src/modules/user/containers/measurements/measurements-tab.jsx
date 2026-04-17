import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilIcon, RulerIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { get, reduce, map, entries, max } from "lodash";
import { InteractiveBodyModel } from "./interactive-body-model";

export const measurementTypes = [
  { id: "chest", label: "Ko'krak", emoji: "👔", unit: "cm" },
  { id: "waist", label: "Bel", emoji: "📏", unit: "cm" },
  { id: "hips", label: "Tos", emoji: "🦵", unit: "cm" },
  { id: "arm", label: "Qo'l", emoji: "💪", unit: "cm" },
  { id: "thigh", label: "Son", emoji: "🦿", unit: "cm" },
  { id: "neck", label: "Bo'yin", emoji: "🧣", unit: "cm" },
];

const measurementsSchema = z.object(
  reduce(
    measurementTypes,
    (acc, m) => {
      acc[get(m, "id")] = z.coerce
        .string()
        .optional()
        .transform((val) => (val === "" ? undefined : Number(val)))
        .refine((val) => val === undefined || val >= 0, {
          message: "Noto'g'ri qiymat",
        });
      return acc;
    },
    {},
  ),
);

export const MeasurementsTab = ({
  history,
  saveMeasurement,
  deleteMeasurement,
  getLatest,
}) => {
  const latest = getLatest();
  const [editing, setEditing] = React.useState(false);
  const [selectedBodyDate, setSelectedBodyDate] = React.useState(new Date());

  const measurementsForm = useForm({
    resolver: zodResolver(measurementsSchema),
    defaultValues: reduce(
      measurementTypes,
      (acc, m) => {
        const mId = get(m, "id");
        const latestVal = get(latest, mId);
        acc[mId] = latestVal ? String(latestVal) : "";
        return acc;
      },
      {},
    ),
  });

  const latestStringified = JSON.stringify(latest);

  React.useEffect(() => {
    const l = JSON.parse(latestStringified);
    const newValues = reduce(
      measurementTypes,
      (acc, m) => {
        const mId = get(m, "id");
        const val = get(l, mId);
        acc[mId] = val ? String(val) : "";
        return acc;
      },
      {},
    );
    measurementsForm.reset(newValues);
  }, [history, measurementsForm, latestStringified]);

  const onMeasurementsSubmit = async (data) => {
    const numValues = reduce(
      entries(data),
      (acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          acc[key] = val;
        }
        return acc;
      },
      {},
    );

    if (entries(numValues).length === 0) {
      toast.error("Kamida bitta o'lcham kiriting");
      return;
    }

    const isoDate = format(selectedBodyDate, "yyyy-MM-dd");
    try {
      await saveMeasurement({ date: isoDate, ...numValues });
      setEditing(false);
      toast.success("O'lchamlar saqlandi!");
    } catch {
      toast.error("O'lchamlarni saqlab bo'lmadi");
    }
  };

  const handleCancel = () => {
    const l = getLatest();
    const revertValues = reduce(
      measurementTypes,
      (acc, m) => {
        const mId = get(m, "id");
        const val = get(l, mId);
        acc[mId] = val ? String(val) : "";
        return acc;
      },
      {},
    );
    measurementsForm.reset(revertValues);
    setEditing(false);
  };

  const handleExportToCSV = () => {
    if (!history || get(history, "length", 0) === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const headers = [
      "Sana",
      "Vazn (kg)",
      ...map(measurementTypes, (m) => `${get(m, "label")} (${get(m, "unit")})`),
    ];
    const csvRows = [headers.join(",")];

    for (const row of history) {
      const values = [
        get(row, "date", ""),
        get(row, "weight", ""),
        ...map(measurementTypes, (m) => get(row, get(m, "id"), "")),
      ];
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `liveon_measurements_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("O'lchamlar tarixi muvaffaqiyatli yuklab olindi!");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row gap-6 xl:h-[600px]">
        {/* Left Column: Model */}
        <div className="flex-1 xl:max-w-[450px] h-full">
          <Form {...measurementsForm}>
            <form
              onSubmit={measurementsForm.handleSubmit(onMeasurementsSubmit)}
              className="flex flex-col gap-4 h-full"
            >
              {/* Interactive SVG Model */}
              <InteractiveBodyModel
                values={measurementsForm.watch()}
                onChange={(id, val) => {
                  measurementsForm.setValue(id, val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                editing={editing}
                onEdit={() => {
                  setSelectedBodyDate(new Date());
                  const currentLatest = getLatest();
                  const revertValues = reduce(
                    measurementTypes,
                    (acc, m) => {
                      const mId = get(m, "id");
                      const val = get(currentLatest, mId);
                      acc[mId] = val ? String(val) : "";
                      return acc;
                    },
                    {},
                  );
                  measurementsForm.reset(revertValues);
                  setEditing(true);
                }}
                measurementTypes={measurementTypes}
              />
            </form>
          </Form>
        </div>

        {/* Right Column: History */}
        <div className="flex-1 flex flex-col h-full gap-6">
          {/* History Table */}
          <Card className="flex-1 flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm">O'lchamlar tarixi</CardTitle>
                <CardDescription className="text-xs">
                  So'nggi yozuvlar
                </CardDescription>
              </div>
              {get(history, "length", 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToCSV}
                  className="h-8 text-xs font-semibold"
                >
                  <DownloadIcon className="size-3.5 mr-1.5" /> Eksport (CSV)
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              {get(history, "length", 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full min-h-[300px] border border-dashed rounded-xl bg-muted/10 mx-2">
                  <RulerIcon className="size-10 mb-3 opacity-30" />
                  <p className="font-medium text-sm">Hali o'lchovlar yo'q</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-1 h-full">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">
                          Sana
                        </th>
                        {map(measurementTypes, (m) => (
                          <th
                            key={get(m, "id")}
                            className="text-center py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap"
                          >
                            {get(m, "label")}
                          </th>
                        ))}
                        <th className="py-2 px-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {map(history, (row, i) => {
                        const dateStr = get(row, "date", "");
                        return (
                          <tr
                            key={dateStr}
                            className={cn(
                              "border-b last:border-0 transition-colors hover:bg-muted/30",
                              i === 0 && "bg-primary/5",
                              selectedBodyDate &&
                                editing &&
                                format(selectedBodyDate, "yyyy-MM-dd") ===
                                  dateStr &&
                                "bg-primary/10 border-primary/20",
                            )}
                          >
                            <td className="py-2.5 px-2 font-semibold whitespace-nowrap">
                              {dateStr === format(new Date(), "yyyy-MM-dd")
                                ? "Bugun"
                                : dateStr}
                            </td>
                            {map(measurementTypes, (m) => {
                              const mId = get(m, "id");
                              const rowVal = get(row, mId, 0);
                              return (
                                <td
                                  key={mId}
                                  className="text-center py-2.5 px-2 text-muted-foreground font-medium"
                                >
                                  {rowVal > 0 ? rowVal : "—"}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-2 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-sm hover:bg-primary/10 hover:text-primary"
                                  onClick={() => {
                                    const editDate = new Date(dateStr);
                                    setSelectedBodyDate(editDate);
                                    const editValues = reduce(
                                      measurementTypes,
                                      (acc, m) => {
                                        const mId = get(m, "id");
                                        const rowVal = get(row, mId);
                                        acc[mId] = rowVal ? String(rowVal) : "";
                                        return acc;
                                      },
                                      {},
                                    );
                                    measurementsForm.reset(editValues);
                                    setEditing(true);
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }}
                                >
                                  <PencilIcon className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-sm hover:bg-destructive/10 hover:text-destructive"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Rostdan ham ushbu sanadagi ma'lumotlarni o'chirib tashlamoqchimisiz?",
                                      )
                                    ) {
                                      try {
                                        await deleteMeasurement(dateStr);
                                        toast.success("O'lchamlar o'chirildi");
                                        if (
                                          editing &&
                                          format(
                                            selectedBodyDate,
                                            "yyyy-MM-dd",
                                          ) === dateStr
                                        ) {
                                          handleCancel();
                                        }
                                      } catch {
                                        toast.error(
                                          "O'lchamlarni o'chirib bo'lmadi",
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <Trash2Icon className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual comparison (Moved to a separate full-width row) */}
      {get(history, "length", 0) >= 2 && (
        <div className="w-full">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Vizual taqqoslash</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {map(measurementTypes, (m) => {
                  const mId = get(m, "id");
                  const current = get(history, `[0].${mId}`) || 0;
                  const oldest =
                    get(history, `[${get(history, "length", 0) - 1}].${mId}`) ||
                    0;
                  if (!current && !oldest) return null;
                  const change = current - oldest;
                  const maxVal = max([current, oldest, 1]);
                  return (
                    <div
                      key={mId}
                      className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/20 border border-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {get(m, "label")}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            change <= 0 ? "text-green-600" : "text-orange-500",
                          )}
                        >
                          {change > 0 ? "+" : ""}
                          {change.toFixed(1)} cm
                        </span>
                      </div>
                      <div className="w-full h-4 bg-muted/60 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-primary/20 rounded-full absolute transition-all"
                          style={{ width: `${(oldest / maxVal) * 100}%` }}
                        />
                        <div
                          className={cn(
                            "h-full rounded-full absolute transition-all",
                            change <= 0 ? "bg-green-500" : "bg-orange-400",
                          )}
                          style={{
                            width: `${(current / maxVal) * 100}%`,
                            opacity: 0.65,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground/50 px-1 mt-0.5">
                        <span>
                          Boshlang'ich: {oldest} {get(m, "unit")}
                        </span>
                        <span>
                          Hozirgi: {current} {get(m, "unit")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
