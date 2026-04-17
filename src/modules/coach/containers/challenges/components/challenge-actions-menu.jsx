import {
  MoreVerticalIcon,
  PencilIcon,
  ShieldAlertIcon,
  Trash2Icon,
  SendIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChallengeActionsMenu = ({
  challenge,
  onEdit,
  onDelete,
  onShare,
  onRunIntegrity,
}) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("coach.challenges.actions.edit")}
        >
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(challenge)}>
          <PencilIcon className="size-4" />
          {t("coach.challenges.actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare(challenge)}>
          <SendIcon className="size-4" />
          {t("coach.challenges.actions.share")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRunIntegrity(challenge)}>
          <ShieldAlertIcon className="size-4" />
          Anti-cheat tekshiruv
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(challenge)}
        >
          <Trash2Icon className="size-4" />
          {t("coach.challenges.actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChallengeActionsMenu;
