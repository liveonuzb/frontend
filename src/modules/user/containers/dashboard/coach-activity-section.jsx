import { eq, filter, find, get, map, size, take } from "lodash";
import React from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePatchQuery from "@/hooks/api/use-patch-query";
import usePostQuery from "@/hooks/api/use-post-query";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiResponseData } from "@/lib/api-response";
import {
  DASHBOARD_ME_QUERY_KEY,
  DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
  DASHBOARD_COACH_TASKS_QUERY_KEY,
  DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
} from "./query-helpers.js";

const CHECK_IN_SCORE_FIELDS = [
  { key: "moodScore", label: "Kayfiyat" },
  { key: "energyScore", label: "Energiya" },
  { key: "adherenceScore", label: "Rejaga amal qilish" },
];

const CHECK_IN_SCORE_VALUES = [1, 2, 3, 4, 5];

export default function CoachActivitySection({ user: userOverride }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: userOverride === undefined,
    },
  });
  const user = React.useMemo(
    () => userOverride ?? getApiResponseData(userData, null),
    [userData, userOverride],
  );
  const hasCoachConnection = Boolean(get(user, "coachConnection.assignmentId"));
  const { data: checkInsData } = useGetQuery({
    url: "/users/me/check-ins",
    queryProps: {
      queryKey: DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
      enabled: hasCoachConnection,
    },
  });
  const { data: feedbackData } = useGetQuery({
    url: "/users/me/coach-feedback",
    queryProps: {
      queryKey: DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
      enabled: hasCoachConnection,
    },
  });
  const { data: tasksData } = useGetQuery({
    url: "/users/me/coach-tasks",
    queryProps: {
      queryKey: DASHBOARD_COACH_TASKS_QUERY_KEY,
      enabled: hasCoachConnection,
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
  const pendingCheckIns = filter(
    checkIns,
    (item) => item.status === "pending" || item.status === "overdue",
  );
  const feedbackItems = get(feedbackData, "data.data.items", []);
  const latestFeedback = get(feedbackItems, 0, null);
  const tasks = get(tasksData, "data.data.items", []);
  const openTasks = filter(tasks, (item) => item.status === "open");
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

  const closeCheckIn = React.useCallback(() => {
    setActiveCheckIn(null);
  }, []);

  const updateCheckInForm = React.useCallback((field, value) => {
    setCheckInForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  React.useEffect(() => {
    const checkInId = location.state?.openWeeklyCheckInId;

    if (!checkInId || size(pendingCheckIns) === 0) {
      return;
    }

    const matchedCheckIn = find(
      pendingCheckIns,
      (item) => item.id === checkInId,
    );

    if (matchedCheckIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleSubmitCheckIn = async (event) => {
    event?.preventDefault();

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
      closeCheckIn();
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
    size(pendingCheckIns) > 0 || latestFeedback || size(openTasks) > 0;

  if (!hasCoachConnection || !hasContent) return null;

  return (
    <>
      {size(pendingCheckIns) > 0 || latestFeedback ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {size(pendingCheckIns) > 0 ? (
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

      {size(openTasks) > 0 ? (
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
                    disabled={
                      isCompletingTask && isCompletingTaskId === task.id
                    }
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

      <Drawer
        open={Boolean(activeCheckIn)}
        onOpenChange={(open) => {
          if (!open) {
            closeCheckIn();
          }
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {get(activeCheckIn, "title", "Weekly check-in")}
            </DrawerTitle>
            <DrawerDescription>
              {get(activeCheckIn, "coach.name", "Murabbiy")} uchun qisqa
              haftalik hisobot.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form
              id="weekly-check-in-form"
              className="space-y-4"
              onSubmit={handleSubmitCheckIn}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium">Vazn (kg)</span>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={checkInForm.weightKg}
                  onChange={(event) =>
                    updateCheckInForm("weightKg", event.target.value)
                  }
                  placeholder="Masalan, 72.5"
                />
              </label>

              {map(CHECK_IN_SCORE_FIELDS, (field) => (
                <div key={field.key} className="space-y-2">
                  <div className="text-sm font-medium">{field.label}</div>
                  <div className="grid grid-cols-5 gap-2">
                    {map(CHECK_IN_SCORE_VALUES, (value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={
                          eq(get(checkInForm, field.key), value)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="rounded-xl"
                        onClick={() => updateCheckInForm(field.key, value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              <label className="block space-y-2">
                <span className="text-sm font-medium">Izoh</span>
                <Textarea
                  value={checkInForm.responseNotes}
                  onChange={(event) =>
                    updateCheckInForm("responseNotes", event.target.value)
                  }
                  placeholder="Haftangiz qanday o'tdi?"
                />
              </label>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="submit"
              form="weekly-check-in-form"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
            <Button type="button" variant="outline" onClick={closeCheckIn}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
