import {
  filter,
  get,
  includes,
  map,
  size,
  toLower,
} from "lodash";
import React from "react";
import { SearchIcon, CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const WorkoutPlanAssignDrawer = ({
  open,
  onOpenChange,
  clients,
  selectedClientIds,
  onToggleClient,
  onSave,
  isAssigning,
  search,
  onSearchChange,
}) => {
  const { t } = useTranslation();

  const filteredClients = filter(clients, (client) =>
    includes(toLower(get(client, "name", "")), toLower(search)),
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>{t("coach.workoutPlans.drawers.assign.title")}</DrawerTitle>
          <DrawerDescription>{t("coach.workoutPlans.drawers.assign.description")}</DrawerDescription>
          <div className="mt-4">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("coach.workoutPlans.drawers.assign.searchPlaceholder")}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </InputGroup>
          </div>
        </DrawerHeader>
        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto pt-2">
          {size(filteredClients) === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {t("coach.workoutPlans.drawers.assign.noClients")}
            </div>
          ) : (
            map(filteredClients, (client) => (
              <button
                key={get(client, "id")}
                onClick={() => onToggleClient(get(client, "id"))}
                className={cn(
                  "flex w-full items-center justify-between p-4 transition-all rounded-2xl border",
                  includes(selectedClientIds, get(client, "id"))
                    ? "border-primary bg-primary/5 shadow-sm scale-[1.01]"
                    : "hover:bg-muted/50 border-transparent bg-muted/20 hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                      includes(selectedClientIds, get(client, "id"))
                        ? "bg-primary border-primary scale-110"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {includes(selectedClientIds, get(client, "id")) && (
                      <CheckIcon className="size-2.5 text-white stroke-[4]" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm truncate tracking-tight">{get(client, "name")}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      {t(`common.status.${get(client, "status", "active")}`)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <DrawerFooter className="px-6 py-4">
          <Button onClick={onSave} disabled={isAssigning} className="w-full">
            {t("coach.workoutPlans.drawers.assign.submit")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default WorkoutPlanAssignDrawer;
