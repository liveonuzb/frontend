import React from "react";
import { PlusIcon } from "lucide-react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import IngredientRow from "./ingredient-row.jsx";
import NutritionSummary from "./nutrition-summary.jsx";
import { getIngredientsNutrition } from "../recipe-ui-utils.js";

const summaryItems = [
  { key: "calories", label: "Kkal", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fat", label: "Yog'", unit: "g" },
  { key: "carbs", label: "Uglevod", unit: "g" },
  { key: "fiber", label: "Tolalar", unit: "g" },
  { key: "sugar", label: "Shakar", unit: "g" },
  { key: "sodium", label: "Natriy", unit: "mg" },
];

const RecipeIngredientsStep = ({
  ingredients,
  issues = [],
  onIngredientChange,
  onIngredientAdd,
  onIngredientDelete,
}) => {
  const nutrition = React.useMemo(
    () => getIngredientsNutrition(ingredients),
    [ingredients],
  );

  return (
    <div className="flex flex-col gap-5">
      {issues.length ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-semibold text-destructive">
              Ingredientlarni tekshiring
            </h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {map(issues, (issue) => (
                <p key={issue.id}>{issue.message}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Miqdor</TableHead>
                <TableHead>Birlik</TableHead>
                <TableHead>Majburiy</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Oziqaviy qiymat</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {map(ingredients, (ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onChange={onIngredientChange}
                  onDelete={onIngredientDelete}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={onIngredientAdd}
      >
        <PlusIcon data-icon="inline-start" />
        Ingredient qo'shish
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Umumiy oziqaviy qiymat (1 porsiya)
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Qiymatlar taxminiy bo'lib, ingredient brendlari va tayyorlash usuliga qarab o'zgarishi mumkin.
            </p>
          </div>
          <NutritionSummary
            nutrition={nutrition}
            items={summaryItems}
            className="sm:grid-cols-4 xl:grid-cols-7"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeIngredientsStep;
