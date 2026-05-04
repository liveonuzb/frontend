import { includes, filter } from "lodash";
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
  waterHabits: "",
  foodBudget: "",
  budgetPeriod: "weekly",
  budgetCurrency: "UZS",
  workoutLocation: "home",
  equipmentIds: [],
  customEquipment: [],
  workoutBodyPartIds: [],
  customWorkoutBodyParts: [],
  preferredExerciseIds: [],
  dislikedExerciseIds: [],
  customPreferredExercises: [],
  customDislikedExercises: [],
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
  coachCategory: null,
  coachCategories: [],
  targetAudience: [],
  availability: {
    monday: { from: "09:00", to: "18:00", enabled: true },
    tuesday: { from: "09:00", to: "18:00", enabled: true },
    wednesday: { from: "09:00", to: "18:00", enabled: true },
    thursday: { from: "09:00", to: "18:00", enabled: true },
    friday: { from: "09:00", to: "18:00", enabled: true },
    saturday: { from: "", to: "", enabled: false },
    sunday: { from: "", to: "", enabled: false },
  },
  experience: "",
  specializations: [],
  certificationType: "",
  certificationNumber: "",
  certificateFiles: [],
  coachLanguages: [],
  coachCity: "",
  coachWorkMode: "",
  coachWorkplace: "",
  coachMonthlyPrice: "",
  coachMinMonthlyPrice: "",
  coachMaxMonthlyPrice: "",
  coachBio: "",
  coachAvatar: "",
  wantsMarketplaceListing: false,
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

        setCoachCategory: (category) => {
          set(() => ({ coachCategory: category }));
        },

        toggleCoachCategory: (category) => {
          set((state) => {
            const current = state.coachCategories ?? [];
            const exists = includes(current, category);
            return {
              coachCategories: exists
                ? filter(current, (c) => c !== category)
                : [...current, category],
            };
          });
        },

        setTargetAudience: (audience) => {
          set(() => ({ targetAudience: audience }));
        },

        setAvailability: (availability) => {
          set(() => ({ availability }));
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
