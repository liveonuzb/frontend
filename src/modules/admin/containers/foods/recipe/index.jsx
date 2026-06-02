import React from "react";
import { useParams } from "react-router";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import filter from "lodash/filter";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { Button } from "@/components/ui/button";
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

const FoodRecipeDrawer = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation("/admin/foods/list");
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [rows, setRows] = React.useState([]);
  const [instructionRows, setInstructionRows] = React.useState([]);

  const { data: foodData, isLoading: isFoodLoading } = useGetQuery({
    url: `/admin/foods/${id}`,
    queryProps: {
      queryKey: ["admin", "foods", id],
      enabled: Boolean(id),
    },
  });
  const food = getPayload(foodData);

  React.useEffect(() => {
    if (!food) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(
      map(get(food, "recipeItems", []), (item) => ({
        ingredientId: get(item, "ingredientId"),
        grams: toNumber(get(item, "grams")) || 0,
        orderKey: toNumber(get(item, "orderKey")) || undefined,
      })),
    );
    setInstructionRows(normalizeInstructionRows(food));
  }, [food]);

  const mutation = usePatchQuery({ queryKey: ["admin", "foods"] });

  const handleSave = async () => {
    try {
      const response = await mutation.mutateAsync({
        url: `/admin/foods/${id}/recipe`,
        attributes: {
          ingredients: map(
            filter(rows, (row) => row.ingredientId && toNumber(row.grams) > 0),
            (row) => ({
              ingredientId: toNumber(row.ingredientId),
              grams: toNumber(row.grams),
              orderKey: row.orderKey ? toNumber(row.orderKey) : undefined,
            }),
          ),
          instructions: map(
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
              orderKey: row.orderKey
                ? toNumber(row.orderKey)
                : (index + 1) * 1024,
            }),
          ),
        },
      });
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
                  {rows.length ? (
                    map(rows, (row, index) => (
                      <div
                        key={`${row.ingredientId || "new"}-${index}`}
                        className="grid grid-cols-[1fr_120px_auto] items-end gap-2"
                      >
                        <div className="flex flex-col gap-2">
                          <Label>Ingredient</Label>
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
                            queryKey={["admin", "ingredients", "recipe-picker"]}
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
                          orderKey: (current.length + 1) * 1024,
                        },
                      ])
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Ingredient qo'shish
                  </Button>
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
                          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="self-end"
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
                          stepNumber: current.length + 1,
                          title: "",
                          body: "",
                          durationMinutes: 0,
                          mediaUrl: "",
                          orderKey: (current.length + 1) * 1024,
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
