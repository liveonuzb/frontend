import { get, map } from "lodash";

export const WORKOUT_GOALS = [
  { value: "muscle_building", label: "Mushak qurish" },
  { value: "fat_loss", label: "Yog' yoqish" },
  { value: "strength", label: "Kuch oshirish" },
  { value: "general_fitness", label: "Umumiy fitness" },
];

export const WORKOUT_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const EQUIPMENT_MODES = [
  { value: "bodyweight", label: "Uskunasiz" },
  { value: "with_equipment", label: "Uskuna bilan" },
  { value: "gym", label: "Gym" },
];

export const calculateOneRepMax = (weightKg, reps) => {
  const weight = Number(weightKg) || 0;
  const repCount = Number(reps) || 0;

  if (weight <= 0 || repCount <= 0) {
    return 0;
  }

  return Math.floor(weight * (1 + repCount / 30));
};

export const buildGenerateWorkoutPlanPayload = ({
  name,
  coverImageUrl,
  goal,
  level,
  days,
  daysPerWeek,
  equipmentMode,
  selectedEquipmentIds,
  focusMuscleIds,
  benchmarkExercise,
  benchmarkWeight,
  benchmarkReps,
  caloriesGoal,
  benchmarkEnabled = true,
}) => {
  const oneRepMaxKg = calculateOneRepMax(benchmarkWeight, benchmarkReps);

  const payload = {
    name: name?.trim() || "My Upper Body Day",
    coverImageUrl: coverImageUrl?.trim() || undefined,
    goal,
    level,
    days: Number(days) || 28,
    daysPerWeek: Number(daysPerWeek) || 4,
    equipmentMode,
    selectedEquipmentIds: map(selectedEquipmentIds, Number),
    focusMuscleIds: map(focusMuscleIds, Number),
    caloriesGoal: Number(caloriesGoal) || 2400,
  };

  if (benchmarkEnabled) {
    payload.benchmark = {
      exerciseName: benchmarkExercise || "Bench Press",
      weightKg: Number(benchmarkWeight) || 0,
      reps: Number(benchmarkReps) || 1,
      oneRepMaxKg,
    };
  }

  return payload;
};

export const getGeneratedPlanSavePayload = (preview) => ({
  name: get(preview, "name", "AI workout reja"),
  description: get(preview, "description", ""),
  coverImageUrl: get(preview, "coverImageUrl", null),
  difficulty: get(preview, "difficulty", "beginner"),
  days: get(preview, "days", 28),
  daysPerWeek: get(preview, "daysPerWeek", 4),
  schedule: get(preview, "schedule", []),
  generationMeta: get(preview, "generationMeta", null),
  source: "ai",
});
