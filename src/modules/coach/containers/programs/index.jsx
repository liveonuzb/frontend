import {
  capitalize,
  filter,
  find,
  get,
  includes,
  isArray,
  isEmpty,
  join,
  map,
  size,
  slice,
  split,
  times,
  toUpper,
  trim,
  uniq,
} from "lodash";
import React from "react";
import {
  ArchiveIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  CopyIcon,
  PlusIcon,
  RotateCcwIcon,
  SendIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import CoachErrorState from "@/modules/coach/components/coach-error-state";
import {
  useCoachClients,
  useCoachGroups,
  useCoachMealPlans,
  useCoachPrograms,
  useCoachWorkoutPlans,
} from "@/hooks/app/use-coach.js";
import { useBreadcrumbStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [4, 8, 12];
const TASK_TYPE_OPTIONS = ["CUSTOM", "WATER", "STEPS", "MEALS", "WORKOUT"];
const EMPTY_OPTION = "__none__";

const buildEmptyWeek = (weekNumber, source = {}) => {
  const firstTask = isArray(source.tasks) ? source.tasks[0] : null;

  return {
    weekNumber,
    title: source.title || `Week ${weekNumber}`,
    description: source.description || "",
    mealPlanTemplateId: source.mealPlanTemplateId || "",
    workoutPlanTemplateId: source.workoutPlanTemplateId || "",
    taskTitle: get(firstTask, "title") || "",
    taskType: get(firstTask, "type") || "CUSTOM",
    taskTargetValue:
      get(firstTask, "targetValue") !== undefined && get(firstTask, "targetValue") !== null
        ? String(firstTask.targetValue)
        : "",
    taskTargetUnit: get(firstTask, "targetUnit") || "",
    taskDueDayOffset:
      get(firstTask, "dueDayOffset") !== undefined && get(firstTask, "dueDayOffset") !== null
        ? String(firstTask.dueDayOffset)
        : "6",
    checkInTitle: source.checkInTitle || "",
    checkInNote: source.checkInNote || "",
    checkInDayOffset:
      source.checkInDayOffset !== undefined && source.checkInDayOffset !== null
        ? String(source.checkInDayOffset)
        : "6",
    notes: source.notes || "",
  };
};

const buildWeeks = (durationWeeks, sourceWeeks = []) =>
  map(times(durationWeeks), (index) => {
    const weekNumber = index + 1;
    const source = find(sourceWeeks, (week) => week.weekNumber === weekNumber);

    return buildEmptyWeek(weekNumber, source);
  });

const buildInitialForm = (program = null) => {
  const durationWeeks = Number(get(program, "durationWeeks") || 8);

  return {
    title: get(program, "title") || "",
    description: get(program, "description") || "",
    durationWeeks,
    status: toUpper(get(program, "status") || "draft"),
    tags: isArray(get(program, "tags")) ? join(program.tags, ", ") : "",
    weeks: buildWeeks(durationWeeks, get(program, "weeks") || []),
  };
};

const normalizeProgramPayload = (form) => {
  const durationWeeks = Number(form.durationWeeks);

  return {
    title: trim(form.title),
    description: trim(form.description),
    durationWeeks,
    status: form.status,
    tags: filter(map(split(form.tags, ","), (tag) => trim(tag)), Boolean),
    weeks: map(slice(form.weeks, 0, durationWeeks), (week, index) => {
      const targetValue = Number(week.taskTargetValue);
      const hasTargetValue =
        week.taskTargetValue !== "" && Number.isInteger(targetValue);
      const dueDayOffset = Number(week.taskDueDayOffset);
      const checkInDayOffset = Number(week.checkInDayOffset);

      return {
        weekNumber: index + 1,
        title: trim(week.title) || `Week ${index + 1}`,
        description: trim(week.description),
        mealPlanTemplateId: week.mealPlanTemplateId || undefined,
        workoutPlanTemplateId: week.workoutPlanTemplateId || undefined,
        tasks: trim(week.taskTitle)
          ? [
              {
                title: trim(week.taskTitle),
                type: week.taskType,
                targetValue: hasTargetValue ? targetValue : undefined,
                targetUnit: trim(week.taskTargetUnit) || undefined,
                dueDayOffset: Number.isInteger(dueDayOffset)
                  ? Math.max(0, Math.min(6, dueDayOffset))
                  : 6,
              },
            ]
          : [],
        checkInTitle: trim(week.checkInTitle),
        checkInNote: trim(week.checkInNote),
        checkInDayOffset: Number.isInteger(checkInDayOffset)
          ? Math.max(0, Math.min(6, checkInDayOffset))
          : 6,
        notes: trim(week.notes),
      };
    }),
  };
};

const statusLabel = (status) => {
  if (!status) return "Draft";
  return capitalize(status);
};

const getClientName = (client) =>
  get(client, "name") ||
  [get(client, "firstName"), get(client, "lastName")].filter(Boolean).join(" ") ||
  get(client, "email") ||
  get(client, "phone") ||
  "Client";

const ProgramEditorDrawer = ({
  open,
  onOpenChange,
  form,
  setForm,
  editingProgram,
  mealPlans,
  workoutPlans,
  onSubmit,
  isSaving,
}) => {
  const { t } = useTranslation();

  const updateField = React.useCallback(
    (field, value) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [setForm],
  );

  const updateDuration = React.useCallback(
    (value) => {
      const durationWeeks = Number(value);
      setForm((current) => ({
        ...current,
        durationWeeks,
        weeks: buildWeeks(durationWeeks, current.weeks),
      }));
    },
    [setForm],
  );

  const updateWeek = React.useCallback(
    (weekIndex, field, value) => {
      setForm((current) => ({
        ...current,
        weeks: map(current.weeks, (week, index) =>
          index === weekIndex ? { ...week, [field]: value } : week,
        ),
      }));
    },
    [setForm],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[92vh] max-w-6xl rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {editingProgram
              ? t("coach.programs.editor.editTitle", {
                  defaultValue: "Edit program",
                })
              : t("coach.programs.editor.createTitle", {
                  defaultValue: "Create program",
                })}
          </DrawerTitle>
          <DrawerDescription>
            {t("coach.programs.editor.description", {
              defaultValue:
                "Build a week-by-week coaching program from meal plans, workout plans, tasks, and check-ins.",
            })}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto px-6">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("coach.programs.editor.basics", {
                    defaultValue: "Program basics",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("coach.programs.editor.basicsDescription", {
                    defaultValue:
                      "Keep the program reusable, then assign it to one client or a group.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="program-title">
                      {t("coach.programs.fields.title", {
                        defaultValue: "Title",
                      })}
                    </FieldLabel>
                    <Input
                      id="program-title"
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      placeholder={t("coach.programs.placeholders.title", {
                        defaultValue: "8 week reset",
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>
                      {t("coach.programs.fields.duration", {
                        defaultValue: "Duration",
                      })}
                    </FieldLabel>
                    <Select
                      value={String(form.durationWeeks)}
                      onValueChange={updateDuration}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {map(DURATION_OPTIONS, (weekCount) => (
                            <SelectItem
                              key={weekCount}
                              value={String(weekCount)}
                            >
                              {weekCount} weeks
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>
                      {t("coach.programs.fields.status", {
                        defaultValue: "Status",
                      })}
                    </FieldLabel>
                    <Select
                      value={form.status}
                      onValueChange={(value) => updateField("status", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="program-tags">
                      {t("coach.programs.fields.tags", {
                        defaultValue: "Tags",
                      })}
                    </FieldLabel>
                    <Input
                      id="program-tags"
                      value={form.tags}
                      onChange={(event) =>
                        updateField("tags", event.target.value)
                      }
                      placeholder="fat-loss, beginner, home"
                    />
                    <FieldDescription>
                      {t("coach.programs.fields.tagsHint", {
                        defaultValue: "Comma separated labels.",
                      })}
                    </FieldDescription>
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="program-description">
                      {t("coach.programs.fields.description", {
                        defaultValue: "Description",
                      })}
                    </FieldLabel>
                    <Textarea
                      id="program-description"
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      className="min-h-24 resize-none"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {map(form.weeks, (week, index) => (
                <Card key={week.weekNumber}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        Week {week.weekNumber}
                      </Badge>
                      {week.title || `Week ${week.weekNumber}`}
                    </CardTitle>
                    <CardDescription>
                      {t("coach.programs.editor.weekDescription", {
                        defaultValue:
                          "Select templates, one focus task, and the weekly check-in.",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="gap-4">
                      <Field>
                        <FieldLabel htmlFor={`week-${index}-title`}>
                          {t("coach.programs.fields.weekTitle", {
                            defaultValue: "Week title",
                          })}
                        </FieldLabel>
                        <Input
                          id={`week-${index}-title`}
                          value={week.title}
                          onChange={(event) =>
                            updateWeek(index, "title", event.target.value)
                          }
                        />
                      </Field>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>
                            {t("coach.programs.fields.mealTemplate", {
                              defaultValue: "Meal template",
                            })}
                          </FieldLabel>
                          <Select
                            value={week.mealPlanTemplateId || EMPTY_OPTION}
                            onValueChange={(value) =>
                              updateWeek(
                                index,
                                "mealPlanTemplateId",
                                value === EMPTY_OPTION ? "" : value,
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t(
                                  "coach.programs.placeholders.noMeal",
                                  { defaultValue: "No meal template" },
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value={EMPTY_OPTION}>
                                  No meal template
                                </SelectItem>
                                {map(mealPlans, (plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.title}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field>
                          <FieldLabel>
                            {t("coach.programs.fields.workoutTemplate", {
                              defaultValue: "Workout template",
                            })}
                          </FieldLabel>
                          <Select
                            value={week.workoutPlanTemplateId || EMPTY_OPTION}
                            onValueChange={(value) =>
                              updateWeek(
                                index,
                                "workoutPlanTemplateId",
                                value === EMPTY_OPTION ? "" : value,
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t(
                                  "coach.programs.placeholders.noWorkout",
                                  { defaultValue: "No workout template" },
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value={EMPTY_OPTION}>
                                  No workout template
                                </SelectItem>
                                {map(workoutPlans, (plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <FieldGroup className="gap-4">
                          <Field>
                            <FieldLabel htmlFor={`week-${index}-task`}>
                              {t("coach.programs.fields.task", {
                                defaultValue: "Focus task",
                              })}
                            </FieldLabel>
                            <Input
                              id={`week-${index}-task`}
                              value={week.taskTitle}
                              onChange={(event) =>
                                updateWeek(
                                  index,
                                  "taskTitle",
                                  event.target.value,
                                )
                              }
                              placeholder="Daily steps, water, meal log..."
                            />
                          </Field>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Field>
                              <FieldLabel>
                                {t("coach.programs.fields.taskType", {
                                  defaultValue: "Task type",
                                })}
                              </FieldLabel>
                              <Select
                                value={week.taskType}
                                onValueChange={(value) =>
                                  updateWeek(index, "taskType", value)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {map(TASK_TYPE_OPTIONS, (type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`week-${index}-target`}>
                                {t("coach.programs.fields.target", {
                                  defaultValue: "Target",
                                })}
                              </FieldLabel>
                              <Input
                                id={`week-${index}-target`}
                                inputMode="numeric"
                                value={week.taskTargetValue}
                                onChange={(event) =>
                                  updateWeek(
                                    index,
                                    "taskTargetValue",
                                    event.target.value,
                                  )
                                }
                                placeholder="8000"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`week-${index}-unit`}>
                                {t("coach.programs.fields.unit", {
                                  defaultValue: "Unit",
                                })}
                              </FieldLabel>
                              <Input
                                id={`week-${index}-unit`}
                                value={week.taskTargetUnit}
                                onChange={(event) =>
                                  updateWeek(
                                    index,
                                    "taskTargetUnit",
                                    event.target.value,
                                  )
                                }
                                placeholder="steps"
                              />
                            </Field>
                          </div>
                        </FieldGroup>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`week-${index}-checkin-title`}>
                            {t("coach.programs.fields.checkInTitle", {
                              defaultValue: "Check-in title",
                            })}
                          </FieldLabel>
                          <Input
                            id={`week-${index}-checkin-title`}
                            value={week.checkInTitle}
                            onChange={(event) =>
                              updateWeek(
                                index,
                                "checkInTitle",
                                event.target.value,
                              )
                            }
                            placeholder="Weekly check-in"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`week-${index}-checkin-day`}>
                            {t("coach.programs.fields.checkInDay", {
                              defaultValue: "Check-in day offset",
                            })}
                          </FieldLabel>
                          <Input
                            id={`week-${index}-checkin-day`}
                            inputMode="numeric"
                            value={week.checkInDayOffset}
                            onChange={(event) =>
                              updateWeek(
                                index,
                                "checkInDayOffset",
                                event.target.value,
                              )
                            }
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor={`week-${index}-notes`}>
                          {t("coach.programs.fields.notes", {
                            defaultValue: "Coach notes",
                          })}
                        </FieldLabel>
                        <Textarea
                          id={`week-${index}-notes`}
                          value={week.notes}
                          onChange={(event) =>
                            updateWeek(index, "notes", event.target.value)
                          }
                          className="min-h-20 resize-none"
                        />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/coach/meal-plans">
                {t("coach.programs.actions.openMealPlans", {
                  defaultValue: "Open meal plans",
                })}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/coach/workout-plans">
                {t("coach.programs.actions.openWorkoutPlans", {
                  defaultValue: "Open workouts",
                })}
              </Link>
            </Button>
          </div>
          <Button disabled={isSaving} onClick={onSubmit}>
            {isSaving
              ? t("coach.programs.actions.saving", {
                  defaultValue: "Saving...",
                })
              : t("coach.programs.actions.save", {
                  defaultValue: "Save program",
                })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const ProgramAssignDrawer = ({
  open,
  onOpenChange,
  program,
  clients,
  groups,
  selectedClientIds,
  setSelectedClientIds,
  selectedGroupId,
  setSelectedGroupId,
  startDate,
  setStartDate,
  onSubmit,
  isAssigning,
}) => {
  const { t } = useTranslation();

  const toggleClient = React.useCallback(
    (clientId) => {
      setSelectedClientIds((current) =>
        includes(current, clientId)
          ? filter(current, (item) => item !== clientId)
          : [...current, clientId],
      );
    },
    [setSelectedClientIds],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[86vh] max-w-3xl rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {t("coach.programs.assign.title", {
              defaultValue: "Assign program",
            })}
          </DrawerTitle>
          <DrawerDescription>
            {get(program, "title") ||
              t("coach.programs.assign.noProgram", {
                defaultValue: "Choose clients or one group.",
              })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="overflow-y-auto px-6">
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="program-start-date">
                {t("coach.programs.assign.startDate", {
                  defaultValue: "Start date",
                })}
              </FieldLabel>
              <Input
                id="program-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>
                {t("coach.programs.assign.group", {
                  defaultValue: "Group",
                })}
              </FieldLabel>
              <Select
                value={selectedGroupId || EMPTY_OPTION}
                onValueChange={(value) =>
                  setSelectedGroupId(value === EMPTY_OPTION ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("coach.programs.assign.noGroup", {
                      defaultValue: "No group",
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={EMPTY_OPTION}>No group</SelectItem>
                    {map(groups, (group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {t("coach.programs.assign.groupHint", {
                  defaultValue:
                    "If a group is selected, all active members are included.",
                })}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                {t("coach.programs.assign.clients", {
                  defaultValue: "Clients",
                })}
              </FieldLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {map(clients, (client) => {
                  const selected = includes(selectedClientIds, client.id);

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => toggleClient(client.id)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:bg-muted/40",
                      )}
                    >
                      <span>
                        <span className="block font-medium">
                          {getClientName(client)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {client.status || "active"}
                        </span>
                      </span>
                      <Badge variant={selected ? "default" : "outline"}>
                        {selected ? "Selected" : "Add"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </Field>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter className="px-6 py-4">
          <Button disabled={isAssigning} onClick={onSubmit}>
            <SendIcon data-icon="inline-start" />
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const ProgramCard = ({
  program,
  onEdit,
  onAssign,
  onDuplicate,
  onArchive,
  onAdvanceAssignment,
  onCompleteAssignment,
  isUpdatingProgress,
}) => {
  const activeAssignments = program.assignments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {program.title}
          <Badge
            variant={program.status === "active" ? "default" : "secondary"}
            className="rounded-full"
          >
            {statusLabel(program.status)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {program.description || "No description"}
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(program)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(program.id)}
          >
            <CopyIcon data-icon="inline-start" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAssign(program)}>
            <SendIcon data-icon="inline-start" />
            Assign
          </Button>
          {program.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onArchive(program.id)}
            >
              <ArchiveIcon data-icon="inline-start" />
              Archive
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="text-2xl font-semibold">
              {program.durationWeeks}
            </div>
            <div className="text-xs text-muted-foreground">weeks</div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="text-2xl font-semibold">
              {program.get(weeks, "length") || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              configured weeks
            </div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="text-2xl font-semibold">
              {program.assignmentsCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">assignments</div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="text-2xl font-semibold">
              {program.activeAssignmentsCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">active</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {map(program.weeks ?? [], (week) => (
            <Badge key={week.id || week.weekNumber} variant="outline">
              Week {week.weekNumber}: {week.title}
            </Badge>
          ))}
        </div>

        {size(activeAssignments) > 0 && (
          <div className="flex flex-col gap-3">
            {map(activeAssignments, (assignment) => {
              const nextWeek = Math.min(
                program.durationWeeks,
                assignment.currentWeek + 1,
              );
              const canAdvance =
                assignment.status === "active" &&
                assignment.currentWeek < program.durationWeeks;

              return (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-2xl border bg-muted/10 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {get(assignment.client, "name") || "Client"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Week {assignment.currentWeek} of {program.durationWeeks} -{" "}
                      {assignment.progressPercent}% complete
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canAdvance && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingProgress}
                        onClick={() =>
                          onAdvanceAssignment(program, assignment, nextWeek)
                        }
                      >
                        <ArrowRightIcon data-icon="inline-start" />
                        Next week
                      </Button>
                    )}
                    {assignment.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingProgress}
                        onClick={() =>
                          onCompleteAssignment(program, assignment)
                        }
                      >
                        <CheckCircle2Icon data-icon="inline-start" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CoachProgramsContainer = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    programs,
    isLoading,
    isFetching,
    isError,
    refetch,
    createProgram,
    updateProgram,
    duplicateProgram,
    assignProgram,
    updateProgramProgress,
    archiveProgram,
    isCreating,
    isUpdating,
    isDuplicating,
    isAssigning,
    isUpdatingProgress,
    isArchiving,
  } = useCoachPrograms();
  const { mealPlans } = useCoachMealPlans();
  const { workoutPlans } = useCoachWorkoutPlans();
  const { clients } = useCoachClients();
  const { groups } = useCoachGroups();

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState(null);
  const [form, setForm] = React.useState(() => buildInitialForm());
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assigningProgram, setAssigningProgram] = React.useState(null);
  const [selectedClientIds, setSelectedClientIds] = React.useState([]);
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [startDate, setStartDate] = React.useState(() =>
    new slice(Date().toISOString(), 0, 10),
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: t("coach.sidebar.main") },
      {
        url: "/coach/programs",
        title: t("coach.sidebar.programs", { defaultValue: "Programs" }),
      },
    ]);
  }, [setBreadcrumbs, t]);

  const openCreate = React.useCallback(() => {
    setEditingProgram(null);
    setForm(buildInitialForm());
    setEditorOpen(true);
  }, []);

  const openEdit = React.useCallback((program) => {
    setEditingProgram(program);
    setForm(buildInitialForm(program));
    setEditorOpen(true);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const payload = normalizeProgramPayload(form);

    if (!payload.title) {
      toast.error(
        t("coach.programs.toasts.titleRequired", {
          defaultValue: "Program title is required.",
        }),
      );
      return;
    }

    try {
      if (get(editingProgram, "id")) {
        await updateProgram(editingProgram.id, payload);
        toast.success(
          t("coach.programs.toasts.updated", {
            defaultValue: "Program updated.",
          }),
        );
      } else {
        await createProgram(payload);
        toast.success(
          t("coach.programs.toasts.created", {
            defaultValue: "Program created.",
          }),
        );
      }

      setEditorOpen(false);
      setEditingProgram(null);
      setForm(buildInitialForm());
    } catch (error) {
      toast.error(
        t("coach.programs.toasts.saveError", {
          defaultValue: "Could not save program.",
        }),
      );
    }
  }, [createProgram, editingProgram, form, t, updateProgram]);

  const openAssign = React.useCallback((program) => {
    setAssigningProgram(program);
    setSelectedClientIds([]);
    setSelectedGroupId("");
    setStartDate(new slice(Date().toISOString(), 0, 10));
    setAssignOpen(true);
  }, []);

  const handleAssign = React.useCallback(async () => {
    if (!get(assigningProgram, "id")) return;

    if (isEmpty(selectedClientIds) && !selectedGroupId) {
      toast.error(
        t("coach.programs.toasts.assignTargetRequired", {
          defaultValue: "Select at least one client or group.",
        }),
      );
      return;
    }

    try {
      await assignProgram(assigningProgram.id, {
        clientIds: selectedClientIds,
        groupId: selectedGroupId || undefined,
        startDate: startDate || undefined,
      });
      toast.success(
        t("coach.programs.toasts.assigned", {
          defaultValue: "Program assigned.",
        }),
      );
      setAssignOpen(false);
    } catch (error) {
      toast.error(
        t("coach.programs.toasts.assignError", {
          defaultValue: "Could not assign program.",
        }),
      );
    }
  }, [
    assignProgram,
    assigningProgram,
    selectedClientIds,
    selectedGroupId,
    startDate,
    t,
  ]);

  const handleDuplicate = React.useCallback(
    async (programId) => {
      try {
        await duplicateProgram(programId);
        toast.success(
          t("coach.programs.toasts.duplicated", {
            defaultValue: "Program duplicated.",
          }),
        );
      } catch (error) {
        toast.error(
          t("coach.programs.toasts.duplicateError", {
            defaultValue: "Could not duplicate program.",
          }),
        );
      }
    },
    [duplicateProgram, t],
  );

  const handleArchive = React.useCallback(
    async (programId) => {
      try {
        await archiveProgram(programId);
        toast.success(
          t("coach.programs.toasts.archived", {
            defaultValue: "Program archived.",
          }),
        );
      } catch (error) {
        toast.error(
          t("coach.programs.toasts.archiveError", {
            defaultValue: "Could not archive program.",
          }),
        );
      }
    },
    [archiveProgram, t],
  );

  const handleAdvanceAssignment = React.useCallback(
    async (program, assignment, nextWeek) => {
      const completedWeeks = uniq([...(assignment.completedWeeks || []), assignment.currentWeek]);

      await updateProgramProgress(program.id, assignment.id, {
        currentWeek: nextWeek,
        completedWeeks,
      });
      toast.success("Program progress updated.");
    },
    [updateProgramProgress],
  );

  const handleCompleteAssignment = React.useCallback(
    async (program, assignment) => {
      await updateProgramProgress(program.id, assignment.id, {
        currentWeek: program.durationWeeks,
        completedWeeks: times(program.durationWeeks, (index) => index + 1),
        status: "COMPLETED",
      });
      toast.success("Program completed.");
    },
    [updateProgramProgress],
  );

  if (isError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetch} />
      </PageTransition>
    );
  }

  return (
    <>
      <PageTransition>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <ClipboardListIcon className="size-6" />
                {t("coach.programs.title", {
                  defaultValue: "Program Builder",
                })}
              </h1>
              <p className="text-muted-foreground">
                {t("coach.programs.subtitle", {
                  defaultValue:
                    "Unify meal plans, workouts, tasks, and check-ins into reusable coaching programs.",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RotateCcwIcon
                  className={cn("size-4", isFetching && "animate-spin")}
                />
              </Button>
              <Button onClick={openCreate}>
                <PlusIcon data-icon="inline-start" />
                {t("coach.programs.actions.create", {
                  defaultValue: "Create program",
                })}
              </Button>
            </div>
          </div>

          <div className="grid gap-5">
            {map(programs, (program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onEdit={openEdit}
                onAssign={openAssign}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onAdvanceAssignment={handleAdvanceAssignment}
                onCompleteAssignment={handleCompleteAssignment}
                isUpdatingProgress={isUpdatingProgress}
              />
            ))}
          </div>
        </div>
      </PageTransition>

      <ProgramEditorDrawer
        open={editorOpen}
        onOpenChange={setEditorOpen}
        form={form}
        setForm={setForm}
        editingProgram={editingProgram}
        mealPlans={mealPlans}
        workoutPlans={workoutPlans}
        onSubmit={handleSubmit}
        isSaving={isCreating || isUpdating}
      />

      <ProgramAssignDrawer
        open={assignOpen}
        onOpenChange={setAssignOpen}
        program={assigningProgram}
        clients={clients}
        groups={groups}
        selectedClientIds={selectedClientIds}
        setSelectedClientIds={setSelectedClientIds}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        startDate={startDate}
        setStartDate={setStartDate}
        onSubmit={handleAssign}
        isAssigning={isAssigning}
      />

      {(isDuplicating || isArchiving) && (
        <span className="sr-only">Program mutation in progress</span>
      )}
    </>
  );
};

export default CoachProgramsContainer;
