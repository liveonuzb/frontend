import React from "react";
import { filter, get, map, trim } from "lodash";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckIcon,
  LoaderCircleIcon,
  MinusIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useCreateWorkoutPlan,
  useGenerateWorkoutPlan,
  useWorkoutCatalog,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import {
  buildGenerateWorkoutPlanPayload,
  calculateOneRepMax,
  EQUIPMENT_MODES,
  getGeneratedPlanSavePayload,
  WORKOUT_GOALS,
  WORKOUT_LEVELS,
} from "../../workout-ai-flow";
import {
  buildWorkoutPlanMetaPayload,
} from "../../workout-plan-flow";

const FALLBACK_EQUIPMENT = [
  { id: 1, name: "Barbell" },
  { id: 2, name: "Dumbbell" },
  { id: 3, name: "Cable Machine" },
  { id: 4, name: "Flat Bench" },
  { id: 5, name: "Lat Machine" },
  { id: 6, name: "Leg Press" },
];

const FALLBACK_MUSCLES = [
  { id: 1, name: "Chest" },
  { id: 2, name: "Back" },
  { id: 3, name: "Shoulder" },
  { id: 4, name: "Arms" },
  { id: 5, name: "Legs" },
  { id: 6, name: "Full Body" },
];

const normalizeCatalogItems = (items, fallback) =>
  get(items, "length") > 0
    ? map(items, (item) => ({
        id: Number(get(item, "id")),
        name: get(item, "name") || get(item, "title") || `#${get(item, "id")}`,
      }))
    : fallback;

const toggleId = (items, id, checked) =>
  checked ? [...items, id] : filter(items, (itemId) => itemId !== id);

const CreateWorkoutPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const initialPlan = get(location, "state.initialPlan", null);
  const createPlanMutation = useCreateWorkoutPlan();
  const generateMutation = useGenerateWorkoutPlan();
  const { catalog } = useWorkoutCatalog();
  const [createMode, setCreateMode] = React.useState("manual");
  const equipmentOptions = React.useMemo(
    () =>
      normalizeCatalogItems(
        get(catalog, "equipments", get(catalog, "equipment", [])),
        FALLBACK_EQUIPMENT,
      ),
    [catalog],
  );
  const muscleOptions = React.useMemo(
    () => normalizeCatalogItems(get(catalog, "muscles", []), FALLBACK_MUSCLES),
    [catalog],
  );
  const [manualName, setManualName] = React.useState(
    get(initialPlan, "name", ""),
  );
  const [manualDescription, setManualDescription] = React.useState(
    get(initialPlan, "description", ""),
  );
  const [aiPreview, setAiPreview] = React.useState(null);
  const hasSeededCatalog = React.useRef(false);
  const [aiForm, setAiForm] = React.useState({
    name: get(initialPlan, "name", "My Upper Body Day"),
    goal: "muscle_building",
    level: "beginner",
    daysPerWeek: 4,
    equipmentMode: "gym",
    selectedEquipmentIds: [],
    focusMuscleIds: [],
    benchmarkExercise: "Bench Press",
    benchmarkWeight: 40,
    benchmarkReps: 5,
    caloriesGoal: 2400,
  });
  const oneRepMaxKg = calculateOneRepMax(
    get(aiForm, "benchmarkWeight"),
    get(aiForm, "benchmarkReps"),
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
      { url: "/user/workout/plans/create", title: "Yangi reja" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (hasSeededCatalog.current) {
      return;
    }

    hasSeededCatalog.current = true;
    setAiForm((current) => ({
      ...current,
      selectedEquipmentIds: map(equipmentOptions.slice(0, 4), "id"),
      focusMuscleIds: map(muscleOptions.slice(0, 3), "id"),
    }));
  }, [equipmentOptions, muscleOptions]);

  const updateAiForm = (key, value) => {
    setAiForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleManualSubmit = async () => {
    const normalizedName = trim(manualName);

    if (!normalizedName) {
      toast.error("Reja nomini kiriting");
      return;
    }

    try {
      const createdPlan = await createPlanMutation.createPlan(
        buildWorkoutPlanMetaPayload({
          basePlan: initialPlan,
          name: normalizedName,
          description: manualDescription,
        }),
      );

      if (!get(createdPlan, "id")) {
        return;
      }

      navigate(`/user/workout/plans/edit/${get(createdPlan, "id")}`, {
        replace: true,
        state: {
          initialPlan: createdPlan,
          shouldActivateOnSave: true,
        },
      });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani yaratib bo'lmadi",
      );
    }
  };

  const handleGenerate = async () => {
    try {
      const preview = await generateMutation.generatePlan(
        buildGenerateWorkoutPlanPayload(aiForm),
      );
      setAiPreview(preview);
      toast.success("AI workout reja tayyor");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "AI workout reja yaratib bo'lmadi",
      );
    }
  };

  const handleSavePreview = async () => {
    if (!aiPreview) {
      return;
    }

    try {
      const createdPlan = await createPlanMutation.createPlan(
        getGeneratedPlanSavePayload(aiPreview),
      );
      toast.success("AI workout reja saqlandi");
      navigate(`/user/workout/plans/${get(createdPlan, "id")}`, {
        replace: true,
      });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "AI workout rejani saqlab bo'lmadi",
      );
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6">
        <TrackingPageHeader
          title="Yangi workout reja"
          subtitle="Manual reja tuzing yoki AI yordamida tayyor reja yarating."
          hideTitleOnMobile={false}
          actions={
            <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
              <ArrowLeftIcon data-icon="inline-start" />
              Rejalarga qaytish
            </Button>
          }
        />

        <Tabs
          value={createMode}
          onValueChange={(value) => value && setCreateMode(value)}
          className="gap-4"
        >
          <TabsList>
            <TabsTrigger value="manual" onClick={() => setCreateMode("manual")}>
              Manual
            </TabsTrigger>
            <TabsTrigger value="ai" onClick={() => setCreateMode("ai")}>
              <SparklesIcon />
              AI Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Reja ma'lumotlari</CardTitle>
                <CardDescription>
                  Avval nom va izohni kiriting, keyin plan builder sahifasida
                  kunlar va mashqlarni qo'shasiz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="manual-plan-name">Plan nomi</FieldLabel>
                    <Input
                      id="manual-plan-name"
                      value={manualName}
                      onChange={(event) => setManualName(event.target.value)}
                      placeholder="Masalan: My Upper Body Day"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="manual-plan-description">
                      Izoh
                    </FieldLabel>
                    <Textarea
                      id="manual-plan-description"
                      value={manualDescription}
                      onChange={(event) => setManualDescription(event.target.value)}
                      placeholder="Reja maqsadi yoki qisqa tavsif"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending ? (
                    <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <PlusIcon data-icon="inline-start" />
                  )}
                  Keyingi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/user/workout/plans")}
                >
                  Bekor qilish
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Card>
                <CardHeader>
                  <CardTitle>AI plan sozlamalari</CardTitle>
                  <CardDescription>
                    Maqsad, daraja, jihoz va 1RM ma'lumotlari asosida reja tuziladi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="ai-plan-name">Plan nomi</FieldLabel>
                      <Input
                        id="ai-plan-name"
                        value={get(aiForm, "name")}
                        onChange={(event) => updateAiForm("name", event.target.value)}
                      />
                    </Field>

                    <FieldSet>
                      <FieldLegend>Maqsad</FieldLegend>
                      <ToggleGroup
                        type="single"
                        value={get(aiForm, "goal")}
                        onValueChange={(value) => value && updateAiForm("goal", value)}
                        variant="outline"
                        className="flex-wrap justify-start"
                      >
                        {map(WORKOUT_GOALS, (goal) => (
                          <ToggleGroupItem key={get(goal, "value")} value={get(goal, "value")}>
                            {get(goal, "label")}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>Daraja</FieldLegend>
                      <ToggleGroup
                        type="single"
                        value={get(aiForm, "level")}
                        onValueChange={(value) => value && updateAiForm("level", value)}
                        variant="outline"
                        className="flex-wrap justify-start"
                      >
                        {map(WORKOUT_LEVELS, (level) => (
                          <ToggleGroupItem key={get(level, "value")} value={get(level, "value")}>
                            {get(level, "label")}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FieldSet>

                    <Field>
                      <FieldLabel>Kunlar soni</FieldLabel>
                      <div className="flex max-w-xs items-center rounded-4xl border bg-input/30">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Kunlar sonini kamaytirish"
                          onClick={() =>
                            updateAiForm(
                              "daysPerWeek",
                              Math.max(1, Number(get(aiForm, "daysPerWeek")) - 1),
                            )
                          }
                        >
                          <MinusIcon />
                        </Button>
                        <div className="flex-1 text-center text-sm font-semibold">
                          {get(aiForm, "daysPerWeek")} kun
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Kunlar sonini oshirish"
                          onClick={() =>
                            updateAiForm(
                              "daysPerWeek",
                              Math.min(7, Number(get(aiForm, "daysPerWeek")) + 1),
                            )
                          }
                        >
                          <PlusIcon />
                        </Button>
                      </div>
                    </Field>

                    <FieldSet>
                      <FieldLegend>Uskuna</FieldLegend>
                      <ToggleGroup
                        type="single"
                        value={get(aiForm, "equipmentMode")}
                        onValueChange={(value) =>
                          value && updateAiForm("equipmentMode", value)
                        }
                        variant="outline"
                        className="flex-wrap justify-start"
                      >
                        {map(EQUIPMENT_MODES, (mode) => (
                          <ToggleGroupItem key={get(mode, "value")} value={get(mode, "value")}>
                            {get(mode, "label")}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>Tanlangan jihozlar</FieldLegend>
                      <FieldDescription>
                        {get(aiForm, "selectedEquipmentIds.length", 0)} ta jihoz tanlandi.
                      </FieldDescription>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {map(equipmentOptions, (item) => {
                          const checked = get(aiForm, "selectedEquipmentIds", []).includes(
                            get(item, "id"),
                          );

                          return (
                            <Field
                              key={get(item, "id")}
                              orientation="horizontal"
                              className="rounded-2xl border bg-background px-3 py-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  updateAiForm(
                                    "selectedEquipmentIds",
                                    toggleId(
                                      get(aiForm, "selectedEquipmentIds", []),
                                      get(item, "id"),
                                      Boolean(nextChecked),
                                    ),
                                  )
                                }
                              />
                              <FieldLabel className="w-full">
                                {get(item, "name")}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </div>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>Focus muscle groups</FieldLegend>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {map(muscleOptions, (item) => {
                          const checked = get(aiForm, "focusMuscleIds", []).includes(
                            get(item, "id"),
                          );

                          return (
                            <Field
                              key={get(item, "id")}
                              orientation="horizontal"
                              className="rounded-2xl border bg-background px-3 py-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  updateAiForm(
                                    "focusMuscleIds",
                                    toggleId(
                                      get(aiForm, "focusMuscleIds", []),
                                      get(item, "id"),
                                      Boolean(nextChecked),
                                    ),
                                  )
                                }
                              />
                              <FieldLabel className="w-full">
                                {get(item, "name")}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </div>
                    </FieldSet>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel>Benchmark</FieldLabel>
                        <Select
                          value={get(aiForm, "benchmarkExercise")}
                          onValueChange={(value) =>
                            updateAiForm("benchmarkExercise", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Mashq tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Bench Press">Bench Press</SelectItem>
                              <SelectItem value="Squat">Squat</SelectItem>
                              <SelectItem value="Deadlift">Deadlift</SelectItem>
                              <SelectItem value="Overhead Press">Overhead Press</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="benchmark-weight">When lifting</FieldLabel>
                        <Input
                          id="benchmark-weight"
                          type="number"
                          min="1"
                          value={get(aiForm, "benchmarkWeight")}
                          onChange={(event) =>
                            updateAiForm("benchmarkWeight", event.target.value)
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="benchmark-reps">Till tired I can do</FieldLabel>
                        <Input
                          id="benchmark-reps"
                          type="number"
                          min="1"
                          value={get(aiForm, "benchmarkReps")}
                          onChange={(event) =>
                            updateAiForm("benchmarkReps", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <SparklesIcon data-icon="inline-start" />
                    )}
                    {aiPreview ? "Regenerate" : "Generate plan"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Strength input</CardTitle>
                    <CardDescription>Epley formula asosida hisoblanadi.</CardDescription>
                    <CardAction>
                      <Badge variant="secondary">{oneRepMaxKg} kg 1RM</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {get(aiForm, "benchmarkWeight")} kg x{" "}
                      {get(aiForm, "benchmarkReps")} reps ={" "}
                      <span className="font-semibold text-foreground">
                        {oneRepMaxKg} kg
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Generate qilingandan keyin saqlash mumkin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiPreview ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="font-bold">{get(aiPreview, "name")}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {get(aiPreview, "description") || "AI generated workout plan"}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-2xl bg-muted/40 px-2 py-3">
                            <p className="font-black">{get(aiPreview, "daysPerWeek")}</p>
                            <p className="text-xs text-muted-foreground">kun</p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 px-2 py-3">
                            <p className="font-black">{get(aiPreview, "totalExercises", get(aiPreview, "schedule.length", 0))}</p>
                            <p className="text-xs text-muted-foreground">mashq</p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 px-2 py-3">
                            <p className="font-black">{get(aiForm, "caloriesGoal")}</p>
                            <p className="text-xs text-muted-foreground">kcal</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {map(get(aiPreview, "schedule", []).slice(0, 4), (day, index) => (
                            <div
                              key={`${get(day, "day")}-${index}`}
                              className="flex items-center justify-between rounded-2xl border bg-background px-3 py-2 text-sm"
                            >
                              <span className="font-medium">
                                DAY {index + 1} {get(day, "focus") || get(day, "day")}
                              </span>
                              <Badge variant="outline">
                                {get(day, "exercises.length", 0)} mashq
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-8 text-center">
                        <SparklesIcon className="mx-auto size-10 text-muted-foreground/40" />
                        <p className="mt-3 font-semibold">Preview hali yo'q</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Formani to'ldirib Generate plan tugmasini bosing.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      disabled={!aiPreview || createPlanMutation.isPending}
                      onClick={handleSavePreview}
                    >
                      <SaveIcon data-icon="inline-start" />
                      Saqlash
                    </Button>
                    {aiPreview ? (
                      <Badge variant="outline">
                        <CheckIcon />
                        Unsaved preview
                      </Badge>
                    ) : null}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default CreateWorkoutPlanPage;
