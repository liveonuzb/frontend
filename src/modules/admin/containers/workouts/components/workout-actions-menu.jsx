import React from "react";
import { useTranslation } from "react-i18next";
import {
  GlobeIcon,
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WorkoutActionsMenu = ({
  workout,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  canHardDelete = false,
  onTranslations,
}) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("admin.common.actions")}
        >
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      {workout.isTrashed ? (
        <>
          <DropdownMenuItem onClick={() => onRestore(workout)}>
            <RotateCcwIcon className="size-4 text-emerald-600" />
            {t("admin.workouts.list.restore")}
          </DropdownMenuItem>
          {canHardDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onHardDelete({
                  ids: [workout.id],
                  label: workout.name,
                })
              }
            >
              <Trash2Icon className="size-4" />
              {t("admin.workouts.delete.hardDeleteAction")}
            </DropdownMenuItem>
          ) : null}
        </>
      ) : (
        <>
          <DropdownMenuItem onClick={() => onTranslations(workout)}>
            <GlobeIcon className="size-4" />
            {t("admin.workouts.translations.title")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(workout)}>
            <PencilIcon className="size-4" />
            {t("admin.common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(workout)}
          >
            <Trash2Icon className="size-4" />
            {t("admin.common.delete")}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkoutActionsMenu;
