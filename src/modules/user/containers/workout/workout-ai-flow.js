import get from "lodash/get";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

export const WORKOUT_GOALS = [
  {
    value: "muscle_building",
    label: "Mushak qurish",
    labelKey: "user.workout.planCreate.goals.muscleBuilding",
  },
  {
    value: "fat_loss",
    label: "Yog' yoqish",
    labelKey: "user.workout.planCreate.goals.fatLoss",
  },
  {
    value: "strength",
    label: "Kuch oshirish",
    labelKey: "user.workout.planCreate.goals.strength",
  },
  {
    value: "general_fitness",
    label: "Umumiy fitness",
    labelKey: "user.workout.planCreate.goals.generalFitness",
  },
];

export const WORKOUT_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    labelKey: "user.workout.planCreate.levels.beginner",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    labelKey: "user.workout.planCreate.levels.intermediate",
  },
  {
    value: "advanced",
    label: "Advanced",
    labelKey: "user.workout.planCreate.levels.advanced",
  },
];

export const EQUIPMENT_MODES = [
  {
    value: "bodyweight",
    label: "Uskunasiz",
    labelKey: "user.workout.planCreate.equipmentModes.bodyweight",
  },
  {
    value: "with_equipment",
    label: "Uskuna bilan",
    labelKey: "user.workout.planCreate.equipmentModes.withEquipment",
  },
  {
    value: "gym",
    label: "Gym",
    labelKey: "user.workout.planCreate.equipmentModes.gym",
  },
];

export const calculateOneRepMax = (weightKg, reps) => {
  const weight = toNumber(weightKg) || 0;
  const repCount = toNumber(reps) || 0;

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
    name: trim(name) || "My Upper Body Day",
    coverImageUrl: trim(coverImageUrl) || undefined,
    goal,
    level,
    days: toNumber(days) || 28,
    daysPerWeek: toNumber(daysPerWeek) || 4,
    equipmentMode,
    selectedEquipmentIds: map(selectedEquipmentIds, Number),
    focusMuscleIds: map(focusMuscleIds, Number),
    caloriesGoal: toNumber(caloriesGoal) || 2400,
  };

  if (benchmarkEnabled) {
    payload.benchmark = {
      exerciseName: benchmarkExercise || "Bench Press",
      weightKg: toNumber(benchmarkWeight) || 0,
      reps: toNumber(benchmarkReps) || 1,
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
