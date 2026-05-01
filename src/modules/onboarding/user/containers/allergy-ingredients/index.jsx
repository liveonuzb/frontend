import NutritionSelectStep from "../nutrition-select-step.jsx";

const Index = () => (
  <NutritionSelectStep
    step="allergy-ingredients"
    question="Qaysi ingredientlarga allergiyangiz bor?"
    summary="Allergiya bo'lgan ingredientlarni tanlang"
    field="allergyIngredientIds"
    otherField="allergyOtherText"
    nextPath="/user/onboarding/disliked-ingredients"
    url="/user/onboarding/ingredients"
    params={{ type: "allergy" }}
    placeholder="Masalan: yong'oq, tuxum, asal..."
  />
);

export default Index;
