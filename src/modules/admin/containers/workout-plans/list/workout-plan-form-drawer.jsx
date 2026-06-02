import { useTranslation } from "react-i18next";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner.jsx";
import {
  APPROVAL_STATUS_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "./workout-plan-utils.js";

import map from "lodash/map";
import trim from "lodash/trim";

export function WorkoutPlanFormDrawer({
  open,
  onOpenChange,
  editingTemplate,
  form,
  setForm,
  isSaving,
  isLoading,
  onContinue,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            {editingTemplate
              ? t("admin.workoutPlans.form.editTitle")
              : t("admin.workoutPlans.form.createTitle")}
          </DrawerTitle>
          <DrawerDescription>
            {t("admin.workoutPlans.form.description")}
          </DrawerDescription>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center px-4 pb-4 sm:px-6">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 px-4 pb-4 sm:px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workout-plan-name">
                  {t("admin.workoutPlans.form.name")}
                </Label>
                <Input
                  id="workout-plan-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t("admin.workoutPlans.form.namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout-plan-description">
                  {t("admin.workoutPlans.form.planDescription")}
                </Label>
                <Textarea
                  id="workout-plan-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder={t("admin.workoutPlans.form.descriptionPlaceholder")}
                  className="min-h-28"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border bg-muted/20 p-4">
              <div className="space-y-2">
                  <Label>{t("admin.workoutPlans.form.difficulty")}</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("admin.workoutPlans.form.difficultyPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {map(DIFFICULTY_OPTIONS, (option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3">
                <div>
                  <p className="font-medium">
                    {t("admin.workoutPlans.form.showToUsers")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.workoutPlans.form.showToUsersDescription")}
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: Boolean(checked),
                    }))
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  <Label>{t("admin.workoutPlans.form.approval")}</Label>
                  <Select
                    value={form.approvalStatus}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        approvalStatus: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.workoutPlans.form.approvalPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {map(APPROVAL_STATUS_OPTIONS, (option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout-plan-approval-reason">
                    {t("admin.workoutPlans.form.reviewNote")}
                  </Label>
                  <Input
                    id="workout-plan-approval-reason"
                    value={form.approvalReason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        approvalReason: event.target.value,
                      }))
                    }
                    placeholder={t("admin.workoutPlans.form.reviewNotePlaceholder")}
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("admin.workoutPlans.form.preview")}
                </p>
                <p className="mt-3 text-lg font-black">
                  {trim(String(form.name ?? "")) ||
                    t("admin.workoutPlans.form.emptyName")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {trim(String(form.description ?? "")) ||
                    t("admin.workoutPlans.form.emptyDescription")}
                </p>
              </div>
            </div>
          </div>
        )}

        <DrawerFooter>
          <Button onClick={onContinue} disabled={isSaving || isLoading}>
            {t("admin.workoutPlans.form.continueToBuilder")}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {t("admin.common.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
