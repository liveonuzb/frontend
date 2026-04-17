import {
  find,
  get,
  map,
  toUpper,
  trim,
} from "lodash";
import React from "react";
import {
  BellPlusIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LIFECYCLE_OPTIONS = [
  { value: "LEAD", label: "Lead", tone: "bg-sky-500/10 text-sky-700" },
  { value: "ACTIVE", label: "Active", tone: "bg-emerald-500/10 text-emerald-700" },
  { value: "PAUSED", label: "Paused", tone: "bg-amber-500/10 text-amber-700" },
  { value: "AT_RISK", label: "At risk", tone: "bg-rose-500/10 text-rose-700" },
  { value: "CHURNED", label: "Churned", tone: "bg-slate-500/10 text-slate-700" },
];

const STATUS_TONES = {
  open: "bg-blue-500/10 text-blue-700",
  done: "bg-emerald-500/10 text-emerald-700",
  snoozed: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-slate-500/10 text-slate-700",
};

const pad = (value) => String(value).padStart(2, "0");

const toDateTimeLocal = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getDefaultDueAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocal(date);
};

const normalizeStage = (stage) =>
  toUpper(trim(String(stage || "ACTIVE")));

const formatReminderDate = (value, locale) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ClientCrmPanel({
  client,
  reminders,
  isLoading,
  isCreatingReminder,
  isDeletingReminder,
  isUpdatingLifecycle,
  isUpdatingReminder,
  onCreateReminder,
  onDeleteReminder,
  onUpdateLifecycle,
  onUpdateReminder,
}) {
  const { t, i18n } = useTranslation();
  const [stage, setStage] = React.useState(() =>
    normalizeStage(get(client, "lifecycleStage")),
  );
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [dueAt, setDueAt] = React.useState(() => getDefaultDueAt());

  React.useEffect(() => {
    setStage(normalizeStage(get(client, "lifecycleStage")));
  }, [get(client, "lifecycleStage")]);

  const selectedStage =
    find(LIFECYCLE_OPTIONS, (item) => item.value === stage) ??
    LIFECYCLE_OPTIONS[1];

  const handleStageChange = async (value) => {
    const previous = stage;
    setStage(value);

    try {
      await onUpdateLifecycle(value);
      toast.success(
        t("coach.clients.clientDetail.crm.stageUpdated", {
          defaultValue: "Lifecycle stage updated.",
        }),
      );
    } catch (error) {
      setStage(previous);
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.crm.stageError", {
            defaultValue: "Could not update lifecycle stage.",
          }),
      );
    }
  };

  const handleCreateReminder = async (event) => {
    event.preventDefault();

    if (!trim(title)) {
      toast.error(
        t("coach.clients.clientDetail.crm.reminderTitleRequired", {
          defaultValue: "Reminder title is required.",
        }),
      );
      return;
    }

    try {
      await onCreateReminder({
        title: trim(title),
        note: trim(note) || undefined,
        dueAt,
      });
      setTitle("");
      setNote("");
      setDueAt(getDefaultDueAt());
      toast.success(
        t("coach.clients.clientDetail.crm.reminderCreated", {
          defaultValue: "Reminder created.",
        }),
      );
    } catch (error) {
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.crm.reminderCreateError", {
            defaultValue: "Could not create reminder.",
          }),
      );
    }
  };

  const handleToggleReminder = async (reminder) => {
    const nextStatus = reminder.status === "done" ? "OPEN" : "DONE";

    try {
      await onUpdateReminder(reminder.id, { status: nextStatus });
    } catch (error) {
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.crm.reminderUpdateError", {
            defaultValue: "Could not update reminder.",
          }),
      );
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await onDeleteReminder(reminderId);
    } catch (error) {
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.crm.reminderDeleteError", {
            defaultValue: "Could not delete reminder.",
          }),
      );
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-card/70 py-6 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>
            {t("coach.clients.clientDetail.crm.title", {
              defaultValue: "Client CRM",
            })}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("coach.clients.clientDetail.crm.description", {
              defaultValue:
                "Track lifecycle stage and coach-owned follow-up reminders.",
            })}
          </p>
        </div>
        <div className="flex min-w-56 items-center gap-3">
          <Badge className={cn("border-0 px-3 py-1", selectedStage.tone)}>
            {selectedStage.label}
          </Badge>
          <Select
            value={stage}
            onValueChange={handleStageChange}
            disabled={isUpdatingLifecycle}
          >
            <SelectTrigger className="h-10 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {map(LIFECYCLE_OPTIONS, (item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="rounded-3xl border bg-background/60 p-4"
          onSubmit={handleCreateReminder}
        >
          <div className="mb-4 flex items-center gap-2">
            <BellPlusIcon className="size-4 text-primary" />
            <p className="text-sm font-bold">
              {t("coach.clients.clientDetail.crm.newReminder", {
                defaultValue: "New reminder",
              })}
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="coach-client-reminder-title">
                {t("coach.clients.clientDetail.crm.reminderTitle", {
                  defaultValue: "Title",
                })}
              </Label>
              <Input
                id="coach-client-reminder-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t(
                  "coach.clients.clientDetail.crm.reminderTitlePlaceholder",
                  { defaultValue: "Check weekly progress" },
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-client-reminder-due-at">
                {t("coach.clients.clientDetail.crm.reminderDueAt", {
                  defaultValue: "Due time",
                })}
              </Label>
              <Input
                id="coach-client-reminder-due-at"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-client-reminder-note">
                {t("coach.clients.clientDetail.crm.reminderNote", {
                  defaultValue: "Note",
                })}
              </Label>
              <Textarea
                id="coach-client-reminder-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t(
                  "coach.clients.clientDetail.crm.reminderNotePlaceholder",
                  { defaultValue: "Context for the follow-up..." },
                )}
                rows={3}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-2xl"
              disabled={isCreatingReminder}
            >
              {t("coach.clients.clientDetail.crm.addReminder", {
                defaultValue: "Add reminder",
              })}
            </Button>
          </div>
        </form>

        <div className="rounded-3xl border bg-muted/20 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock3Icon className="size-4 text-primary" />
              <p className="text-sm font-bold">
                {t("coach.clients.clientDetail.crm.reminders", {
                  defaultValue: "Reminders",
                })}
              </p>
            </div>
            <Badge variant="outline" className="rounded-xl">
              {reminders.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {map([0, 1, 2], (item) => (
                <Skeleton key={item} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-background/60 p-6 text-sm text-muted-foreground">
              {t("coach.clients.clientDetail.crm.noReminders", {
                defaultValue: "No reminders yet.",
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {map(reminders, (reminder) => (
                <div
                  key={reminder.id}
                  className="flex flex-col gap-3 rounded-2xl bg-background/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold leading-tight">
                        {reminder.title}
                      </p>
                      <Badge
                        className={cn(
                          "border-0 text-[10px]",
                          STATUS_TONES[reminder.status] ?? STATUS_TONES.open,
                        )}
                      >
                        {reminder.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatReminderDate(reminder.dueAt, i18n.language)}
                    </p>
                    {reminder.note ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {reminder.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={isUpdatingReminder}
                      onClick={() => handleToggleReminder(reminder)}
                    >
                      <CheckCircle2Icon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-destructive"
                      disabled={isDeletingReminder}
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
