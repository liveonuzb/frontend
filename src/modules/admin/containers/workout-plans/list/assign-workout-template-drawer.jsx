import React from "react";
import { useTranslation } from "react-i18next";
import compact from "lodash/compact";
import get from "lodash/get";
import join from "lodash/join";
import map from "lodash/map";
import trim from "lodash/trim";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner.jsx";
import { cn } from "@/lib/utils";

const EMPTY_USERS = [];

function getUserLabel(user) {
  const fullName = trim(
    join(
      compact([get(user, "profile.firstName"), get(user, "profile.lastName")]),
      " ",
    ),
  );
  const contact = trim(String(user.email || user.phone || ""));

  if (fullName && contact) {
    return `${fullName} - ${contact}`;
  }

  return fullName || contact || user.id;
}

export function AssignWorkoutTemplateDrawer({
  open,
  onOpenChange,
  template,
  users = EMPTY_USERS,
  isLoadingUsers = false,
  isAssigning = false,
  onAssign,
}) {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [scheduledFor, setScheduledFor] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;
      setSelectedUserId("");
      setScheduledFor("");
      setNotes("");
    });

    return () => {
      isCancelled = true;
    };
  }, [open, template?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedUserId || !template?.id || isAssigning) {
      return;
    }

    onAssign?.({
      userId: selectedUserId,
      templateId: template.id,
      scheduledFor: scheduledFor || undefined,
      notes: trim(String(notes ?? "")) || undefined,
    });
  };

  const isSubmitDisabled =
    !selectedUserId || !template?.id || isLoadingUsers || isAssigning;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{t("admin.workoutPlans.assign.title")}</DrawerTitle>
            <DrawerDescription>
              {template?.name
                ? t("admin.workoutPlans.assign.descriptionWithName", {
                    name: template.name,
                  })
                : t("admin.workoutPlans.assign.description")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-4 px-4 pb-2 sm:px-6">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                {template?.name || t("admin.workoutPlans.assign.templateFallback")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.workoutPlans.assign.templateStats", {
                  daysPerWeek: template?.daysPerWeek || 0,
                  days: template?.days || 0,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-assignment-user">
                {t("admin.workoutPlans.assign.user")}
              </Label>
              <div className="relative">
                <select
                  id="workout-assignment-user"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={isLoadingUsers || isAssigning}
                  className={cn(
                    "border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <option value="">
                    {t("admin.workoutPlans.assign.userPlaceholder")}
                  </option>
                  {map(users, (user) => (
                    <option key={user.id} value={user.id}>
                      {getUserLabel(user)}
                    </option>
                  ))}
                </select>
                {isLoadingUsers ? (
                  <Spinner className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                ) : null}
              </div>
              {!isLoadingUsers && users.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("admin.workoutPlans.assign.noActiveUsers")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-assignment-schedule">
                {t("admin.workoutPlans.assign.scheduleDate")}
              </Label>
              <Input
                id="workout-assignment-schedule"
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                disabled={isAssigning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-assignment-note">
                {t("admin.workoutPlans.assign.assignmentNote")}
              </Label>
              <Textarea
                id="workout-assignment-note"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isAssigning}
                className="min-h-24"
                placeholder={t("admin.workoutPlans.assign.notePlaceholder")}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isAssigning
                ? t("admin.workoutPlans.assign.assigning")
                : t("admin.workoutPlans.assign.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isAssigning}
            >
              {t("admin.common.cancel")}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
