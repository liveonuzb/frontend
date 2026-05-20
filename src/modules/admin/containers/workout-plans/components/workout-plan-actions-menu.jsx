import React from "react";
import { useTranslation } from "react-i18next";
import {
  Globe2Icon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminWorkoutPlanActionsMenu = ({
  template,
  onEdit,
  onDelete,
  onTranslations,
  onAssign,
  canAssign,
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
      <DropdownMenuItem onClick={() => onTranslations(template)}>
        <Globe2Icon className="size-4" />
        {t("admin.workoutPlans.translations.title")}
      </DropdownMenuItem>
      {canAssign &&
      template?.isActive &&
      template?.approvalStatus === "approved" ? (
        <DropdownMenuItem onClick={() => onAssign(template)}>
          <UserPlusIcon className="size-4" />
          {t("admin.workoutPlans.assign.submit")}
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onClick={() => onEdit(template)}>
        <PencilIcon className="size-4" />
        {t("admin.common.edit")}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onClick={() => onDelete(template)}
      >
        <Trash2Icon className="size-4" />
        {t("admin.common.delete")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  );
};

export default AdminWorkoutPlanActionsMenu;
