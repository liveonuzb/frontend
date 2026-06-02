/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { useTranslation } from "react-i18next";
import chain from "lodash/chain";
import lodashFilter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import lodashMap from "lodash/map";
import lodashSortBy from "lodash/sortBy";
import trim from "lodash/trim";
import lodashValues from "lodash/values";
import forEach from "lodash/forEach";
import some from "lodash/some";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import { toast } from "sonner";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePostQuery, usePostFileQuery } from "@/hooks/api";
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
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { PlusIcon, Trash2Icon, UploadIcon, PencilIcon } from "lucide-react";
import { CatalogMultiSelectCombobox } from "@/components/catalog-multi-select-combobox";
import {
  getWorkoutTrackingFields,
  WORKOUT_TRACKING_OPTIONS,
  WORKOUT_TRACKING_TYPES,
} from "@/lib/workout-tracking";
import { getApiErrorMessage } from "@/lib/api-response";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";

const emptyForm = {
  name: "",
  isActive: true,
  isOnboarding: true,
  trackingType: WORKOUT_TRACKING_TYPES.REPS_WEIGHT,
  defaultSets: "3",
  defaultReps: "12",
  defaultDurationSeconds: "",
  defaultDistanceMeters: "",
  defaultRestSeconds: "60",
  categoryIds: [],
  youtubeUrl: "",
  targetMuscles: [],
  bodyParts: [],
  equipments: [],
  secondaryMuscles: [],
  instructions: [""],
  imageFile: null,
  removeImage: false,
  equipmentImageFiles: [],
  existingEquipmentImages: [],
  removeEquipmentImages: false,
  translations: {},
};

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = find(lodashValues(translations), (value) => trim(String(value)));
    if (first) return trim(String(first));
  }

  return fallback;
};

const ImageUploadPreview = ({
  file,
  existingUrl,
  onChange,
  onRemove,
  isRemoving,
  label,
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = React.useState(null);
  const resolvedLabel = label || t("admin.workouts.form.image");

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const removeHandler = React.useCallback(
    (event) => {
      event.stopPropagation();
      onRemove();
    },
    [onRemove],
  );

  const displayUrl = preview || (!isRemoving ? existingUrl : null);

  return (
    <div className="relative group size-24 shrink-0 rounded-2xl border bg-muted overflow-hidden flex items-center justify-center cursor-pointer">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Mashq rasmi faylini tanlash"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={(event) => {
          const f = event.target.files?.[0];
          if (f) {
            onChange(f);
          }
          event.target.value = "";
        }}
      />

      {displayUrl ? (
        <>
          <img
            loading="lazy"
            src={displayUrl}
            alt={resolvedLabel}
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 z-20">
            <span className="text-[10px] font-medium text-white shadow-sm mt-4">
              {t("admin.workouts.form.changeImage")}
            </span>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 size-6 rounded-full scale-0 transition-transform group-hover:scale-100 z-30 opacity-90 hover:opacity-100"
            onClick={removeHandler}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <UploadIcon className="size-4" />
          <span className="text-[10px] font-medium">{resolvedLabel}</span>
        </div>
      )}
    </div>
  );
};

const InlineNumberField = ({
  value,
  onChange,
  minValue = 0,
  step = 1,
  placeholder = "0",
  formatOptions,
}) => (
  <NumberField
    value={value !== "" ? toNumber(value) : undefined}
    onValueChange={(nextValue) =>
      onChange(nextValue !== undefined ? String(nextValue) : "")
    }
    minValue={minValue}
    step={step}
    formatOptions={formatOptions}
  >
    <NumberFieldGroup className="h-10 rounded-xl bg-background">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput placeholder={placeholder} className="px-3 text-sm" />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);

