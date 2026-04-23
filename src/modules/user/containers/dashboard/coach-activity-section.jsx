import { get, map, take } from "lodash";
import React from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePatchQuery from "@/hooks/api/use-patch-query";
import usePostQuery from "@/hooks/api/use-post-query";
import { Button } from "@/components/ui/button";
import WeeklyCheckInDrawer from "./weekly-check-in-drawer.jsx";
import {
  DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
  DASHBOARD_COACH_TASKS_QUERY_KEY,
  DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
} from "./query-helpers.js";

export default function CoachActivitySection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: checkInsData } = useGetQuery({
    url: "/users/me/check-ins",
    queryProps: {
      queryKey: DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
    },
  });
  const { data: feedbackData } = useGetQuery({
    url: "/users/me/coach-feedback",
    queryProps: {
      queryKey: DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
    },
  });
  const { data: tasksData } = useGetQuery({
    url: "/users/me/coach-tasks",
    queryProps: {
      queryKey: DASHBOARD_COACH_TASKS_QUERY_KEY,
    },
  });
  const submitMutation = usePostQuery({
    queryKey: DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
  });
  const completeMutation = usePatchQuery({
    queryKey: DASHBOARD_COACH_TASKS_QUERY_KEY,
  });
  const [activeCheckIn, setActiveCheckIn] = React.useState(null);
  const [isCompletingTaskId, setIsCompletingTaskId] = React.useState(null);
  const [checkInForm, setCheckInForm] = React.useState({
    weightKg: "",
    moodScore: 3,
    energyScore: 3,
    adherenceScore: 3,
    responseNotes: "",
  });
  const checkIns = get(checkInsData, "data.data.items", []);
  const pendingCheckIns = checkIns.filter(
    (item) => item.status === "pending" || item.status === "overdue",
  );
  const feedbackItems = get(feedbackData, "data.data.items", []);
  const latestFeedback = feedbackItems[0] ?? null;
  const tasks = get(tasksData, "data.data.items", []);
  const openTasks = tasks.filter((item) => item.status === "open");
  const isCompletingTask = completeMutation.isPending;

  const openCheckIn = React.useCallback((checkIn) => {
    setActiveCheckIn(checkIn);
    setCheckInForm({
      weightKg: "",
      moodScore: 3,
      energyScore: 3,
      adherenceScore: 3,
      responseNotes: "",
    });
  }, []);

  React.useEffect(() => {
    const checkInId = location.state?.openWeeklyCheckInId;

    if (!checkInId || pendingCheckIns.length === 0) {
      return;
    }

    const matchedCheckIn = pendingCheckIns.find((item) => item.id === checkInId);

    if (matchedCheckIn) {
      openCheckIn(matchedCheckIn);
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    openCheckIn,
    pendingCheckIns,
  ]);

  const handleSubmitCheckIn = async () => {
    if (!activeCheckIn) {
      return;
    }

    try {
      await submitMutation.mutateAsync({
        url: `/users/me/check-ins/${activeCheckIn.id}/submit`,
        attributes: {
          weightKg: checkInForm.weightKg
            ? Number(checkInForm.weightKg)
            : undefined,
          moodScore: checkInForm.moodScore,
          energyScore: checkInForm.energyScore,
          adherenceScore: checkInForm.adherenceScore,
          responseNotes: checkInForm.responseNotes || undefined,
        },
      });
      toast.success("Weekly check-in yuborildi");
      setActiveCheckIn(null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Weekly check-in yuborib bo'lmadi",
      );
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setIsCompletingTaskId(taskId);
      await completeMutation.mutateAsync({
        url: `/users/me/coach-tasks/${taskId}/complete`,
        attributes: {},
      });
      toast.success("Vazifa bajarildi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Vazifani yopib bo'lmadi");
    } finally {
      setIsCompletingTaskId(null);
    }
  };

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
                      <Button onClick={() => openCheckIn(checkIn)}>
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
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    Bajarildi
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <WeeklyCheckInDrawer
        checkIn={activeCheckIn}
        form={checkInForm}
        setForm={setCheckInForm}
        onSubmit={handleSubmitCheckIn}
        isSubmitting={submitMutation.isPending}
        onClose={() => setActiveCheckIn(null)}
      />
    </>
  );
}
