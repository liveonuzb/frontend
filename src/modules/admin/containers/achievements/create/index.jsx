import React from "react";
import { useNavigate } from "react-router";
import { get, isArray, join } from "lodash";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { useAppModeStore, useLanguageStore } from "@/store";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AchievementImagePicker from "../components/AchievementImagePicker";
import {
  ACHIEVEMENT_CATEGORY_OPTIONS,
  ACHIEVEMENT_METRIC_OPTIONS,
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  APP_MODE_OPTIONS,
  IMAGE_FIELD_BY_MODE,
  buildAchievementPayload,
  createEmptyAchievementForm,
  resolveAchievementApiErrorMessage,
} from "../api";

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const buildSchema = (imageField) =>
  z
    .object({
      name: z.string().trim().min(1, "Nom kiriting"),
      description: z.string().trim().min(1, "Tavsif kiriting"),
      imageMadagascarUrl: z.string().optional(),
      imageZenUrl: z.string().optional(),
      imageFocusUrl: z.string().optional(),
      category: z.string().trim().min(1, "Kategoriyani tanlang"),
      metric: z.string().trim().min(1, "Metricni tanlang"),
      threshold: z.coerce.number().int().min(1, "Threshold noto'g'ri"),
      xpReward: z.coerce.number().int().min(0, "XP noto'g'ri"),
      isActive: z.boolean().default(true),
    })
    .superRefine((values, ctx) => {
      if (!String(get(values, imageField, "")).trim()) {
        ctx.addIssue({
          code: "custom",
          path: [imageField],
          message: "Joriy mode uchun rasm yuklang",
        });
      }
    });

const CreateAchievementPage = () => {
  const navigate = useNavigate();
  const currentMode = useAppModeStore((state) => state.mode) || "madagascar";
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";
  const imageField = IMAGE_FIELD_BY_MODE[currentMode] || IMAGE_FIELD_BY_MODE.madagascar;
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const schema = React.useMemo(() => buildSchema(imageField), [imageField]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: createEmptyAchievementForm(),
  });
  const imageUrl = form.watch(imageField);
  const modeLabel =
    APP_MODE_OPTIONS.find((option) => option.value === currentMode)?.label ||
    "Madagascar";

  const { mutateAsync, isPending } = usePostQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const onSubmit = async (values) => {
    if (isUploadingImage) {
      toast.error("Rasm yuklanishini kuting");
      return;
    }

    await mutateAsync(
      {
        url: "/admin/achievements",
        attributes: buildAchievementPayload(values, currentLanguage),
      },
      {
        onSuccess: () => {
          toast.success("Achievement yaratildi.");
          navigate("/admin/achievements/list", { replace: true });
        },
        onError: (error) => {
          toast.error(
            resolveAchievementApiErrorMessage(
              error,
              getErrorMessage(error, "Achievement yaratib bo'lmadi."),
            ),
          );
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/achievements/list", { replace: true });
  };

  const isSubmitting = isPending || isUploadingImage;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Yangi achievement</DrawerTitle>
          <DrawerDescription className="max-w-sm">
            Asosiy ma'lumotlarni kiriting. Rasm joriy mode uchun majburiy.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <Form {...form}>
            <form
              id="achievement-create-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name={imageField}
                render={() => (
                  <FormItem>
                    <AchievementImagePicker
                      label={`${modeLabel} rasmi *`}
                      value={imageUrl}
                      onUploadingChange={setIsUploadingImage}
                      onChange={(nextUrl) =>
                        form.setValue(imageField, nextUrl, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Nomi ({currentLanguage.toUpperCase()}) *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Birinchi taom" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Tavsif ({currentLanguage.toUpperCase()}) *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Achievement tavsifi"
                        className="min-h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Kategoriya *
                      </FormLabel>
                      <FormControl>
                        <OptionDrawerPicker
                          value={field.value}
                          onChange={field.onChange}
                          options={ACHIEVEMENT_CATEGORY_OPTIONS}
                          title="Kategoriya tanlang"
                          placeholder="Kategoriya"
                          triggerClassName="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Metric *</FormLabel>
                      <FormControl>
                        <OptionDrawerPicker
                          value={field.value}
                          onChange={field.onChange}
                          options={ACHIEVEMENT_METRIC_OPTIONS}
                          title="Metric tanlang"
                          placeholder="Metric"
                          triggerClassName="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Threshold</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="xpReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">XP reward</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                      <div>
                        <Label>Status</Label>
                        <p className="text-xs text-muted-foreground">
                          Faol bo'lsa, foydalanuvchilarda ko'rinadi.
                        </p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="submit"
            form="achievement-create-form"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckCircle2Icon />
            )}
            Yaratish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAchievementPage;