const createWorkoutPayload = (form, language) => {
  const localizedName = trim(form.name);
  const cleanNumber = (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const nextValue = toNumber(value);
    return Number.isFinite(nextValue) ? nextValue : undefined;
  };

  const cleanArray = (arr) =>
    isArray(arr)
      ? lodashMap(chain(arr), (s) => trim(String(s)))
          .compact()
          .value()
      : [];

  return {
    name: localizedName,
    trackingType: form.trackingType,
    defaultSets: cleanNumber(form.defaultSets) ?? 1,
    defaultReps: cleanNumber(form.defaultReps),
    defaultDurationSeconds: cleanNumber(form.defaultDurationSeconds),
    defaultDistanceMeters: cleanNumber(form.defaultDistanceMeters),
    defaultRestSeconds: cleanNumber(form.defaultRestSeconds) ?? 0,
    categoryIds: form.categoryIds,
    youtubeUrl: trim(form.youtubeUrl),
    targetMuscles: cleanArray(form.targetMuscles),
    bodyParts: cleanArray(form.bodyParts),
    equipments: cleanArray(form.equipments),
    secondaryMuscles: cleanArray(form.secondaryMuscles),
    instructions: cleanArray(form.instructions),
    isActive: form.isActive,
    isOnboarding: form.isOnboarding !== false,
    translations: {
      ...form.translations,
      [language]: localizedName,
    },
    removeImage: form.removeImage || false,
    removeEquipmentImages: form.removeEquipmentImages || false,
  };
};

