import React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  LightbulbIcon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import filter from "lodash/filter";
import find from "lodash/find";
import first from "lodash/first";
import map from "lodash/map";
import size from "lodash/size";
import trim from "lodash/trim";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNutritionRecipeBuilderActions } from "@/hooks/app/use-nutrition-recipes.js";
import {
  buildRecognizedProductPayload,
  canGenerateRecipeFromImage,
  confidenceToPercent,
  getRecipeGenerationJob,
  getRecipeGenerationSuggestions,
  getSuggestionNutritionBadges,
  normalizeRecognizedProductsForUi,
  normalizeUploadedRecipeProductImages,
} from "../ai-from-image-recipe-utils.js";

const TipItem = ({ icon: Icon, title, description }) => (
  <div className="flex gap-3">
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
      <Icon className="size-5" />
    </span>
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const ProductReviewItem = ({ product, onChange, onRemove }) => (
  <div className="rounded-2xl border border-border bg-background p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Input
          aria-label={`${product.name || "Ingredient"} nomi`}
          value={product.name}
          onChange={(event) =>
            onChange(product.id, { name: event.target.value })
          }
        />
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_96px] gap-2">
          <Input
            type="number"
            min="0"
            aria-label={`${product.name || "Ingredient"} miqdori`}
            placeholder="Miqdor"
            value={product.quantity}
            onChange={(event) =>
              onChange(product.id, { quantity: event.target.value })
            }
          />
          <Input
            aria-label={`${product.name || "Ingredient"} birligi`}
            placeholder="g"
            value={product.unit}
            onChange={(event) =>
              onChange(product.id, { unit: event.target.value })
            }
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`${product.name} olib tashlash`}
        onClick={() => onRemove(product.id)}
      >
        <XIcon />
      </Button>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      <Badge variant="secondary">{confidenceToPercent(product.confidence)}%</Badge>
      <Badge variant="outline">Manba: rasm review</Badge>
    </div>
  </div>
);

