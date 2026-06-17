import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import map from "lodash/map";
import reject from "lodash/reject";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNutritionRecipeBuilderActions } from "@/hooks/app/use-nutrition-recipes.js";
import { cn } from "@/lib/utils.js";
import NutritionLayout from "../../ui/nutrition-layout.jsx";
import RecipeBasicInfoStep from "./recipe-basic-info-step.jsx";
import RecipeIngredientsStep from "./recipe-ingredients-step.jsx";
import RecipeInstructionsStep from "./recipe-instructions-step.jsx";
import RecipeReviewStep from "./recipe-review-step.jsx";
import NutritionSummary from "./nutrition-summary.jsx";
import RecipeImage from "./recipe-image.jsx";
import {
  buildRecipeCreatePayload,
  getIngredientNutritionIssues,
} from "../recipe-builder-payload.js";
import {
  DEFAULT_WIZARD_INGREDIENTS,
  DEFAULT_WIZARD_STEPS,
  toRecipeFromBuilder,
} from "../recipe-runtime-data.js";
import { getIngredientsNutrition } from "../recipe-ui-utils.js";

const steps = [
  "Asosiy ma'lumotlar",
  "Ingredientlar",
  "Tayyorlash bosqichlari",
  "Ko'rib chiqish",
];

const initialBasicInfo = {
  title: "",
  description: "",
  category: "",
  difficulty: "",
  prepTimeMinutes: "15",
  cookTimeMinutes: "20",
  totalTimeMinutes: "35",
  servings: "2",
  tags: ["Yuqori protein", "Kam kaloriyali"],
  allergens: [],
};

const validateBasicInfo = (basicInfo) => {
  const errors = {};

  if (!basicInfo.title.trim()) {
    errors.title = "Retsept nomini kiriting";
  }
  if (!basicInfo.category) {
    errors.category = "Kategoriya tanlang";
  }
  if (!basicInfo.difficulty) {
    errors.difficulty = "Qiyinchilik darajasini tanlang";
  }
  if (!toNumber(basicInfo.prepTimeMinutes)) {
    errors.prepTimeMinutes = "Tayyorlash vaqtini kiriting";
  }
  if (!toNumber(basicInfo.servings)) {
    errors.servings = "Porsiyalar sonini kiriting";
  }

  return errors;
};

const StepIndicator = ({ activeStep }) => (
  <Card>
    <CardContent className="flex gap-2 overflow-x-auto p-3">
      {map(steps, (step, index) => {
        const active = activeStep === index;
        const complete = activeStep > index;

        return (
          <div
            key={step}
            className={cn(
              "flex min-w-max flex-1 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground",
              active && "bg-primary/10 text-primary",
            )}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border border-border bg-background text-xs",
                (active || complete) && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {complete ? <CheckIcon className="size-3" /> : index + 1}
            </span>
            {step}
          </div>
        );
      })}
    </CardContent>
  </Card>
);

