import React from "react";
import { useParams } from "react-router";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import filter from "lodash/filter";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner.jsx";
import { Textarea } from "@/components/ui/textarea";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";

const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const GramInput = ({ value, onChange }) => (
  <NumberField
    value={value ?? 0}
    onValueChange={(nextValue) => onChange(nextValue ?? 0)}
    minValue={1}
    step={5}
  >
    <NumberFieldGroup className="h-10 rounded-xl bg-background w-full">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput className="px-3 text-sm flex-1" />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);

const normalizeInstructionRows = (food) =>
  map(get(food, "recipeInstructions", []), (item, index) => ({
    language: trim(get(item, "language", "uz")) || "uz",
    stepNumber: toNumber(get(item, "stepNumber")) || index + 1,
    title: get(item, "title") ?? "",
    body: get(item, "body") ?? "",
    durationMinutes: toNumber(get(item, "durationMinutes")) || 0,
    mediaUrl: get(item, "mediaUrl") ?? "",
    orderKey: toNumber(get(item, "orderKey")) || (index + 1) * 1024,
  }));

const normalizeIngredientRows = (food) =>
  map(get(food, "recipeItems", []), (item, index) => ({
    ingredientId: get(item, "ingredientId"),
    grams: toNumber(get(item, "grams")) || 0,
    displayAmount: toNumber(get(item, "displayAmount")) || "",
    displayUnit: get(item, "displayUnit") ?? "",
    optional: Boolean(get(item, "optional")),
    groupName: get(item, "groupName") ?? "",
    notes: get(item, "notes") ?? "",
    orderKey: toNumber(get(item, "orderKey")) || (index + 1) * 1024,
  }));

const moveRow = (rows, fromIndex, direction) => {
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= size(rows)) {
    return rows;
  }

  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(fromIndex, 1);
  nextRows.splice(toIndex, 0, movedRow);

  return map(nextRows, (row, index) => ({
    ...row,
    orderKey: (index + 1) * 1024,
    stepNumber: row.stepNumber ? index + 1 : row.stepNumber,
  }));
};

const reorderRows = (rows, fromIndex, toIndex) => {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= size(rows) ||
    toIndex >= size(rows) ||
    fromIndex === toIndex
  ) {
    return rows;
  }

  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(fromIndex, 1);
  nextRows.splice(toIndex, 0, movedRow);

  return map(nextRows, (row, index) => ({
    ...row,
    orderKey: (index + 1) * 1024,
    stepNumber: row.stepNumber ? index + 1 : row.stepNumber,
  }));
};

const buildIngredientPayload = (rows) =>
  map(
    filter(rows, (row) => row.ingredientId && toNumber(row.grams) > 0),
    (row, index) => ({
      ingredientId: toNumber(row.ingredientId),
      grams: toNumber(row.grams),
      ...(toNumber(row.displayAmount) > 0
        ? { displayAmount: toNumber(row.displayAmount) }
        : {}),
      ...(trim(row.displayUnit) ? { displayUnit: trim(row.displayUnit) } : {}),
      optional: Boolean(row.optional),
      ...(trim(row.groupName) ? { groupName: trim(row.groupName) } : {}),
      ...(trim(row.notes) ? { notes: trim(row.notes) } : {}),
      orderKey: row.orderKey ? toNumber(row.orderKey) : (index + 1) * 1024,
    }),
  );

const buildInstructionPayload = (instructionRows) =>
  map(
    filter(instructionRows, (row) => trim(row.body)),
    (row, index) => ({
      language: trim(row.language) || "uz",
      stepNumber: toNumber(row.stepNumber) || index + 1,
      ...(trim(row.title) ? { title: trim(row.title) } : {}),
      body: trim(row.body),
      ...(toNumber(row.durationMinutes) > 0
        ? { durationMinutes: toNumber(row.durationMinutes) }
        : {}),
      ...(trim(row.mediaUrl) ? { mediaUrl: trim(row.mediaUrl) } : {}),
      orderKey: row.orderKey ? toNumber(row.orderKey) : (index + 1) * 1024,
    }),
  );

