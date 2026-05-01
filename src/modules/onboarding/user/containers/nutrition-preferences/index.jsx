import NutritionSelectStep from "../nutrition-select-step.jsx";

const Index = () => (
  <NutritionSelectStep
    step="nutrition-preferences"
    question="Ovqatlanishda nimalarni hisobga olish muhim?"
    summary="Halol, gluten free, sugar free kabi talablarni tanlang"
    field="nutritionPreferenceKeys"
    otherField="nutritionPreferenceOtherText"
    nextPath="/user/onboarding/diet-restrictions"
    url="/user/onboarding/nutrition-preferences"
    valueType="key"
    placeholder="Masalan: kam yog'li, achchiqsiz..."
  />
);

export default Index;