const UploadPreview = ({ images }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {map(images, (image) => (
      <div
        key={image.localId || image.id}
        className="overflow-hidden rounded-xl border border-border bg-background"
      >
        <div className="aspect-[4/3] bg-muted">
          {image.previewUrl || image.url ? (
            <img
              src={image.previewUrl || image.url}
              alt={image.fileName}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 p-2 text-xs">
          <span className="truncate text-muted-foreground">{image.fileName}</span>
          {image.uploadId || image.id ? (
            <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
          ) : null}
        </div>
      </div>
    ))}
  </div>
);

const SuggestionPicker = ({ suggestions, activeSuggestionId, onSelect }) => (
  <div className="grid gap-2">
    {map(suggestions, (suggestion) => {
      const active = suggestion.id === activeSuggestionId;

      return (
        <button
          key={suggestion.id}
          type="button"
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
            active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
          onClick={() => onSelect(suggestion.id)}
        >
          <span className="block font-semibold">{suggestion.title}</span>
          <span className="text-xs text-muted-foreground">
            {suggestion.explanation || "AI tavsiya"}
          </span>
        </button>
      );
    })}
  </div>
);

const SuggestionDetail = ({
  suggestion,
  job,
  isSaving,
  onSaveDraft,
  onSaveMeal,
  onRegenerate,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" className="gap-1">
        <SparklesIcon className="size-3" />
        AI tavsiya
      </Badge>
      {job?.reviewOnly || suggestion.reviewOnly ? (
        <Badge variant="outline">Review only</Badge>
      ) : null}
      {suggestion.confidence ? (
        <Badge variant="outline">
          {confidenceToPercent(suggestion.confidence)}% ishonch
        </Badge>
      ) : null}
    </div>
    <div>
      <h2 className="text-xl font-semibold text-foreground">
        {suggestion.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {suggestion.description || suggestion.explanation}
      </p>
    </div>
    <div className="grid gap-2 sm:grid-cols-4">
      {map(getSuggestionNutritionBadges(suggestion), (item) => (
        <Badge key={item.key} variant="outline">
          {item.label}
        </Badge>
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Ingredientlar</h3>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
          {map(suggestion.ingredients || [], (ingredient, index) => (
            <div key={`${ingredient.name}-${index}`} className="flex gap-2">
              <span className="font-medium text-foreground">
                {index + 1}.
              </span>
              <span>
                {ingredient.name}
                {ingredient.quantity ? ` · ${ingredient.quantity}` : ""}
                {ingredient.unit ? ` ${ingredient.unit}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Qadamlar</h3>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
          {map(suggestion.steps || [], (step, index) => (
            <div key={`${step.title}-${index}`} className="flex gap-2">
              <span className="font-medium text-foreground">
                {step.stepNumber || index + 1}.
              </span>
              <span>{step.body || step.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" disabled={isSaving} onClick={onSaveDraft}>
        <SaveIcon data-icon="inline-start" />
        Draft retseptga saqlash
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isSaving}
        onClick={onSaveMeal}
      >
        Saqlangan taomga qo'shish
      </Button>
    </div>
    <Button
      type="button"
      variant="outline"
      disabled={isSaving}
      onClick={onRegenerate}
    >
      <RefreshCwIcon data-icon="inline-start" />
      Boshqasini yaratish
    </Button>
  </div>
);

const AI_JOB_STATUS_META = {
  queued: {
    label: "Navbatda",
    title: "AI retsept navbatga qo'shildi",
    description:
      "Job qabul qilindi. Tavsiyalar tayyor bo'lishi bilan shu yerda chiqadi.",
  },
  pending: {
    label: "Navbatda",
    title: "AI retsept navbatga qo'shildi",
    description:
      "Job qabul qilindi. Tavsiyalar tayyor bo'lishi bilan shu yerda chiqadi.",
  },
  processing: {
    label: "Ishlanmoqda",
    title: "AI retsept tayyorlanmoqda",
    description:
      "Job qabul qilindi. Tavsiyalar tayyor bo'lishi bilan shu yerda chiqadi.",
  },
  analyzing: {
    label: "Tahlilda",
    title: "Ingredientlar tahlil qilinmoqda",
    description:
      "Mahsulotlar aniqlanyapti. Natija chiqqach review va retsept tavsiyalari ko'rinadi.",
  },
  review_required: {
    label: "Review kerak",
    title: "Ingredient review kerak",
    description:
      "AI aniqlagan mahsulotlarni tekshiring, miqdorlarni tasdiqlang va qayta yarating.",
  },
  failed: {
    label: "Xatolik",
    title: "AI retsept yaratishda xatolik",
    description: "Job yakunlanmadi. Ingredientlarni saqlab, qayta urinish mumkin.",
  },
  completed: {
    label: "Tayyor",
    title: "AI tavsiyalar tayyor",
    description: "Tavsiyalardan birini tanlab draft retsept yoki saved mealga saqlang.",
  },
};

const normalizeJobStatus = (status) =>
  trim(String(status || ""))
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getJobStatusMeta = (status) => {
  const normalized = normalizeJobStatus(status);

  return normalized ? AI_JOB_STATUS_META[normalized] || null : null;
};

const AIFromImageRecipe = () => {
  const inputRef = React.useRef(null);
  const objectUrlsRef = React.useRef([]);
  const {
    uploadRecipeProductImages,
    createRecipeGenerationJob,
    saveGeneratedRecipeSuggestion,
    isUpdating,
  } = useNutritionRecipeBuilderActions();
  const [selectedImages, setSelectedImages] = React.useState([]);
  const [uploadedImages, setUploadedImages] = React.useState([]);
  const [detectedIngredients, setDetectedIngredients] = React.useState([]);
  const [newIngredient, setNewIngredient] = React.useState("");
  const [job, setJob] = React.useState(null);
  const [activeSuggestionId, setActiveSuggestionId] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [savingTarget, setSavingTarget] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [savedMessage, setSavedMessage] = React.useState("");
  const suggestions = getRecipeGenerationSuggestions(job);
  const jobStatusMeta = isGenerating
    ? AI_JOB_STATUS_META.processing
    : getJobStatusMeta(job?.status);
  const activeSuggestion =
    find(suggestions, { id: activeSuggestionId }) || first(suggestions);
  const isBusy =
    isUpdating || isUploading || isGenerating || Boolean(savingTarget);
  const canGenerate = canGenerateRecipeFromImage({
    uploadedImages,
    products: detectedIngredients,
    isBusy,
  });
  const hasDetectedIngredients = size(detectedIngredients) > 0;

  React.useEffect(() => {
    return () => {
      map(objectUrlsRef.current, (url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImagePick = React.useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);

      if (!files.length || typeof URL === "undefined") {
        return;
      }

      const previews = map(files, (file, index) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.push(previewUrl);

        return {
          localId: `local-${file.name}-${Date.now()}-${index}`,
          fileName: file.name,
          previewUrl,
        };
      });

      setSelectedImages(previews);
      setUploadedImages([]);
      setJob(null);
      setActiveSuggestionId("");
      setErrorMessage("");
      setSavedMessage("");
      setIsUploading(true);

      try {
        const response = await uploadRecipeProductImages(files);
        const uploads = normalizeUploadedRecipeProductImages(response);

        if (!uploads.length) {
          throw new Error("No upload ids returned.");
        }

        setUploadedImages(uploads);
        setSelectedImages(
          map(previews, (preview, index) => ({
            ...preview,
            uploadId: uploads[index]?.id,
            url: uploads[index]?.url || preview.previewUrl,
          })),
        );
        toast.success(`${size(uploads)} ta rasm yuklandi`);
      } catch {
        setErrorMessage("Rasmni yuklab bo'lmadi. Qayta urinib ko'ring.");
        toast.error("Rasmni yuklab bo'lmadi");
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    },
    [uploadRecipeProductImages],
  );

  const handleProductChange = React.useCallback((productId, patch) => {
    setDetectedIngredients((current) =>
      map(current, (product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
    setSavedMessage("");
  }, []);

  const handleRemoveIngredient = React.useCallback((ingredientId) => {
    setDetectedIngredients((current) =>
      filter(current, (ingredient) => ingredient.id !== ingredientId),
    );
    setSavedMessage("");
  }, []);

  const handleAddIngredient = React.useCallback(() => {
    const name = trim(newIngredient);

    if (!name) {
      return;
    }

    setDetectedIngredients((current) => [
      ...current,
      {
        id: `manual-${name}-${Date.now()}`,
        name,
        quantity: 100,
        unit: "g",
        confidence: 1,
        source: "manual_review",
      },
    ]);
    setNewIngredient("");
    setSavedMessage("");
  }, [newIngredient]);

  const handleGenerate = React.useCallback(async () => {
    const confirmedProducts = buildRecognizedProductPayload(detectedIngredients);

    if (!size(uploadedImages)) {
      toast.error("Avval ingredient rasmini yuklang");
      return;
    }

    if (!size(confirmedProducts)) {
      toast.error("Kamida bitta ingredientni tasdiqlang");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const response = await createRecipeGenerationJob({
        imageUploadIds: map(uploadedImages, "id"),
        confirmedProducts,
      });
      const nextJob = getRecipeGenerationJob(response);
      const nextSuggestions = getRecipeGenerationSuggestions(nextJob);
      const nextProducts = normalizeRecognizedProductsForUi(
        nextJob.recognizedProducts || confirmedProducts,
      );

      setJob(nextJob);
      setDetectedIngredients(nextProducts);
      setActiveSuggestionId(first(nextSuggestions)?.id || "");
      toast.success(
        size(nextSuggestions)
          ? "AI retsept tavsiyalari tayyor"
          : "AI job yaratildi",
      );
    } catch {
      setErrorMessage("AI retsept yaratib bo'lmadi. Qayta urinib ko'ring.");
      toast.error("AI retsept yaratib bo'lmadi");
    } finally {
      setIsGenerating(false);
    }
  }, [createRecipeGenerationJob, detectedIngredients, uploadedImages]);

  const handleSaveSuggestion = async (target) => {
    if (!job?.id || !activeSuggestion?.id) {
      return;
    }

    setSavingTarget(target);
    setErrorMessage("");

    try {
      await saveGeneratedRecipeSuggestion(job.id, {
        suggestionId: activeSuggestion.id,
        target,
      });
      setSavedMessage(
        target === "draftRecipe"
          ? "Draft retsept saqlandi"
          : "Saqlangan taom qo'shildi",
      );
      toast.success(
        target === "draftRecipe"
          ? "Draft retsept saqlandi"
          : "Saqlangan taom qo'shildi",
      );
    } catch {
      setErrorMessage("AI tavsiyani saqlab bo'lmadi. Qayta urinib ko'ring.");
      toast.error("AI tavsiyani saqlab bo'lmadi");
    } finally {
      setSavingTarget("");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingredient rasmini yuklang</CardTitle>
            <p className="text-sm text-muted-foreground">
              Retsept olish uchun ingredientlaringizni suratga oling yoki yuklang
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <button
              type="button"
              className="relative flex min-h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => inputRef.current?.click()}
            >
              <span className="relative grid size-12 place-items-center rounded-full bg-background text-primary">
                <UploadCloudIcon className="size-6" />
              </span>
              <span className="relative text-sm font-medium text-foreground">
                Rasmni shu yerga torting yoki tanlang
              </span>
              <span className="relative text-xs text-muted-foreground">
                JPG, PNG, WebP formatlari · Maks. 10MB
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-label="Ingredient rasmi yuklash"
              className="hidden"
              onChange={handleImagePick}
            />
            {size(selectedImages) ? <UploadPreview images={selectedImages} /> : null}
            {isUploading ? (
              <Badge variant="secondary" className="w-fit">
                Rasm yuklanmoqda...
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Tasdiqlangan ingredientlar</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI tavsiya yaratishdan oldin mahsulot nomi, miqdori va birligini
                tekshiring.
              </p>
            </div>
            <Badge variant="secondary">{size(detectedIngredients)} ta</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {hasDetectedIngredients ? (
              <div className="grid gap-2">
                {map(detectedIngredients, (ingredient) => (
                  <ProductReviewItem
                    key={ingredient.id}
                    product={ingredient}
                    onChange={handleProductChange}
                    onRemove={handleRemoveIngredient}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Ingredientlar hali tasdiqlanmadi. Rasm yuklang va ingredientni
                qo'lda qo'shing.
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                aria-label="Ingredient qo'shish"
                placeholder="Ingredient qo'shish"
                value={newIngredient}
                onChange={(event) => setNewIngredient(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddIngredient}
              >
                <PlusIcon data-icon="inline-start" />
                Ingredient qo'shish
              </Button>
            </div>
            <Button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              <SparklesIcon data-icon="inline-start" />
              Shu ingredientlardan retsept chiqarish
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <Badge variant="secondary" className="gap-1">
            <SparklesIcon className="size-3" />
            AI tavsiya
          </Badge>
          {jobStatusMeta ? (
            <Badge variant="outline">{jobStatusMeta.label}</Badge>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage ? (
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex flex-col gap-2">
                <p className="font-medium text-destructive">{errorMessage}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  <RefreshCwIcon data-icon="inline-start" />
                  Qayta urinish
                </Button>
              </div>
            </div>
          ) : null}

          {savedMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary">
              <CheckCircle2Icon className="size-4" />
              {savedMessage}
            </div>
          ) : null}

          {size(suggestions) ? (
            <>
              <SuggestionPicker
                suggestions={suggestions}
                activeSuggestionId={activeSuggestion?.id}
                onSelect={setActiveSuggestionId}
              />
              <SuggestionDetail
                suggestion={activeSuggestion}
                job={job}
                isSaving={Boolean(savingTarget)}
                onSaveDraft={() => handleSaveSuggestion("draftRecipe")}
                onSaveMeal={() => handleSaveSuggestion("savedMeal")}
                onRegenerate={handleGenerate}
              />
            </>
          ) : jobStatusMeta && (job?.id || isGenerating) ? (
            <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
              <div className="flex max-w-sm flex-col items-center gap-2">
                <span className="grid size-12 place-items-center rounded-full bg-background text-primary">
                  <RefreshCwIcon
                    className={`size-6 ${isGenerating ? "animate-spin" : ""}`}
                  />
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  {jobStatusMeta.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {jobStatusMeta.description}
                </p>
                {normalizeJobStatus(job?.status) === "failed" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    <RefreshCwIcon data-icon="inline-start" />
                    Qayta urinish
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <div className="flex max-w-sm flex-col items-center gap-2">
                <span className="grid size-12 place-items-center rounded-full bg-background text-primary">
                  <SparklesIcon className="size-6" />
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  AI tavsiya hali yaratilmagan
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rasm yuklang, ingredientlarni tasdiqlang va AI tavsiya
                  yarating.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yaxshi natija uchun</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <TipItem
              icon={LightbulbIcon}
              title="Yaxshi yoritish"
              description="Tabiiy yorug'likda yoki yaxshi yoritilgan joyda suratga oling."
            />
            <TipItem
              icon={ShieldCheckIcon}
              title="Aniq va yaqin"
              description="Ingredientlar ravshan va yaqin ko'rinadigan bo'lsin."
            />
            <TipItem
              icon={InfoIcon}
              title="Fon soddaligi"
              description="Sodda fon ingredientlarni aniqlash aniqligini oshiradi."
            />
            <TipItem
              icon={SparklesIcon}
              title="Har xil ingredientlar"
              description="Bir nechta turdagi ingredientlarni bitta rasmda joylashtiring."
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <h3 className="text-base font-semibold text-foreground">AI haqida</h3>
            <p className="text-sm text-muted-foreground">
              Natijani tekshiring va o'zingizga moslab tahrirlang.
            </p>
            <Button type="button" variant="link" className="h-auto justify-start px-0">
              Ko'proq ma'lumot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex gap-3 p-5">
            <LockIcon className="mt-0.5 size-4 text-primary" />
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">
                Maxfiylik kafolati
              </h3>
              <p className="text-sm text-muted-foreground">
                Yuklagan rasmlaringiz faqat retsept yaratish uchun ishlatiladi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIFromImageRecipe;
