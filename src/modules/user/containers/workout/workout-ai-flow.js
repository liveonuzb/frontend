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
  goal,
  level,
  daysPerWeek,
  equipmentMode,
  selectedEquipmentIds,
  focusMuscleIds,
  benchmarkExercise,
  benchmarkWeight,
  benchmarkReps,
  caloriesGoal,
}) => {
  const oneRepMaxKg = calculateOneRepMax(benchmarkWeight, benchmarkReps);

  return {
    name: name?.trim() || "My Upper Body Day",
    goal,
    level,
    daysPerWeek: Number(daysPerWeek) || 4,
    equipmentMode,
    selectedEquipmentIds: map(selectedEquipmentIds, Number),
    focusMuscleIds: map(focusMuscleIds, Number),
    benchmark: {
      exerciseName: benchmarkExercise || "Bench Press",
      weightKg: Number(benchmarkWeight) || 0,
      reps: Number(benchmarkReps) || 1,
      oneRepMaxKg,
    },
    caloriesGoal: Number(caloriesGoal) || 2400,
  };
};

export const getGeneratedPlanSavePayload = (preview) => ({
  name: get(preview, "name", "AI workout reja"),
  description: get(preview, "description", ""),
  difficulty: get(preview, "difficulty", "beginner"),
  days: get(preview, "days", 28),
  daysPerWeek: get(preview, "daysPerWeek", 4),
  schedule: get(preview, "schedule", []),
  generationMeta: get(preview, "generationMeta", null),
  source: "ai",
});
