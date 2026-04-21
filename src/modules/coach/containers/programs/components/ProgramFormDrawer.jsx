import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  filter,
  find,
  get,
  isArray,
  join,
  map,
  slice,
  split,
  times,
  trim,
  toUpper,
} from "lodash";
import { toast } from "sonner";
import { Link } from "react-router";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCoachProgram,
  useCoachProgramsMutations,
} from "@/modules/coach/lib/hooks/useCoachPrograms";
import { useCoachMealPlans } from "@/modules/coach/lib/hooks/useCoachMealPlans";
import { useCoachWorkoutPlans } from "@/modules/coach/lib/hooks/useCoachWorkoutPlans";

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
      get(firstTask, "targetValue") !== undefined &&
      get(firstTask, "targetValue") !== null
        ? String(firstTask.targetValue)
        : "",
    taskTargetUnit: get(firstTask, "targetUnit") || "",
    taskDueDayOffset:
      get(firstTask, "dueDayOffset") !== undefined &&
      get(firstTask, "dueDayOffset") !== null
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

const normalizeProgramPayload = (data) => {
  const durationWeeks = Number(data.durationWeeks);
  const weeks = isArray(data.weeks) ? data.weeks : [];

  return {
    title: trim(data.title),
    description: trim(data.description),
    durationWeeks,
    status: data.status,
    tags: filter(map(split(data.tags, ","), (tag) => trim(tag)), Boolean),
    weeks: map(slice(weeks, 0, durationWeeks), (week, index) => {
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

const weekSchema = z.object({
  weekNumber: z.number(),
  title: z.string(),
  description: z.string(),
  mealPlanTemplateId: z.string(),
  workoutPlanTemplateId: z.string(),
  taskTitle: z.string(),
  taskType: z.string(),
  taskTargetValue: z.string(),
  taskTargetUnit: z.string(),
  taskDueDayOffset: z.string(),
  checkInTitle: z.string(),
  checkInNote: z.string(),
  checkInDayOffset: z.string(),
  notes: z.string(),
});

const programSchema = z.object({
  title: z.string().min(1, "Dastur nomini kiriting"),
  description: z.string().optional().default(""),
  durationWeeks: z.number().int().positive(),
  status: z.string(),
  tags: z.string().optional().default(""),
  weeks: z.array(weekSchema),
});

const WeekCard = React.memo(({ week, index, mealPlans, workoutPlans, onUpdate }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Badge variant="secondary" className="rounded-full">
          Week {week.weekNumber}
        </Badge>
        {week.title || `Week ${week.weekNumber}`}
      </CardTitle>
      <CardDescription>
        Shablonlarni, bitta asosiy topshiriqni va haftalik tekshiruvni tanlang.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor={`week-${index}-title`}
            className="mb-1.5 block text-sm font-medium"
          >
            Hafta sarlavhasi
          </label>
          <Input
            id={`week-${index}-title`}
            value={week.title}
            onChange={(e) => onUpdate(index, "title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Ovqatlanish shabloni
            </label>
            <Select
              value={week.mealPlanTemplateId || EMPTY_OPTION}
              onValueChange={(value) =>
                onUpdate(
                  index,
                  "mealPlanTemplateId",
                  value === EMPTY_OPTION ? "" : value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Shablon yo'q" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={EMPTY_OPTION}>Shablon yo&apos;q</SelectItem>
                  {map(mealPlans, (plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Mashq shabloni
            </label>
            <Select
              value={week.workoutPlanTemplateId || EMPTY_OPTION}
              onValueChange={(value) =>
                onUpdate(
                  index,
                  "workoutPlanTemplateId",
                  value === EMPTY_OPTION ? "" : value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Shablon yo'q" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={EMPTY_OPTION}>Shablon yo&apos;q</SelectItem>
                  {map(workoutPlans, (plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name ?? plan.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor={`week-${index}-task`}
                className="mb-1.5 block text-sm font-medium"
              >
                Asosiy topshiriq
              </label>
              <Input
                id={`week-${index}-task`}
                value={week.taskTitle}
                onChange={(e) => onUpdate(index, "taskTitle", e.target.value)}
                placeholder="Kunlik qadamlar, suv, ovqat logi..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Topshiriq turi
                </label>
                <Select
                  value={week.taskType}
                  onValueChange={(value) =>
                    onUpdate(index, "taskType", value)
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
              </div>
              <div>
                <label
                  htmlFor={`week-${index}-target`}
                  className="mb-1.5 block text-sm font-medium"
                >
                  Maqsad
                </label>
                <Input
                  id={`week-${index}-target`}
                  inputMode="numeric"
                  value={week.taskTargetValue}
                  onChange={(e) =>
                    onUpdate(index, "taskTargetValue", e.target.value)
                  }
                  placeholder="8000"
                />
              </div>
              <div>
                <label
                  htmlFor={`week-${index}-unit`}
                  className="mb-1.5 block text-sm font-medium"
                >
                  Birlik
                </label>
                <Input
                  id={`week-${index}-unit`}
                  value={week.taskTargetUnit}
                  onChange={(e) =>
                    onUpdate(index, "taskTargetUnit", e.target.value)
                  }
                  placeholder="qadam"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor={`week-${index}-checkin-title`}
              className="mb-1.5 block text-sm font-medium"
            >
              Tekshiruv sarlavhasi
            </label>
            <Input
              id={`week-${index}-checkin-title`}
              value={week.checkInTitle}
              onChange={(e) =>
                onUpdate(index, "checkInTitle", e.target.value)
              }
              placeholder="Haftalik tekshiruv"
            />
          </div>
          <div>
            <label
              htmlFor={`week-${index}-checkin-day`}
              className="mb-1.5 block text-sm font-medium"
            >
              Tekshiruv kuni (0-6)
            </label>
            <Input
              id={`week-${index}-checkin-day`}
              inputMode="numeric"
              value={week.checkInDayOffset}
              onChange={(e) =>
                onUpdate(index, "checkInDayOffset", e.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`week-${index}-notes`}
            className="mb-1.5 block text-sm font-medium"
          >
            Trener izohlar
          </label>
          <Textarea
            id={`week-${index}-notes`}
            value={week.notes}
            onChange={(e) => onUpdate(index, "notes", e.target.value)}
            className="min-h-20 resize-none"
          />
        </div>
      </div>
    </CardContent>
  </Card>
));

WeekCard.displayName = "WeekCard";

const ProgramFormDrawer = ({ mode, programId, open, onOpenChange }) => {
  const isEdit = mode === "edit";
  const mutations = useCoachProgramsMutations();

  const { data: programData, isLoading: isProgramLoading } = useCoachProgram(
    isEdit ? programId : null,
  );
  const program =
    get(programData, "data.data", null) || get(programData, "data", null);

  const { data: mealPlansData } = useCoachMealPlans({ pageSize: 100 });
  const mealPlans = get(mealPlansData, "data.data", []);

  const { data: workoutPlansData } = useCoachWorkoutPlans({ pageSize: 100 });
  const workoutPlans = get(workoutPlansData, "data.data", []);

  const defaultValues = React.useMemo(
    () => ({
      title: "",
      description: "",
      durationWeeks: 8,
      status: "DRAFT",
      tags: "",
      weeks: buildWeeks(8),
    }),
    [],
  );

  const form = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isEdit && program) {
      const durationWeeks = Number(get(program, "durationWeeks") || 8);
      form.reset({
        title: get(program, "title") || "",
        description: get(program, "description") || "",
        durationWeeks,
        status: toUpper(get(program, "status") || "DRAFT"),
        tags: isArray(get(program, "tags"))
          ? join(program.tags, ", ")
          : "",
        weeks: buildWeeks(durationWeeks, get(program, "weeks") || []),
      });
    } else if (!isEdit) {
      form.reset(defaultValues);
    }
  }, [isEdit, program, form, defaultValues]);

  const watchedWeeks = form.watch("weeks");
  const watchedDuration = form.watch("durationWeeks");

  const updateWeek = React.useCallback(
    (weekIndex, field, value) => {
      const current = form.getValues("weeks");
      const updated = map(current, (week, index) =>
        index === weekIndex ? { ...week, [field]: value } : week,
      );
      form.setValue("weeks", updated, { shouldDirty: true });
    },
    [form],
  );

  const handleDurationChange = React.useCallback(
    (value) => {
      const durationWeeks = Number(value);
      const currentWeeks = form.getValues("weeks");
      form.setValue("durationWeeks", durationWeeks, { shouldDirty: true });
      form.setValue("weeks", buildWeeks(durationWeeks, currentWeeks), {
        shouldDirty: true,
      });
    },
    [form],
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    const payload = normalizeProgramPayload(data);

    try {
      if (isEdit && programId) {
        await mutations.updateResource(programId, payload);
        toast.success("Dastur yangilandi");
      } else {
        await mutations.createResource(payload);
        toast.success("Yangi dastur yaratildi");
      }
      onOpenChange(false);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
    }
  });

  const isSaving = mutations.createMutation.isPending || mutations.updateMutation.isPending;
  const isLoadingContent = isEdit && isProgramLoading;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[92vh] max-w-6xl rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {isEdit ? "Dasturni tahrirlash" : "Yangi dastur"}
          </DrawerTitle>
          <DrawerDescription>
            Ovqatlanish rejalari, mashqlar, topshiriqlar va tekshiruvlarni
            haftama-hafta birlashtiring.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto px-6">
          {isLoadingContent ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : (
            <Form {...form}>
              <form
                id="program-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
                    <CardDescription>
                      Dasturni qayta ishlatish mumkin bo&apos;lishi uchun
                      umumiy ma&apos;lumotlarni kiriting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Sarlavha <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="8 haftalik reset"
                                className="rounded-xl h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="durationWeeks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Davomiylik</FormLabel>
                            <FormControl>
                              <Select
                                value={String(field.value)}
                                onValueChange={handleDurationChange}
                              >
                                <SelectTrigger className="w-full rounded-xl h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {map(DURATION_OPTIONS, (weekCount) => (
                                      <SelectItem
                                        key={weekCount}
                                        value={String(weekCount)}
                                      >
                                        {weekCount} hafta
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Holat</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full rounded-xl h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="DRAFT">Qoralama</SelectItem>
                                    <SelectItem value="ACTIVE">Faol</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teglar</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="yog-yoqotish, boshlang'ich, uy"
                                className="rounded-xl h-11"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Vergul bilan ajratilgan belgilar.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Ta&apos;rif</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="rounded-xl min-h-24 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  {map(watchedWeeks, (week, index) => (
                    <WeekCard
                      key={week.weekNumber}
                      week={week}
                      index={index}
                      mealPlans={mealPlans}
                      workoutPlans={workoutPlans}
                      onUpdate={updateWeek}
                    />
                  ))}
                </div>
              </form>
            </Form>
          )}
        </DrawerBody>

        <DrawerFooter className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:justify-between border-t">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/coach/meal-plans">Ovqatlanish rejalari</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/coach/workout-plans">Mashq rejalari</Link>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              form="program-form"
              disabled={isSaving || isLoadingContent}
            >
              {isSaving
                ? "Saqlanmoqda..."
                : isEdit
                  ? "Saqlash"
                  : "Yaratish"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ProgramFormDrawer;
