import React from "react";
import { Trash2Icon } from "lucide-react";
import map from "lodash/map";
import round from "lodash/round";
import toNumber from "lodash/toNumber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import RecipeImage from "./recipe-image.jsx";

const unitOptions = ["g", "ml", "dona", "osh qoshiq", "choy qoshiq"];

const productOptions = [
  "Tovuq filesi",
  "Quinoa",
  "Avokado",
  "Cherry pomidor",
  "Bodring",
  "Zaytun yog'i",
  "Brokoli",
  "Sabzi",
];

const scaleValue = (ingredient, key) => {
  const baseQuantity = Math.max(0.01, toNumber(ingredient.baseQuantity || ingredient.quantity || 1));
  const scale = (toNumber(ingredient.quantity) || 0) / baseQuantity;

  return round((toNumber(ingredient[key]) || 0) * scale, 1);
};

const IngredientRow = ({ ingredient, onChange, onDelete }) => (
  <TableRow>
    <TableCell className="min-w-56">
      <div className="flex items-center gap-3">
        <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
          <RecipeImage src={ingredient.imageUrl} alt={ingredient.name} />
        </div>
        <Select
          value={ingredient.name}
          onValueChange={(value) => onChange(ingredient.id, { name: value })}
        >
          <SelectTrigger aria-label={`${ingredient.name} mahsulot`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {map(productOptions, (option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </TableCell>
    <TableCell className="min-w-28">
      <Input
        type="number"
        min="0"
        aria-label={`${ingredient.name} miqdori`}
        value={ingredient.quantity}
        onChange={(event) =>
          onChange(ingredient.id, { quantity: event.target.value })
        }
      />
    </TableCell>
    <TableCell className="min-w-28">
      <Select
        value={ingredient.unit}
        onValueChange={(value) => onChange(ingredient.id, { unit: value })}
      >
        <SelectTrigger aria-label={`${ingredient.name} birligi`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {map(unitOptions, (option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell>
      <Switch
        checked={ingredient.isRequired}
        aria-label={`${ingredient.name} majburiy`}
        onCheckedChange={(checked) =>
          onChange(ingredient.id, { isRequired: checked })
        }
      />
    </TableCell>
    <TableCell className="min-w-44">
      <Input
        aria-label={`${ingredient.name} izohi`}
        value={ingredient.note || ""}
        placeholder="Izoh qo'shish..."
        onChange={(event) => onChange(ingredient.id, { note: event.target.value })}
      />
    </TableCell>
    <TableCell className="min-w-44">
      <div className="grid grid-cols-4 gap-2 text-xs">
        <span>
          <span className="block text-muted-foreground">Kkal</span>
          <span className="font-semibold">{Math.round(scaleValue(ingredient, "calories"))}</span>
        </span>
        <span>
          <span className="block text-muted-foreground">P</span>
          <span className="font-semibold">{scaleValue(ingredient, "protein")}g</span>
        </span>
        <span>
          <span className="block text-muted-foreground">Y</span>
          <span className="font-semibold">{scaleValue(ingredient, "fat")}g</span>
        </span>
        <span>
          <span className="block text-muted-foreground">U</span>
          <span className="font-semibold">{scaleValue(ingredient, "carbs")}g</span>
        </span>
      </div>
    </TableCell>
    <TableCell>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${ingredient.name}ni o'chirish`}
        onClick={() => onDelete(ingredient.id)}
      >
        <Trash2Icon />
      </Button>
    </TableCell>
  </TableRow>
);

export default IngredientRow;
