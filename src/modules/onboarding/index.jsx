import React from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";

// User onboarding imports
import EntryPage from "@/modules/onboarding/user/pages/entry/index.jsx";
import NamePage from "@/modules/onboarding/user/pages/name/index.jsx";
import GenderPage from "@/modules/onboarding/user/pages/gender/index.jsx";
import HealthConstraintsPage from "@/modules/onboarding/user/pages/health-constraints/index.jsx";
import AgePage from "@/modules/onboarding/user/pages/age/index.jsx";
import HeightPage from "@/modules/onboarding/user/pages/height/index.jsx";
import CurrentWeightPage from "@/modules/onboarding/user/pages/current-weight/index.jsx";
import GoalPage from "@/modules/onboarding/user/pages/goal/index.jsx";
import OtherGoalsPage from "@/modules/onboarding/user/pages/other-goals/index.jsx";
import TargetWeightPage from "@/modules/onboarding/user/pages/target-weight/index.jsx";
import WeeklyPacePage from "@/modules/onboarding/user/pages/weekly-pace/index.jsx";
import ActivityLevelPage from "@/modules/onboarding/user/pages/activity-level/index.jsx";
import WeeklyWorkoutCountPage from "@/modules/onboarding/user/pages/weekly-workout-count/index.jsx";
import WorkoutExperiencePage from "@/modules/onboarding/user/pages/workout-experience/index.jsx";
import WorkoutLocationPage from "@/modules/onboarding/user/pages/workout-location/index.jsx";
import WorkoutEquipmentPage from "@/modules/onboarding/user/pages/workout-equipment/index.jsx";
import WorkoutBodyPartsPage from "@/modules/onboarding/user/pages/workout-body-parts/index.jsx";
import ExercisePreferencesPage from "@/modules/onboarding/user/pages/exercise-preferences/index.jsx";
import PreferredExercisesPage from "@/modules/onboarding/user/pages/preferred-exercises/index.jsx";
import DislikedExercisesPage from "@/modules/onboarding/user/pages/disliked-exercises/index.jsx";
import MealFrequencyPage from "@/modules/onboarding/user/pages/meal-frequency/index.jsx";
import WaterHabitsPage from "@/modules/onboarding/user/pages/water-habits/index.jsx";
import FoodBudgetPage from "@/modules/onboarding/user/pages/food-budget/index.jsx";
import AllergiesPage from "@/modules/onboarding/user/pages/allergies/index.jsx";
import DietRequirementsPage from "@/modules/onboarding/user/pages/diet-requirements/index.jsx";
import PreferredCuisinesPage from "@/modules/onboarding/user/pages/preferred-cuisines/index.jsx";
import DislikedFoodsPage from "@/modules/onboarding/user/pages/disliked-foods/index.jsx";
import PreferredIngredientsPage from "@/modules/onboarding/user/pages/preferred-ingredients/index.jsx";
import DislikedIngredientsPage from "@/modules/onboarding/user/pages/disliked-ingredients/index.jsx";
import ReviewPage from "@/modules/onboarding/user/pages/review/index.jsx";
import ReportPage from "@/modules/onboarding/user/pages/report/index.jsx";
import PersonalizingPage from "@/modules/onboarding/user/pages/personalizing/index.jsx";
import PersonalizationResultPage from "@/modules/onboarding/user/pages/result/index.jsx";
import GeneratingPage from "@/modules/onboarding/user/pages/generating/index.jsx";