const LivePreview = ({ basicInfo, imageUrl, nutrition }) => (
  <Card className="sticky top-4">
    <CardContent className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Jonli ko'rinish
        </h2>
        <Badge variant="secondary">Oldindan ko'rish</Badge>
      </div>
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <RecipeImage src={imageUrl} alt={basicInfo.title || "Retsept rasmi"} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          {basicInfo.title || "Retsept nomi"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {basicInfo.description || "Qisqa tavsif shu yerda ko'rinadi..."}
        </p>
      </div>
      <NutritionSummary nutrition={nutrition} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl border border-border p-3">
          <div className="font-semibold text-foreground">
            {basicInfo.totalTimeMinutes || 0} daqiqa
          </div>
          <div className="text-muted-foreground">Jami vaqt</div>
        </div>
        <div className="rounded-2xl border border-border p-3">
          <div className="font-semibold text-foreground">
            {basicInfo.servings || 1} porsiya
          </div>
          <div className="text-muted-foreground">Porsiya</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {map(basicInfo.tags, (tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Bu faqat oldindan ko'rish. Yakuniy ko'rinish saqlangandan keyin o'zgarishi mumkin.
      </p>
    </CardContent>
  </Card>
);

const RecipeCreateWizard = ({ onCancel, onComplete }) => {
  const navigate = useNavigate();
  const { createMyRecipe, requestPublication, isUpdating } =
    useNutritionRecipeBuilderActions();
  const [activeStep, setActiveStep] = React.useState(0);
  const [basicInfo, setBasicInfo] = React.useState(initialBasicInfo);
  const [errors, setErrors] = React.useState({});
  const [ingredients, setIngredients] = React.useState(DEFAULT_WIZARD_INGREDIENTS);
  const [showIngredientIssues, setShowIngredientIssues] =
    React.useState(false);
  const [instructionSteps, setInstructionSteps] = React.useState(DEFAULT_WIZARD_STEPS);
  const [visibility, setVisibility] = React.useState("public");
  const [publishStatus, setPublishStatus] = React.useState("Qoralama");
  const [imageUrl, setImageUrl] = React.useState("/madagascar/dashboard/light/lunch.webp");
  const objectUrlRef = React.useRef("");
  const nutrition = React.useMemo(
    () => getIngredientsNutrition(ingredients),
    [ingredients],
  );
  const ingredientIssues = React.useMemo(
    () => getIngredientNutritionIssues(ingredients),
    [ingredients],
  );

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleBasicInfoChange = React.useCallback((key, value) => {
    setBasicInfo((current) => {
      const next = { ...current, [key]: value };
      if (key === "prepTimeMinutes" || key === "cookTimeMinutes") {
        next.totalTimeMinutes = String(
          (toNumber(next.prepTimeMinutes) || 0) +
            (toNumber(next.cookTimeMinutes) || 0),
        );
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const toggleBasicInfoArray = React.useCallback((key, value) => {
    setBasicInfo((current) => {
      const exists = current[key].includes(value);

      return {
        ...current,
        [key]: exists
          ? current[key].filter((item) => item !== value)
          : [...current[key], value],
      };
    });
  }, []);

  const handleImagePick = React.useCallback((file) => {
    if (!file || typeof URL === "undefined") {
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }, []);

  const handleImageRemove = React.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setImageUrl("");
  }, []);

  const handleImageSelect = React.useCallback((url) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setImageUrl(url);
  }, []);

  const handleIngredientChange = React.useCallback((ingredientId, patch) => {
    setIngredients((current) =>
      map(current, (ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, ...patch }
          : ingredient,
      ),
    );
  }, []);

  const handleIngredientAdd = React.useCallback(() => {
    setIngredients((current) => [
      ...current,
      {
        id: `builder-new-${Date.now()}`,
        name: "Brokoli",
        quantity: 70,
        baseQuantity: 70,
        unit: "g",
        calories: 24,
        protein: 2,
        carbs: 5,
        fat: 0.3,
        fiber: 2.2,
        sugar: 1,
        sodium: 23,
        isRequired: true,
        note: "",
        nutritionSource: "manual",
        matchStatus: "manual",
        reviewNeeded: false,
      },
    ]);
  }, []);

  const handleIngredientDelete = React.useCallback((ingredientId) => {
    setIngredients((current) =>
      reject(current, (ingredient) => ingredient.id === ingredientId),
    );
  }, []);

  const handleStepChange = React.useCallback((stepId, patch) => {
    setInstructionSteps((current) =>
      map(current, (step) => (step.id === stepId ? { ...step, ...patch } : step)),
    );
  }, []);

  const handleStepAdd = React.useCallback(() => {
    setInstructionSteps((current) => [
      ...current,
      {
        id: `builder-step-${Date.now()}`,
        order: current.length + 1,
        title: "Yangi qadam",
        description: "Tayyorlash bo'yicha qisqa izoh yozing.",
        durationMinutes: 5,
        imageUrl: "",
      },
    ]);
  }, []);

  const handleStepDelete = React.useCallback((stepId) => {
    setInstructionSteps((current) =>
      reject(current, (step) => step.id === stepId).map((step, index) => ({
        ...step,
        order: index + 1,
      })),
    );
  }, []);

  const moveStep = React.useCallback((stepId, direction) => {
    setInstructionSteps((current) => {
      const index = current.findIndex((step) => step.id === stepId);
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);

      return map(next, (step, nextIndex) => ({ ...step, order: nextIndex + 1 }));
    });
  }, []);

  const buildRecipe = React.useCallback(
    (isPublished) =>
      toRecipeFromBuilder({
        basicInfo,
        ingredients,
        steps: instructionSteps,
        imageUrl,
        visibility,
        isPublished,
      }),
    [basicInfo, imageUrl, ingredients, instructionSteps, visibility],
  );

  const buildPayload = React.useCallback(
    (recipeStatus) =>
      buildRecipeCreatePayload({
        basicInfo,
        ingredients,
        steps: instructionSteps,
        imageUrl,
        visibility,
        recipeStatus,
      }),
    [basicInfo, imageUrl, ingredients, instructionSteps, visibility],
  );

  const ensureWizardIsSubmittable = React.useCallback(() => {
    const nextErrors = validateBasicInfo(basicInfo);
    setErrors(nextErrors);

    if (size(Object.keys(nextErrors))) {
      setActiveStep(0);
      return false;
    }

    if (ingredientIssues.length) {
      setShowIngredientIssues(true);
      setActiveStep(1);
      return false;
    }

    return true;
  }, [basicInfo, ingredientIssues]);

  const submitRecipe = React.useCallback(
    async ({ submitForReview }) => {
      if (!ensureWizardIsSubmittable()) {
        return;
      }

      const shouldRequestReview = submitForReview && visibility === "public";
      const recipeStatus = shouldRequestReview ? "review_requested" : "draft";
      const localRecipe = buildRecipe(shouldRequestReview);

      try {
        const response = await createMyRecipe(buildPayload(recipeStatus));
        const savedRecipe = response?.recipe || response || localRecipe;
        const recipeId =
          savedRecipe?.catalogFoodId || savedRecipe?.foodId || savedRecipe?.id;

        if (shouldRequestReview && recipeId) {
          await requestPublication(recipeId);
        }

        setPublishStatus(
          shouldRequestReview ? "Admin ko'rib chiqishida" : "Qoralama",
        );
        toast.success(
          shouldRequestReview
            ? "Retsept admin ko'rib chiqishiga yuborildi"
            : "Retsept qoralama sifatida saqlandi",
        );
        onComplete?.(savedRecipe);
      } catch {
        toast.error("Retseptni saqlab bo'lmadi");
      }
    },
    [
      buildPayload,
      buildRecipe,
      createMyRecipe,
      ensureWizardIsSubmittable,
      onComplete,
      requestPublication,
      visibility,
    ],
  );

  const handleDraftSave = React.useCallback(() => {
    void submitRecipe({ submitForReview: false });
  }, [submitRecipe]);

  const handlePublish = React.useCallback(() => {
    void submitRecipe({ submitForReview: true });
  }, [submitRecipe]);

  const handleAddToMealPlan = React.useCallback(() => {
    toast.success("Retsept ovqatlanish rejasiga qo'shildi");
  }, []);

  const handleNext = React.useCallback(() => {
    if (activeStep === 0) {
      const nextErrors = validateBasicInfo(basicInfo);
      setErrors(nextErrors);
      if (size(Object.keys(nextErrors))) {
        return;
      }
    }

    if (activeStep === 1 && ingredientIssues.length) {
      setShowIngredientIssues(true);
      return;
    }

    setActiveStep((current) => Math.min(steps.length - 1, current + 1));
  }, [activeStep, basicInfo, ingredientIssues]);

  const handleBack = React.useCallback(() => {
    setActiveStep((current) => Math.max(0, current - 1));
  }, []);

  const handleCancel = React.useCallback(() => {
    if (onCancel) {
      onCancel();
      return;
    }
    navigate("/user/nutrition/recipes");
  }, [navigate, onCancel]);

  const nextLabel =
    activeStep === 0
      ? "Keyingisi: Ingredientlar"
      : activeStep === 1
        ? "Keyingisi"
        : activeStep === 2
          ? "Keyingi: Ko'rib chiqish"
          : "Admin ko'rib chiqishiga yuborish";

  const content =
    activeStep === 0 ? (
      <RecipeBasicInfoStep
        basicInfo={basicInfo}
        errors={errors}
        imageUrl={imageUrl}
        onBasicInfoChange={handleBasicInfoChange}
        onToggleTag={(value) => toggleBasicInfoArray("tags", value)}
        onToggleAllergen={(value) => toggleBasicInfoArray("allergens", value)}
        onImagePick={handleImagePick}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
      />
    ) : activeStep === 1 ? (
      <RecipeIngredientsStep
        ingredients={ingredients}
        issues={showIngredientIssues ? ingredientIssues : []}
        onIngredientChange={handleIngredientChange}
        onIngredientAdd={handleIngredientAdd}
        onIngredientDelete={handleIngredientDelete}
      />
    ) : activeStep === 2 ? (
      <RecipeInstructionsStep
        steps={instructionSteps}
        nutrition={nutrition}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        onStepChange={handleStepChange}
        onStepAdd={handleStepAdd}
        onStepDelete={handleStepDelete}
        onStepMoveUp={(stepId) => moveStep(stepId, -1)}
        onStepMoveDown={(stepId) => moveStep(stepId, 1)}
        onDraftSave={handleDraftSave}
        onPublish={handlePublish}
        onAddToMealPlan={handleAddToMealPlan}
        isSubmitting={isUpdating}
      />
    ) : (
      <RecipeReviewStep
        basicInfo={basicInfo}
        ingredients={ingredients}
        steps={instructionSteps}
        nutrition={nutrition}
        imageUrl={imageUrl}
        visibility={visibility}
        publishStatus={publishStatus}
        onDraftSave={handleDraftSave}
        onPublish={handlePublish}
        onAddToMealPlan={handleAddToMealPlan}
        isSubmitting={isUpdating}
      />
    );

  return (
    <NutritionLayout
      header={
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Yangi retsept yaratish
            </h1>
            {activeStep < 3 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {activeStep + 1}-qadam: {steps[activeStep]}
              </p>
            ) : null}
          </div>
          <StepIndicator activeStep={activeStep} />
        </div>
      }
      sidebar={
        activeStep === 0 ? (
          <LivePreview
            basicInfo={basicInfo}
            imageUrl={imageUrl}
            nutrition={nutrition}
          />
        ) : null
      }
      sidebarClassName="xl:block"
      bottomActions={
        <Card className="sticky bottom-3 z-10 bg-card/95 backdrop-blur">
          <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={activeStep ? handleBack : handleCancel}>
              <ArrowLeftIcon data-icon="inline-start" />
              {activeStep ? "Orqaga" : "Bekor qilish"}
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {activeStep > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={handleDraftSave}
                >
                  Saqlash
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={isUpdating}
                onClick={activeStep === steps.length - 1 ? handlePublish : handleNext}
              >
                {nextLabel}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="flex flex-col gap-4">
        {activeStep === 1 ? (
          <h2 className="text-xl font-semibold text-foreground">
            2-qadam: Ingredientlar
          </h2>
        ) : null}
        {content}
      </div>
    </NutritionLayout>
  );
};

export default RecipeCreateWizard;
