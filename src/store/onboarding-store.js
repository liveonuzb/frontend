import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";

const createInitialState = () => ({
  firstName: "",
  lastName: "",
  gender: "",
  age: "",
  height: { value: "", unit: "cm" },
  currentWeight: { value: "", unit: "kg" },
  goal: "",
  weightGoal: "",
  goals: [],
  targetWeight: { value: "", unit: "kg" },
  weeklyPace: 0.5,
  activityLevel: "",
  weeklyWorkoutCount: "",
  workoutExperience: "",
  sleepHours: "",
  workType: "",
  fastFoodFrequency: "",
  sweetDrinkHabit: "",
  cookingTime: "",
  cookingAccess: "",
  mealFrequency: "",
  foodBudget: "",
  foodBudgetTier: null,
  budgetPeriod: "weekly",
  budgetCurrency: "UZS",
  workoutLocation: "home",
  equipmentIds: [],
  customEquipment: [],
  workoutBodyPartIds: [],
  customWorkoutBodyParts: [],
  completedUserOnboardingSteps: [],
  allergyIds: [],
  allergyIngredientIds: [],
  customAllergies: [],
  dietRequirementIds: [],
  customDietRequirements: [],
  preferredCuisineIds: [],
  customPreferredCuisines: [],
  dislikedFoodIds: [],
  customDislikedFoods: [],
  preferredIngredientIds: [],
  customPreferredIngredients: [],
  dislikedIngredientIds: [],
  customDislikedIngredients: [],
  nutritionPreferenceKeys: [],
  allergyOtherText: "",
  dislikedOtherText: "",
  nutritionPreferenceOtherText: "",
  dietRestrictions: [],
  healthConstraints: [],
  customHealthConstraints: [],
  injurySeverity: "",
  forbiddenExercises: [],
  medications: "",
  supplements: "",
  playsFootball: false,
  cardioLevel: "",
  notificationPreference: "",
  lastVisitedPath: "",
  draftSaveStatus: "idle",
  draftLastSavedAt: null,
  draftSaveError: null,
});

const useOnboardingStore = create()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...createInitialState(),

        setField: (field, value) => {
          set(() => ({ [field]: value }));
        },

        setFields: (fields) => {
          set((state) => ({ ...state, ...fields }));
        },

        setLastVisitedPath: (path) => {
          set(() => ({ lastVisitedPath: path }));
        },

        setDraftSaveStatus: (status, details = {}) => {
          set(() => ({
            draftSaveStatus: status,
            draftLastSavedAt:
              details.lastSavedAt !== undefined ? details.lastSavedAt : null,
            draftSaveError: details.error !== undefined ? details.error : null,
          }));
        },

        reset: () => {
          set(() => createInitialState());
        },
      }),
      {
        name: "onboarding-storage",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);

export default useOnboardingStore;