// Coach onboarding imports
import CoachEntryPage from "@/modules/onboarding/coach/pages/entry/index.jsx";
import CategoryPage from "@/modules/onboarding/coach/pages/category/index.jsx";
import ExperiencePage from "@/modules/onboarding/coach/pages/experience/index.jsx";
import SpecializationPage from "@/modules/onboarding/coach/pages/specialization/index.jsx";
import TargetAudiencePage from "@/modules/onboarding/coach/pages/target-audience/index.jsx";
import AvailabilityPage from "@/modules/onboarding/coach/pages/availability/index.jsx";
import CertificationPage from "@/modules/onboarding/coach/pages/certification/index.jsx";
import BioPage from "@/modules/onboarding/coach/pages/bio/index.jsx";
import PricingPage from "@/modules/onboarding/coach/pages/pricing/index.jsx";
import CoachLanguagesPage from "@/modules/onboarding/coach/pages/languages/index.jsx";
import CoachAvatarPage from "@/modules/onboarding/coach/pages/avatar/index.jsx";

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EntryPage />} />

        {/* User Onboarding Routes */}
        <Route path="name" element={<NamePage />} />
        <Route path="gender" element={<GenderPage />} />
        <Route path="health-constraints" element={<HealthConstraintsPage />} />
        <Route
          path="injury-severity"
          element={<Navigate to="../workout-location" replace />}
        />
        <Route
          path="forbidden-exercises"
          element={<Navigate to="../workout-location" replace />}
        />
        <Route
          path="medications"
          element={<Navigate to="../workout-location" replace />}
        />
        <Route
          path="supplements"
          element={<Navigate to="../workout-location" replace />}
        />
        <Route path="age" element={<AgePage />} />
        <Route path="height" element={<HeightPage />} />
        <Route path="current-weight" element={<CurrentWeightPage />} />
        <Route path="goal" element={<GoalPage />} />
        <Route path="other-goals" element={<OtherGoalsPage />} />
        <Route path="target-weight" element={<TargetWeightPage />} />
        <Route path="weekly-pace" element={<WeeklyPacePage />} />
        <Route path="activity-level" element={<ActivityLevelPage />} />
        <Route
          path="weekly-workout-count"
          element={<WeeklyWorkoutCountPage />}
        />
        <Route path="workout-experience" element={<WorkoutExperiencePage />} />
        <Route
          path="lifestyle"
          element={<Navigate to="../weekly-workout-count" replace />}
        />
        <Route path="workout-location" element={<WorkoutLocationPage />} />
        <Route path="workout-equipment" element={<WorkoutEquipmentPage />} />
        <Route path="workout-body-parts" element={<WorkoutBodyPartsPage />} />
        <Route
          path="exercise-preferences"
          element={<ExercisePreferencesPage />}
        />
        <Route
          path="preferred-exercises"
          element={<PreferredExercisesPage />}
        />
        <Route path="disliked-exercises" element={<DislikedExercisesPage />} />
        <Route path="meal-frequency" element={<MealFrequencyPage />} />
        <Route path="water-habits" element={<WaterHabitsPage />} />
        <Route path="food-budget" element={<FoodBudgetPage />} />
        <Route path="allergies" element={<AllergiesPage />} />
        <Route
          path="allergy-ingredients"
          element={<Navigate to="../allergies" replace />}
        />
        <Route path="diet-requirements" element={<DietRequirementsPage />} />
        <Route path="preferred-cuisines" element={<PreferredCuisinesPage />} />
        <Route path="disliked-foods" element={<DislikedFoodsPage />} />
        <Route
          path="preferred-ingredients"
          element={<PreferredIngredientsPage />}
        />
        <Route
          path="disliked-ingredients"
          element={<DislikedIngredientsPage />}
        />
        <Route path="review" element={<ReviewPage />} />
        <Route
          path="nutrition-preferences"
          element={<Navigate to="../diet-requirements" replace />}
        />
        <Route
          path="diet-restrictions"
          element={<Navigate to="../diet-requirements" replace />}
        />
        <Route path="report" element={<ReportPage />} />
        <Route path="personalizing" element={<PersonalizingPage />} />
        <Route path="personalizing/:jobId" element={<PersonalizingPage />} />
        <Route path="result" element={<PersonalizationResultPage />} />
        <Route path="generating" element={<GeneratingPage />} />
        <Route path="generating/:jobId" element={<GeneratingPage />} />

        <Route
          path="roles"
          element={<Navigate to="/coach/onboarding" replace />}
        />

        {/* Coach Onboarding Routes */}
        <Route path="coach" element={<CoachEntryPage />} />
        <Route path="coach/category" element={<CategoryPage />} />
        <Route path="coach/experience" element={<ExperiencePage />} />
        <Route path="coach/specialization" element={<SpecializationPage />} />
        <Route path="coach/target-audience" element={<TargetAudiencePage />} />
        <Route path="coach/availability" element={<AvailabilityPage />} />
        <Route path="coach/certification" element={<CertificationPage />} />
        <Route path="coach/bio" element={<BioPage />} />
        <Route path="coach/pricing" element={<PricingPage />} />
        <Route path="coach/languages" element={<CoachLanguagesPage />} />
        <Route path="coach/avatar" element={<CoachAvatarPage />} />
      </Route>
    </Routes>
  );
};

export default Index;
