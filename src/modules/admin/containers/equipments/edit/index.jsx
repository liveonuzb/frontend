import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, find, trim } from "lodash";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  CheckCircle2Icon,
  ImageIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  WrenchIcon,
} from "lucide-react";
import { toast } from "sonner";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && trim(direct)) return trim(direct);
    const uz = get(translations, "uz");
    if (typeof uz === "string" && trim(uz)) return trim(uz);
    const first = find(
      Object.values(translations),
      (v) => typeof v === "string" && trim(v),
    );
    if (typeof first === "string" && trim(first)) return trim(first);
  }
  return fallback;
};

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
};

const cleanTranslations = (translations = {}) =>
  Object.fromEntries(
    Object.entries(translations)
      .map(([key, value]) => [key.trim(), String(value ?? "").trim()])
      .filter(([key, value]) => Boolean(key) && Boolean(value)),
  );

const ImageUploadPreview = ({
  file,
  existingUrl,
  onChange,
  onRemove,
  label = "Rasm",
}) => {
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = preview || existingUrl;

  return (
    <div className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border bg-muted">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) onChange(nextFile);
          event.target.value = "";
        }}
      />
      {displayUrl ? (
        <>
          <img loading="lazy"
            src={displayUrl}
            alt="Preview"
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 top-1/2 z-20 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <span className="mt-4 text-[10px] font-medium text-white shadow-sm">
              O'zgartirish
            </span>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 z-30 size-6 rounded-full opacity-90 transition-transform group-hover:scale-100 hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <UploadIcon className="size-4" />
          <span className="text-[10px] font-medium">{label}</span>
        </div>
      )}
    </div>
  );
};

const EditEquipment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: equipmentsData, isLoading } = useGetQuery({
    url: "/admin/workout-equipments",
    queryProps: { queryKey: ["admin", "workout-equipments"] },
  });
  const equipments = get(equipmentsData, "data.data", []);
  const equipment = find(equipments, (e) => String(e.id) === String(id));

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);
  const activeLanguages = React.useMemo(
    () => languages.filter((l) => l.isActive),
    [languages],
  );
  const currentLanguageMeta = React.useMemo(
    () => find(activeLanguages, (l) => l.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const [form, setForm] = React.useState({
    name: "",
    isActive: true,
    image: null,
    removeImage: false,
  });

  React.useEffect(() => {
    if (equipment) {
      setForm({
        name: resolveLabel(
          get(equipment, "translations"),
          get(equipment, "name", ""),
          currentLanguage,
        ),
        isActive: get(equipment, "isActive", true),
        image: null,
        removeImage: false,
      });
    }
  }, [equipment, currentLanguage]);

  const patchMutation = usePatchQuery({
    queryKey: ["admin", "workout-equipments"],
  });
  const isUpdating = patchMutation.isPending;

  const handleSave = React.useCallback(async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Jihoz nomini kiriting");
      return;
    }

    const translations = { [currentLanguage]: trimmedName };

    try {
      if (form.image || form.removeImage) {
        const formData = new FormData();
        formData.append("name", trimmedName);
        formData.append("isActive", String(form.isActive));
        formData.append("translations", JSON.stringify(translations));
        if (form.image) formData.append("image", form.image);
        if (form.removeImage) formData.append("removeImage", "true");

        await patchMutation.mutateAsync({
          url: `/admin/workout-equipments/${id}`,
          attributes: formData,
          config: { headers: { "Content-Type": "multipart/form-data" } },
        });
      } else {
        await patchMutation.mutateAsync({
          url: `/admin/workout-equipments/${id}`,
          attributes: {
            name: trimmedName,
            isActive: form.isActive,
            translations,
          },
        });
      }

      toast.success("Jihoz yangilandi");
      navigate("/admin/equipments/list");
    } catch (error) {
      toast.error(getErrorMessage(error, "Jihozni saqlab bo'lmadi"));
    }
  }, [currentLanguage, form, id, navigate, patchMutation]);

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/equipments/list");
  };

  if (isLoading) return null;

  const currentImageUrl =
    form.removeImage || !equipment ? null : equipment.imageUrl;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon className="size-5" />
              Jihozni tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              Asosiy nom, status va preview rasmi shu drawer orqali
              boshqariladi.
            </DrawerDescription>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
              <p className="font-medium">
                Joriy til:{" "}
                {currentLanguageMeta?.flag
                  ? `${currentLanguageMeta.flag} `
                  : ""}
                {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Shu drawer joriy tildagi nomni yangilaydi. Boshqa tillar uchun
                tarjimalar draweridan foydalaning.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <WrenchIcon className="text-primary" />
                Jihoz nomi
              </Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Masalan: Dumbbell"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="text-primary" />
                Preview rasm
              </Label>
              <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                <ImageUploadPreview
                  file={form.image}
                  existingUrl={currentImageUrl}
                  onChange={(file) =>
                    setForm((current) => ({
                      ...current,
                      image: file,
                      removeImage: false,
                    }))
                  }
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      image: null,
                      removeImage: Boolean(get(equipment, "imageUrl")),
                    }))
                  }
                />
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    JPG, PNG yoki WEBP
                  </p>
                  <p>
                    Maksimal hajm 5MB. Sahifa ro'yxatida preview sifatida
                    ishlatiladi.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Faol holat</p>
                <p className="text-xs text-muted-foreground">
                  Nofaol jihozlar workout bilan bog'lash uchun keyin yashirin
                  turadi.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
          </div>

          <DrawerFooter className="px-6 pb-6 pt-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Saqlash
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/equipments/list")}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditEquipment;
