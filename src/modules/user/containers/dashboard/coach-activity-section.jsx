import { map, take } from "lodash";
import React from "react";
import { Button } from "@/components/ui/button";

export default function CoachActivitySection({
  pendingCheckIns,
  latestFeedback,
  openTasks,
  isCompletingTask,
  isCompletingTaskId,
  onOpenCheckIn,
  onCompleteTask,
}) {
  const hasContent =
    pendingCheckIns.length > 0 || latestFeedback || openTasks.length > 0;

  if (!hasContent) return null;

  return (
    <>
      {pendingCheckIns.length > 0 || latestFeedback ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {pendingCheckIns.length > 0 ? (
            <div className="rounded-2xl border px-4 py-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Weekly check-in</h2>
                <p className="text-sm text-muted-foreground">
                  Murabbiy sizdan haftalik qisqa hisobot kutmoqda.
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                {map(pendingCheckIns, (checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{checkIn.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {checkIn.coach.name}
                      </div>
                      {checkIn.note ? (
                        <div className="text-sm text-muted-foreground">
                          {checkIn.note}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {checkIn.status === "overdue" ? (
                        <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">
                          Muddati o&apos;tgan
                        </div>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        Muddat:{" "}
                        {new Date(checkIn.dueDate).toLocaleDateString("uz-UZ")}
                      </span>
                      <Button onClick={() => onOpenCheckIn(checkIn)}>
                        To&apos;ldirish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {latestFeedback ? (
            <div className="rounded-3xl border px-5 py-5">
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Murabbiy fikri
                    </div>
                    <h2 className="text-lg font-semibold">
                      {latestFeedback.title || "Yangi fikr-mulohaza"}
                    </h2>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(latestFeedback.createdAt).toLocaleDateString(
                      "uz-UZ",
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {latestFeedback.message}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {openTasks.length > 0 ? (
        <div className="rounded-3xl border px-5 py-5">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold">Murabbiy vazifalari</h2>
              <p className="text-sm text-muted-foreground">
                Siz uchun ochiq qolgan vazifalar.
              </p>
            </div>
            <div className="grid gap-3">
              {map(take(openTasks, 3), (task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description ? (
                      <div className="text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {task.targetValue && task.targetUnit
                        ? `${task.targetValue} ${task.targetUnit}`
                        : "Custom vazifa"}
                      {task.dueDate
                        ? ` \u2022 ${new Date(task.dueDate).toLocaleDateString("uz-UZ")}`
                        : ""}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isCompletingTask && isCompletingTaskId === task.id}
                    onClick={() => onCompleteTask(task.id)}
                  >
                    Bajarildi
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
