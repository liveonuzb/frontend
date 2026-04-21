import { CheckCheckIcon, RotateCcwIcon, Trash2Icon, MoreHorizontalIcon } from "lucide-react";
import { get } from "lodash";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NotificationActionsMenu = ({ notification, onMarkRead, onSoftDelete, onRestore, onHardDelete }) => {
  const isTrashed = get(notification, "deletedAt") != null;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isTrashed && (
            <DropdownMenuItem onClick={() => onMarkRead(notification)}>
              <CheckCheckIcon className="size-4 mr-2" />
              O&apos;qilgan deb belgilash
            </DropdownMenuItem>
          )}
          {!isTrashed && <DropdownMenuSeparator />}
          {isTrashed ? (
            <>
              <DropdownMenuItem onClick={() => onRestore(notification)}>
                <RotateCcwIcon className="size-4 mr-2" />
                Tiklash
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  onHardDelete({
                    ids: [notification.id],
                    label: get(notification, "title", "Bildirishnoma"),
                  })
                }
              >
                <Trash2Icon className="size-4 mr-2" />
                Butunlay o&apos;chirish
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onSoftDelete(notification)}
            >
              <Trash2Icon className="size-4 mr-2" />
              Trashga yuborish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationActionsMenu;