const FoodRecipeDrawer = ({ mode = "food" }) => {
  const { id } = useParams();
  const isRecipeMode = mode === "recipe";
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    isRecipeMode ? "/admin/recipes/list" : "/admin/foods/list",
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [rows, setRows] = React.useState([]);
  const [instructionRows, setInstructionRows] = React.useState([]);
  const [draggedIngredientIndex, setDraggedIngredientIndex] =
    React.useState(null);
  const [nutritionPreview, setNutritionPreview] = React.useState(null);
  const detailUrl = isRecipeMode
    ? `/admin/nutrition/recipes/${id}`
    : `/admin/foods/${id}`;

  const { data: foodData, isLoading: isFoodLoading } = useGetQuery({
    url: detailUrl,
    queryProps: {
      queryKey: [isRecipeMode ? "admin-recipes" : "admin-foods", id],
      enabled: Boolean(id),
    },
  });
  const food = getPayload(foodData);

  React.useEffect(() => {
    if (!food) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(normalizeIngredientRows(food));
    setInstructionRows(normalizeInstructionRows(food));
  }, [food]);

  const mutation = usePatchQuery({
    queryKey: ["admin", isRecipeMode ? "recipes" : "foods"],
  });
  const nutritionPreviewMutation = usePostQuery({
    queryKey: ["admin", "recipes", "nutrition-preview", id],
  });

  const handleSave = async () => {
    try {
      const ingredients = buildIngredientPayload(rows);
      const instructions = buildInstructionPayload(instructionRows);
      const response = isRecipeMode
        ? await mutation.mutateAsync({
            url: `/admin/nutrition/recipes/${id}/ingredients`,
            attributes: { ingredients },
          })
        : await mutation.mutateAsync({
            url: `/admin/foods/${id}/recipe`,
            attributes: { ingredients, instructions },
          });

      if (isRecipeMode) {
        await mutation.mutateAsync({
          url: `/admin/nutrition/recipes/${id}/steps`,
          attributes: { instructions },
        });
      }

      const recipeWarnings = get(getPayload(response), "recipeWarnings", []);
      if (recipeWarnings.length) {
        toast.warning(
          get(
            recipeWarnings,
            "0.message",
            "Recipe saqlandi, lekin ayrim ingredientlarda narx yo'q.",
          ),
        );
      } else {
        toast.success("Recipe saqlandi");
      }
      closeAdminDrawer();
    } catch (error) {
      toast.error(getErrorMessage(error, "Recipe saqlanmadi"));
    }
  };

  const handlePreviewNutrition = async () => {
    if (!isRecipeMode) return;

    try {
      const response = await nutritionPreviewMutation.mutateAsync({
        url: `/admin/nutrition/recipes/${id}/nutrition-preview`,
        attributes: {
          ingredients: buildIngredientPayload(rows),
        },
      });
      setNutritionPreview(getPayload(response));
      toast.success("Nutrition preview hisoblandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nutrition preview hisoblanmadi"));
    }
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && closeAdminDrawer()}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Recipe ingredientlari</DrawerTitle>
          <DrawerDescription>
            {food
              ? resolveLabel(food.translations, food.name, currentLanguage)
              : "Ovqat tarkibi"}
          </DrawerDescription>
        </DrawerHeader>

        {isFoodLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      Ingredientlar
                    </h3>
                  </div>
                  {size(rows) ? (
                    map(rows, (row, index) => (
                      <div
                        key={`${row.ingredientId || "new"}-${index}`}
                        draggable
                        onDragStart={() => setDraggedIngredientIndex(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          setRows((current) =>
                            reorderRows(current, draggedIngredientIndex, index),
                          );
                          setDraggedIngredientIndex(null);
                        }}
                        onDragEnd={() => setDraggedIngredientIndex(null)}
                        className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"
                      >
                        <div className="grid gap-3 lg:grid-cols-[1fr_120px_120px_120px_auto]">
                          <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-2">
                              <GripVerticalIcon
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                              Ingredient
                            </Label>
                            <OptionDrawerPicker
                              value={row.ingredientId}
                              onChange={(value) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, ingredientId: value }
                                      : item,
                                  ),
                                )
                              }
                              url="/admin/ingredients"
                              params={{
                                page: 1,
                                pageSize: 100,
                                status: "active",
                              }}
                              queryKey={[
                                "admin",
                                "ingredients",
                                "recipe-picker",
                              ]}
                              valueKey="id"
                              getOptionLabel={(ingredient) =>
                                resolveLabel(
                                  ingredient.translations,
                                  ingredient.name,
                                  currentLanguage,
                                )
                              }
                              getOptionDescription={(ingredient) =>
                                `${ingredient.calories} kcal / 100g`
                              }
                              title="Ingredient tanlang"
                              placeholder="Ingredient"
                              searchPlaceholder="Ingredient qidirish..."
                              loadingText="Ingredientlar yuklanmoqda..."
                              emptyText="Ingredient topilmadi"
                              triggerClassName="h-10"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Gram</Label>
                            <GramInput
                              value={row.grams}
                              onChange={(value) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, grams: value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              value={row.displayAmount}
                              onChange={(event) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          displayAmount: event.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Unit</Label>
                            <Input
                              value={row.displayUnit}
                              onChange={(event) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          displayUnit: event.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="flex items-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Ingredientni yuqoriga ko'chirish"
                              disabled={index === 0}
                              onClick={() =>
                                setRows((current) => moveRow(current, index, -1))
                              }
                            >
                              <ArrowUpIcon />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Ingredientni pastga ko'chirish"
                              disabled={index === size(rows) - 1}
                              onClick={() =>
                                setRows((current) => moveRow(current, index, 1))
                              }
                            >
                              <ArrowDownIcon />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setRows((current) =>
                                  filter(
                                    current,
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                            >
                              <Trash2Icon />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <div className="flex flex-col gap-2">
                            <Label>Group</Label>
                            <Input
                              value={row.groupName}
                              onChange={(event) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          groupName: event.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Notes</Label>
                            <Input
                              value={row.notes}
                              onChange={(event) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, notes: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 self-end text-sm text-muted-foreground">
                            <Checkbox
                              checked={row.optional}
                              onCheckedChange={(checked) =>
                                setRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, optional: Boolean(checked) }
                                      : item,
                                  ),
                                )
                              }
                            />
                            Optional
                          </label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Hali ingredient qo'shilmagan.
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setRows((current) => [
                        ...current,
                        {
                          ingredientId: null,
                          grams: 100,
                          displayAmount: "",
                          displayUnit: "",
                          optional: false,
                          groupName: "",
                          notes: "",
                          orderKey: (size(current) + 1) * 1024,
                        },
                      ])
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Ingredient qo'shish
                  </Button>
                  {isRecipeMode ? (
                    <div className="grid gap-3 rounded-xl border bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            Nutrition preview
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Ingredientlar saqlanmasdan hisoblanadi.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={nutritionPreviewMutation.isPending}
                          onClick={handlePreviewNutrition}
                        >
                          Hisoblash
                        </Button>
                      </div>
                      {nutritionPreview ? (
                        <div className="grid gap-2 text-sm sm:grid-cols-5">
                          <span>
                            {toNumber(get(nutritionPreview, "totals.calories")) ||
                              0}{" "}
                            kcal
                          </span>
                          <span>
                            P:{" "}
                            {toNumber(get(nutritionPreview, "totals.protein")) ||
                              0}
                            g
                          </span>
                          <span>
                            C:{" "}
                            {toNumber(get(nutritionPreview, "totals.carbs")) ||
                              0}
                            g
                          </span>
                          <span>
                            F: {toNumber(get(nutritionPreview, "totals.fat")) || 0}
                            g
                          </span>
                          <span>
                            Cost:{" "}
                            {toNumber(
                              get(nutritionPreview, "totals.estimatedCost"),
                            ) || 0}
                          </span>
                          {size(get(nutritionPreview, "warnings", [])) ? (
                            <span className="sm:col-span-5 text-muted-foreground">
                              {get(nutritionPreview, "warnings.0.message")}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t pt-4">
                  <h3 className="text-sm font-black text-foreground">
                    Tayyorlash qadamlari
                  </h3>
                  {instructionRows.length ? (
                    map(instructionRows, (row, index) => {
                      const stepLabel = `${index + 1}-qadam`;
                      return (
                        <div
                          key={`${row.stepNumber}-${index}`}
                          className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-[90px_1fr_120px_auto]">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`recipe-step-language-${index}`}>
                                Til
                              </Label>
                              <Input
                                id={`recipe-step-language-${index}`}
                                value={row.language}
                                onChange={(event) =>
                                  setInstructionRows((current) =>
                                    map(current, (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            language: event.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`recipe-step-title-${index}`}>
                                {stepLabel} sarlavha
                              </Label>
                              <Input
                                id={`recipe-step-title-${index}`}
                                value={row.title}
                                onChange={(event) =>
                                  setInstructionRows((current) =>
                                    map(current, (item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, title: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`recipe-step-duration-${index}`}>
                                {stepLabel} davomiyligi
                              </Label>
                              <Input
                                id={`recipe-step-duration-${index}`}
                                type="number"
                                min="0"
                                value={row.durationMinutes || ""}
                                onChange={(event) =>
                                  setInstructionRows((current) =>
                                    map(current, (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            durationMinutes: event.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Qadamni yuqoriga ko'chirish"
                                disabled={index === 0}
                                onClick={() =>
                                  setInstructionRows((current) =>
                                    moveRow(current, index, -1),
                                  )
                                }
                              >
                                <ArrowUpIcon />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Qadamni pastga ko'chirish"
                                disabled={index === size(instructionRows) - 1}
                                onClick={() =>
                                  setInstructionRows((current) =>
                                    moveRow(current, index, 1),
                                  )
                                }
                              >
                                <ArrowDownIcon />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setInstructionRows((current) =>
                                    filter(
                                      current,
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`recipe-step-body-${index}`}>
                              {stepLabel} matn
                            </Label>
                            <Textarea
                              id={`recipe-step-body-${index}`}
                              value={row.body}
                              onChange={(event) =>
                                setInstructionRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, body: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`recipe-step-media-${index}`}>
                              {stepLabel} media URL
                            </Label>
                            <Input
                              id={`recipe-step-media-${index}`}
                              value={row.mediaUrl}
                              onChange={(event) =>
                                setInstructionRows((current) =>
                                  map(current, (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          mediaUrl: event.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Hali tayyorlash qadami qo'shilmagan.
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setInstructionRows((current) => [
                        ...current,
                        {
                          language: "uz",
                          stepNumber: size(current) + 1,
                          title: "",
                          body: "",
                          durationMinutes: 0,
                          mediaUrl: "",
                          orderKey: (size(current) + 1) * 1024,
                        },
                      ])
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Qadam qo'shish
                  </Button>
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                Recipe saqlash
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default FoodRecipeDrawer;