const ArrayField = ({
  values: fieldValues,
  onChange,
  label,
  placeholder,
  description,
}) => {
  const handleAddItem = () => onChange([...fieldValues, ""]);
  const handleRemoveItem = (index) => {
    if (fieldValues.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(lodashFilter(fieldValues, (_, i) => i !== index));
  };
  const handleUpdateItem = (index, value) =>
    onChange(lodashMap(fieldValues, (v, i) => (i === index ? value : v)));

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {lodashMap(fieldValues, (value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveItem(index)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
        <PlusIcon className="size-3" />
        Qo&apos;shish
      </Button>
    </div>
  );
};

const buildCatalogOptions = (items, selectedValues, language) => {
  const baseOptions = lodashMap((isArray(items) ? items : []), (item) => ({
    value: item.name,
    label: resolveLabel(item.translations, item.name, language),
    isActive: item.isActive,
  }));
  const knownValues = new Set(lodashMap(baseOptions, (option) => option.value));

  forEach((isArray(selectedValues) ? selectedValues : []), (value) => {
    const normalized = trim(String(value));
    if (normalized && !knownValues.has(normalized)) {
      baseOptions.push({
        value: normalized,
        label: normalized,
        isActive: false,
      });
      knownValues.add(normalized);
    }
  });

  return lodashSortBy(baseOptions, (option) =>
    option.label.toLocaleLowerCase("uz"),
  );
};

const WORKOUTS_QUERY_KEY = ["admin-workouts"];
const WORKOUTS_LIST_PATH = "/admin/workouts/list";

const CreateWorkoutPage = () => {
  const { t } = useTranslation();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(WORKOUTS_LIST_PATH);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/workout-categories",
    queryProps: { queryKey: ["admin", "workout-categories"] },
  });
  const categories = get(categoriesData, "data.data", []);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const { data: equipmentsData } = useGetQuery({
    url: "/admin/workout-equipments",
    queryProps: { queryKey: ["admin", "workout-equipments"] },
  });
  const workoutEquipments = get(equipmentsData, "data.data", []);

  const { data: musclesData } = useGetQuery({
    url: "/admin/workout-muscles",
    queryProps: { queryKey: ["admin", "workout-muscles"] },
  });
  const workoutMuscles = get(musclesData, "data.data", []);

  const { data: bodyPartsData } = useGetQuery({
    url: "/admin/workout-body-parts",
    queryProps: { queryKey: ["admin", "workout-body-parts"] },
  });
  const workoutBodyParts = get(bodyPartsData, "data.data", []);

  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );

  const currentLanguageMeta = React.useMemo(
    () =>
      find(activeLanguages, (language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const createMutation = usePostQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const imageUploadMutation = usePostFileQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });

  const [form, setForm] = React.useState(emptyForm);

  const muscleOptions = React.useMemo(
    () =>
      buildCatalogOptions(workoutMuscles, form.targetMuscles, currentLanguage),
    [currentLanguage, form.targetMuscles, workoutMuscles],
  );
  const bodyPartOptions = React.useMemo(
    () =>
      buildCatalogOptions(workoutBodyParts, form.bodyParts, currentLanguage),
    [currentLanguage, form.bodyParts, workoutBodyParts],
  );
  const equipmentOptions = React.useMemo(
    () =>
      buildCatalogOptions(workoutEquipments, form.equipments, currentLanguage),
    [currentLanguage, form.equipments, workoutEquipments],
  );

  const trackingFields = React.useMemo(
    () => getWorkoutTrackingFields(form.trackingType),
    [form.trackingType],
  );

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await imageUploadMutation.mutateAsync({
      url: "/admin/workout-images",
      attributes: formData,
      config: { headers: { "Content-Type": "multipart/form-data" } },
    });
    return get(response, "data.id", null);
  };

  const handleSave = async () => {
    if (!trim(form.name) || form.categoryIds.length === 0) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    const payload = createWorkoutPayload(form, currentLanguage);

    try {
      let imageId = null;
      if (form.imageFile) {
        imageId = await uploadImage(form.imageFile);
      }

      const equipmentImageIds = [];
      for (const file of form.equipmentImageFiles) {
        if (file) {
          const id = await uploadImage(file);
          if (id) equipmentImageIds.push(id);
        }
      }

      const finalPayload = { ...payload };
      if (imageId) finalPayload.imageId = imageId;
      if (equipmentImageIds.length > 0)
        finalPayload.equipmentImageIds = equipmentImageIds;

      await createMutation.mutateAsync({
        url: "/admin/workouts",
        attributes: finalPayload,
      });
      toast.success(t("admin.workouts.form.createSuccess"));
      closeAdminDrawer();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("admin.workouts.form.saveError")));
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      closeAdminDrawer();
    }
  };

  const isCreating = createMutation.isPending;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <PlusIcon className="size-5" />
            {t("admin.workouts.form.createTitle")}
          </DrawerTitle>
          <DrawerDescription>
            {t("admin.workouts.form.createDescription")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-5">
          <div className="rounded-2xl border px-4 py-3 text-sm">
            <p className="font-medium">
              {t("admin.workouts.form.currentLanguage")}{" "}
              {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
              {currentLanguageMeta?.name ?? toUpper(currentLanguage)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                {t("admin.workouts.form.name")} ({toUpper(currentLanguage)}) *
              </Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder={t("admin.workouts.form.namePlaceholder")}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div>
                <Label>{t("admin.common.status")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.workouts.form.statusDescription")}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isActive: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div>
                <Label>{t("admin.workouts.form.showOnboarding")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("admin.workouts.form.showOnboardingDescription")}
                </p>
              </div>
              <Switch
                checked={form.isOnboarding}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isOnboarding: checked,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("admin.workouts.form.media")}</Label>
            <div className="flex items-start gap-4">
              <ImageUploadPreview
                file={form.imageFile}
                existingUrl={null}
                isRemoving={form.removeImage}
                onChange={(file) =>
                  setForm((current) => ({
                    ...current,
                    imageFile: file,
                    removeImage: false,
                  }))
                }
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    imageFile: null,
                    removeImage: true,
                  }))
                }
              />
              <div className="flex-1">
                <Input
                  value={form.youtubeUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      youtubeUrl: event.target.value,
                    }))
                  }
                  placeholder={t("admin.workouts.form.youtubePlaceholder")}
                  type="url"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("admin.workouts.form.categories")} *</Label>
            <div className="flex flex-wrap gap-2">
              {lodashMap(categories, (category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={
                    includes(form.categoryIds, category.id)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      categoryIds: includes(current.categoryIds, category.id)
                        ? lodashFilter(
                            current.categoryIds,
                            (item) => item !== category.id,
                          )
                        : [...current.categoryIds, category.id],
                    }))
                  }
                >
                  {resolveLabel(
                    category.translations,
                    category.name,
                    currentLanguage,
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("admin.workouts.form.trackingType")}</Label>
              <Select
                value={form.trackingType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    trackingType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("admin.workouts.form.trackingTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {lodashMap(WORKOUT_TRACKING_OPTIONS, (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.workouts.form.defaultSets")}</Label>
              <InlineNumberField
                value={form.defaultSets}
                onChange={(value) =>
                  setForm((current) => ({ ...current, defaultSets: value }))
                }
                minValue={1}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.workouts.form.restSeconds")}</Label>
              <InlineNumberField
                value={form.defaultRestSeconds}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    defaultRestSeconds: value,
                  }))
                }
                minValue={0}
                placeholder="60"
              />
            </div>

            {some(trackingFields, (field) => field.key === "reps") ? (
              <div className="space-y-2">
                <Label>{t("admin.workouts.form.defaultReps")}</Label>
                <InlineNumberField
                  value={form.defaultReps}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, defaultReps: value }))
                  }
                  minValue={0}
                  placeholder="12"
                />
              </div>
            ) : null}

            {some(trackingFields, (field) => field.key === "durationSeconds") ? (
              <div className="space-y-2">
                <Label>{t("admin.workouts.form.defaultDuration")}</Label>
                <InlineNumberField
                  value={form.defaultDurationSeconds}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      defaultDurationSeconds: value,
                    }))
                  }
                  minValue={0}
                  placeholder="600"
                />
              </div>
            ) : null}

            {some(trackingFields, (field) => field.key === "distanceMeters") ? (
              <div className="space-y-2">
                <Label>{t("admin.workouts.form.defaultDistance")}</Label>
                <InlineNumberField
                  value={form.defaultDistanceMeters}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      defaultDistanceMeters: value,
                    }))
                  }
                  minValue={0}
                  placeholder="2000"
                />
              </div>
            ) : null}
          </div>

          <CatalogMultiSelectCombobox
            label={t("admin.workouts.form.primaryMuscles")}
            description={t("admin.workouts.form.musclesDescription")}
            options={muscleOptions}
            values={form.targetMuscles}
            onChange={(vals) =>
              setForm((current) => ({ ...current, targetMuscles: vals }))
            }
            emptyText={t("admin.workouts.form.musclesEmpty")}
          />

          <CatalogMultiSelectCombobox
            label={t("admin.workouts.form.secondaryMuscles")}
            description={t("admin.workouts.form.secondaryMusclesDescription")}
            options={muscleOptions}
            values={form.secondaryMuscles}
            onChange={(vals) =>
              setForm((current) => ({
                ...current,
                secondaryMuscles: vals,
              }))
            }
            emptyText={t("admin.workouts.form.musclesEmpty")}
          />

          <CatalogMultiSelectCombobox
            label={t("admin.workouts.form.bodyParts")}
            description={t("admin.workouts.form.bodyPartsDescription")}
            options={bodyPartOptions}
            values={form.bodyParts}
            onChange={(vals) =>
              setForm((current) => ({ ...current, bodyParts: vals }))
            }
            emptyText={t("admin.workouts.form.bodyPartsEmpty")}
          />

          <CatalogMultiSelectCombobox
            label={t("admin.workouts.form.equipment")}
            description={t("admin.workouts.form.equipmentDescription")}
            options={equipmentOptions}
            values={form.equipments}
            onChange={(vals) =>
              setForm((current) => ({ ...current, equipments: vals }))
            }
            emptyText={t("admin.workouts.form.equipmentEmpty")}
          />

          <ArrayField
            label={t("admin.workouts.form.instructions")}
            description={t("admin.workouts.form.instructionsDescription")}
            values={form.instructions}
            onChange={(vals) =>
              setForm((current) => ({ ...current, instructions: vals }))
            }
            placeholder={t("admin.workouts.form.instructionPlaceholder")}
          />
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={isCreating}>
            {t("admin.common.create")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateWorkoutPage;
