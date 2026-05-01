import NutritionSelectStep from "../nutrition-select-step.jsx";

const Index = () => (
  <NutritionSelectStep
    step="disliked-ingredients"
    question="Qaysi ingredientlarni yoqtirmaysiz?"
    summary="Rejada chiqmasligi kerak bo'lgan ingredientlarni tanlang"
    field="dislikedIngredientIds"
    otherField="dislikedOtherText"
    nextPath="/user/onboarding/nutrition-preferences"
    url="/user/onboarding/ingredients"
    params={{ type: "disliked" }}
    placeholder="Masalan: piyoz, jigar, baliq..."
  />
);

export default Index;
