import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, isArray, join, map, toNumber, trim } from "lodash";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { Button } from "@/components/ui/button";
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
import OptionDrawerPicker from "@/components/option-drawer-picker";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

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
    minValue={0}
    step={5}
  >
    <NumberFieldGroup className="h-10 rounded-xl bg-background w-full">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput className="px-3 text-sm flex-1" />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);

const FoodRecipeDrawer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [rows, setRows] = React.useState([]);

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
      })),
    );
  }, [food]);

  const mutation = usePatchQuery({ queryKey: ["admin", "foods"] });

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({
        url: `/admin/foods/${id}/recipe`,
        attributes: {
          ingredients: rows
            .filter((row) => row.ingredientId && Number(row.grams) > 0)
            .map((row) => ({
              ingredientId: Number(row.ingredientId),
              grams: Number(row.grams),
            })),
        },
      });
      toast.success("Recipe saqlandi");
      navigate("/admin/foods/list");
    } catch (error) {
      toast.error(getErrorMessage(error, "Recipe saqlanmadi"));
    }
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/foods/list")}
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
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
              <div className="flex flex-col gap-3">
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
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, ingredientId: value }
                                  : item,
                              ),
                            )
                          }
                          url="/admin/ingredients"
                          params={{ page: 1, pageSize: 100, status: "active" }}
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
                              current.map((item, itemIndex) =>
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
                            current.filter((_, itemIndex) => itemIndex !== index),
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
                      { ingredientId: null, grams: 100 },
                    ])
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  Ingredient qo'shish
                </Button>
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
