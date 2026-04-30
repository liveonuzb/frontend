import React from "react";
import {
  GlobeIcon,
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FoodActionsMenu = ({
  food,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onTranslations,
  onRecipe,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      {food.isTrashed ? (
        <>
          <DropdownMenuItem onClick={() => onRestore(food)}>
            <RotateCcwIcon className="size-4 text-emerald-600" />
            Tiklash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              onHardDelete({
                ids: [food.id],
                label: food.name,
              })
            }
          >
            <Trash2Icon className="size-4" />
            Butunlay o'chirish
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem onClick={() => onTranslations(food)}>
            <GlobeIcon className="size-4" />
            Tarjimalar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRecipe(food)}>
            <UtensilsIcon className="size-4" />
            Recipe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(food)}>
            <PencilIcon className="size-4" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(food)}
          >
            <Trash2Icon className="size-4" />
            O'chirish
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default FoodActionsMenu;
