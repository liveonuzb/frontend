import React from "react";
import { get } from "lodash";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2Icon,
  LoaderCircleIcon,
  ImagePlusIcon,
  XIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

const getMetricTypeMeta = (t) => ({
  STEPS: {
    label: t("coach.challenges.metricTypes.steps.label"),
    unit: t("coach.challenges.metricTypes.steps.unit"),
  },
  WORKOUT_MINUTES: {
    label: t("coach.challenges.metricTypes.workoutMinutes.label"),
    unit: t("coach.challenges.metricTypes.workoutMinutes.unit"),
  },
  BURNED_CALORIES: {
    label: t("coach.challenges.metricTypes.burnedCalories.label"),
    unit: t("coach.challenges.metricTypes.burnedCalories.unit"),
  },
  SLEEP_HOURS: {
    label: t("coach.challenges.metricTypes.sleepHours.label"),
    unit: t("coach.challenges.metricTypes.sleepHours.unit"),
  },
});

const getMetricAggregationMeta = (t) => ({
  SUM: t("coach.challenges.aggregations.sum"),
  AVERAGE: t("coach.challenges.aggregations.average"),
});

const ChallengeFormDrawer = ({
  open,
  onOpenChange,
  editingChallenge,
  formData,
  setFormData,
  isSubmitting,
  isLoading,
  clients,
  groups,
  onSave,
  onImageChange,
  onImageRemove,
}) => {
  const { t } = useTranslation();

  const isPlacePercentInput =
    formData.rewardMode === "PLACE_XP" && Number(formData.joinFeeXp || 0) > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="outline-none">
        <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
          <DrawerTitle className="text-foreground text-xl font-bold text-center">
            {editingChallenge
              ? t("coach.challenges.drawer.editTitle")
              : t("coach.challenges.drawer.newTitle")}
          </DrawerTitle>
          <DrawerDescription className="text-center">
            {t("coach.challenges.drawer.description")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-8 py-6">
          {/* Basic Info */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              {t("coach.challenges.drawer.sections.basicInfo")}
            </span>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
              <Field>
                <FieldLabel className="flex items-center gap-2 font-semibold">
                  <ImagePlusIcon className="size-4 text-primary" />
                  {t("coach.challenges.drawer.fields.coverImage")}
                </FieldLabel>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                    {formData.imagePreviewUrl ? (
                      <img
                        src={formData.imagePreviewUrl}
                        alt="Challenge cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImagePlusIcon className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onImageChange}
                        />
                        {t("coach.challenges.drawer.fields.selectImage")}
                      </label>
                    </Button>
                    {formData.imagePreviewUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onImageRemove}
                      >
                        <XIcon className="mr-1 size-4" />
                        {t("coach.challenges.drawer.fields.removeImage")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Field>

              <Field>
                <FieldLabel className="font-semibold">
                  {t("coach.challenges.drawer.fields.title")}
                </FieldLabel>
                <Input
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={t("coach.challenges.drawer.fields.titlePlaceholder")}
                  className="rounded-xl"
                />
              </Field>

              <Field>
                <FieldLabel className="font-semibold">
                  {t("coach.challenges.drawer.fields.descriptionLabel")}
                </FieldLabel>
                <Input
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder={t("coach.challenges.drawer.fields.descriptionPlaceholder")}
                  className="rounded-xl"
                />
              </Field>
            </div>
          </div>

          {/* Time and Status */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              {t("coach.challenges.drawer.sections.timeAndStatus")}
            </span>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
              <Field>
                <FieldLabel className="font-semibold">
                  {t("coach.challenges.drawer.fields.status")}
                </FieldLabel>
                <ToggleGroup
                  type="single"
                  value={formData.status}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData((current) => ({ ...current, status: value }));
                    }
                  }}
                  className="w-full justify-start rounded-xl border p-1"
                >
                  <ToggleGroupItem value="UPCOMING" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.status.upcoming")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="ACTIVE" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.status.active")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="COMPLETED" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.status.completed")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="CANCELLED" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.status.cancelled")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.startTime")}
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, startDate: event.target.value }))
                    }
                    className="rounded-xl"
                  />
                </Field>
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.endTime")}
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, endDate: event.target.value }))
                    }
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              {t("coach.challenges.drawer.sections.settings")}
            </span>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.joinFee")}
                  </FieldLabel>
                  <NumberField
                    value={formData.joinFeeXp !== "" ? Number(formData.joinFeeXp) : undefined}
                    onValueChange={(val) =>
                      setFormData((current) => ({
                        ...current,
                        joinFeeXp: val !== undefined ? String(val) : "",
                      }))
                    }
                    step={10}
                    minValue={0}
                    formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder="0" />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.maxParticipants")}
                  </FieldLabel>
                  <NumberField
                    value={formData.maxParticipants !== "" ? Number(formData.maxParticipants) : undefined}
                    onValueChange={(val) =>
                      setFormData((current) => ({
                        ...current,
                        maxParticipants: val !== undefined ? String(val) : "",
                      }))
                    }
                    step={1}
                    minValue={1}
                    formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder={t("coach.challenges.drawer.fields.infinite")} />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
              </div>

              <Field>
                <FieldLabel className="font-semibold">
                  {t("coach.challenges.drawer.fields.rewardMode")}
                </FieldLabel>
                <ToggleGroup
                  type="single"
                  value={formData.rewardMode}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData((current) => ({ ...current, rewardMode: value }));
                    }
                  }}
                  className="w-full justify-start rounded-xl border p-1"
                >
                  <ToggleGroupItem value="FIXED_XP" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.rewardModes.fixedXp.label")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="PERCENT_OF_POOL" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.rewardModes.percentOfPool.label")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="PLACE_XP" className="flex-1 rounded-lg text-xs md:text-sm">
                    {t("coach.challenges.rewardModes.placeXp.label")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.metric")}
                  </FieldLabel>
                  <Select
                    value={formData.metricType}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, metricType: value }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(getMetricTypeMeta(t)).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.aggregation")}
                  </FieldLabel>
                  <Select
                    value={formData.metricAggregation}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, metricAggregation: value }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(getMetricAggregationMeta(t)).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.target")} (
                    {getMetricTypeMeta(t)[formData.metricType]?.unit || "unit"})
                  </FieldLabel>
                  <NumberField
                    value={formData.metricTarget !== "" ? Number(formData.metricTarget) : undefined}
                    onValueChange={(val) =>
                      setFormData((current) => ({
                        ...current,
                        metricTarget: val !== undefined ? String(val) : "",
                      }))
                    }
                    step={0.01}
                    minValue={0.01}
                    formatOptions={{ signDisplay: "never", maximumFractionDigits: 2 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder="0" />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
              </div>

              {formData.rewardMode === "FIXED_XP" && (
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.totalReward")}
                  </FieldLabel>
                  <NumberField
                    value={formData.rewardXp !== "" ? Number(formData.rewardXp) : undefined}
                    onValueChange={(val) =>
                      setFormData((current) => ({
                        ...current,
                        rewardXp: val !== undefined ? String(val) : "",
                      }))
                    }
                    step={10}
                    minValue={0}
                    formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder="0" />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
              )}

              {formData.rewardMode === "PERCENT_OF_POOL" && (
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.rewardPercent")}
                  </FieldLabel>
                  <NumberField
                    value={formData.rewardPercent !== "" ? Number(formData.rewardPercent) : undefined}
                    onValueChange={(val) =>
                      setFormData((current) => ({
                        ...current,
                        rewardPercent: val !== undefined ? String(val) : "",
                      }))
                    }
                    step={0.01}
                    minValue={0.01}
                    maxValue={100}
                    formatOptions={{ signDisplay: "never", maximumFractionDigits: 2 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement />
                      <NumberFieldInput placeholder="0" />
                      <NumberFieldIncrement />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
              )}

              {formData.rewardMode === "PLACE_XP" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {isPlacePercentInput
                      ? t("coach.challenges.drawer.fields.placeInfoPercent")
                      : t("coach.challenges.drawer.fields.placeInfoFixed")}
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { key: "firstPlaceXp", place: 1 },
                      { key: "secondPlaceXp", place: 2 },
                      { key: "thirdPlaceXp", place: 3 },
                    ].map(({ key, place }) => (
                      <Field key={key}>
                        <FieldLabel className="font-semibold">
                          {t("coach.challenges.drawer.fields.placeLabel", { place })}{" "}
                          ({isPlacePercentInput ? "%" : "XP"})
                        </FieldLabel>
                        <NumberField
                          value={formData[key] !== "" ? Number(formData[key]) : undefined}
                          onValueChange={(val) =>
                            setFormData((current) => ({
                              ...current,
                              [key]: val !== undefined ? String(val) : "",
                            }))
                          }
                          step={1}
                          minValue={0}
                          maxValue={isPlacePercentInput ? 100 : 1000000}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement />
                            <NumberFieldInput placeholder="0" />
                            <NumberFieldIncrement />
                          </NumberFieldGroup>
                        </NumberField>
                      </Field>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
              {t("coach.challenges.drawer.sections.participants")}
            </span>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-2 p-4">
              {groups.length > 0 ? (
                <Field className="mb-3">
                  <FieldLabel className="font-semibold">Group challenge</FieldLabel>
                  <Select
                    value={formData.coachGroupId || "none"}
                    onValueChange={(value) => {
                      const groupId = value === "none" ? "" : value;
                      const group = groups.find((item) => item.id === groupId);
                      setFormData((current) => ({
                        ...current,
                        coachGroupId: groupId,
                        participantIds: groupId
                          ? get(group, "clientIds", [])
                          : current.participantIds,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Guruh tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Guruhsiz</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.memberCount || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
              <p className="text-xs text-muted-foreground mb-2">
                {t("coach.challenges.drawer.fields.participantsDescription")}
              </p>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                {clients.map((client) => {
                  const isSelected = formData.participantIds.includes(client.id);
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          participantIds: isSelected
                            ? prev.participantIds.filter((id) => id !== client.id)
                            : [...prev.participantIds, client.id],
                        }));
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={client.avatar} alt={client.name} />
                          <AvatarFallback className="text-[10px]">
                            {(client.name || "").split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {client.email || client.phone}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <CheckCircle2Icon className="size-3" />}
                      </div>
                    </div>
                  );
                })}
                {clients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("coach.challenges.drawer.fields.noClients")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter className="mt-5">
          <Button
            onClick={onSave}
            disabled={isSubmitting || isLoading}
            className="gap-2"
          >
            {isSubmitting ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <CheckCircle2Icon className="size-4" />
            )}
            {editingChallenge
              ? t("coach.challenges.actions.save")
              : t("coach.challenges.actions.create")}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("coach.challenges.actions.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ChallengeFormDrawer;
