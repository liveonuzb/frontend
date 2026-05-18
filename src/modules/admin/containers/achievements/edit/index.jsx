import React from "react";
import { useParams } from "react-router";
import { get, isArray, join, toUpper, trim } from "lodash";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard";
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
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import {
  ACHIEVEMENT_CATEGORY_OPTIONS,
  ACHIEVEMENT_METRIC_OPTIONS,
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  buildAchievementPayload,
  getAdminAchievementQueryKey,
  normalizeAchievementForm,
  resolveAchievementApiErrorMessage,
} from "../api";

const editSchema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
  description: z.string().trim().min(1, "Tavsif kiriting"),
  category: z.string().trim().min(1, "Kategoriyani tanlang"),
  metric: z.string().trim().min(1, "Metricni tanlang"),
  threshold: z.coerce.number().int().min(1, "Threshold noto'g'ri"),
  xpReward: z.coerce.number().int().min(0, "XP noto'g'ri"),
  isActive: z.boolean().default(true),
});

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};
const ACHIEVEMENTS_LIST_PATH = "/admin/achievements/list";

const EditAchievementPage = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    ACHIEVEMENTS_LIST_PATH,
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";
  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: normalizeAchievementForm(),
  });

  const { data, isLoading } = useGetQuery({
    url: `/admin/achievements/${id}`,
    queryProps: {
      queryKey: getAdminAchievementQueryKey(id),
      enabled: Boolean(id),
    },
  });


  const achievement = getResponsePayload(data);

  React.useEffect(() => {
    if (achievement) {
      form.reset(normalizeAchievementForm(achievement, currentLanguage));
    }
  }, [achievement, currentLanguage, form]);

  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });
  const unsavedChanges = useUnsavedChangesGuard({
    when: form.formState.isDirty && !isPending,
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: `/admin/achievements/${id}`,
        attributes: buildAchievementPayload({
          ...normalizeAchievementForm(achievement, currentLanguage),
          ...values,
        }, currentLanguage),
      },
      {
        onSuccess: () => {
          toast.success("Achievement yangilandi.");
          form.reset(values);
          closeAdminDrawer();
        },
        onError: (error) => {
          toast.error(
            resolveAchievementApiErrorMessage(
              error,
              getErrorMessage(error, "Achievementni yangilab bo'lmadi."),
            ),
          );
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) {
      unsavedChanges.requestLeave(closeAdminDrawer);
    }
  };

  return (
    <>
      <Drawer open onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Achievementni tahrirlash</DrawerTitle>
          <DrawerDescription className="max-w-sm">
            Achievementning asosiy maydonlarini yangilang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
            <Form {...form}>
              <form
                id="achievement-edit-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Nomi ({toUpper(currentLanguage)}) *
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
                        Tavsif ({toUpper(currentLanguage)}) *
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
                        <FormLabel className="text-xs font-bold">
                          Metric *
                        </FormLabel>
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
                        <FormLabel className="text-xs font-bold">
                          Threshold
                        </FormLabel>
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
                        <FormLabel className="text-xs font-bold">
                          XP reward
                        </FormLabel>
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
          )}
        </DrawerBody>

        {!isLoading ? (
          <DrawerFooter>
            <Button
              type="submit"
              form="achievement-edit-form"
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Saqlash
            </Button>
          </DrawerFooter>
        ) : null}
        </DrawerContent>
      </Drawer>
      <UnsavedChangesAlert
        open={unsavedChanges.confirmOpen}
        onCancel={unsavedChanges.cancelLeave}
        onConfirm={unsavedChanges.confirmLeave}
      />
    </>
  );
};

export default EditAchievementPage;
