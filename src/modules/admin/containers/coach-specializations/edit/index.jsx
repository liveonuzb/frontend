import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { filter, find, get, isArray, join, trim } from "lodash";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
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
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import SpecializationImagePicker from "../components/SpecializationImagePicker";
import {
  CATEGORY_OPTIONS,
  FALLBACK_LANGUAGE,
  SUPPORTED_TRANSLATION_FIELDS,
} from "../constants";

const editSchema = z.object({
  category: z.string().trim().min(1, "Kategoriyani tanlang"),
  name: z.string().trim().min(1, "Nom kiriting"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const emptyForm = {
  category: "",
  name: "",
  imageUrl: "",
  isActive: true,
};

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};
const COACH_SPECIALIZATIONS_LIST_PATH = "/admin/coach-specializations/list";

const getSupportedActiveLanguages = (languages) => {
  const activeLanguages = filter(
    languages,
    (language) =>
      get(language, "isActive") &&
      Boolean(SUPPORTED_TRANSLATION_FIELDS[get(language, "code")]),
  );

  return activeLanguages.length ? activeLanguages : [FALLBACK_LANGUAGE];
};

const resolveCurrentLanguage = (activeLanguages, currentLanguage) =>
  find(
    activeLanguages,
    (language) => get(language, "code") === currentLanguage,
  ) || get(activeLanguages, "0", FALLBACK_LANGUAGE);

const resolveLocalizedName = (item, language) =>
  trim(get(item, `translations.${language}`, "")) ||
  trim(get(item, "translations.uz", "")) ||
  trim(get(item, "name", ""));

const buildEditPayload = (values, activeLanguage) => {
  const name = trim(get(values, "name", ""));
  const languageCode = get(activeLanguage, "code", "uz");

  return {
    category: get(values, "category"),
    name,
    translations: {
      [languageCode]: name,
    },
    imageUrl: get(values, "imageUrl"),
    isActive: get(values, "isActive"),
  };
};

const EditSpecialization = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    COACH_SPECIALIZATIONS_LIST_PATH,
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: emptyForm,
  });

  const { data: specializationData, isLoading } = useGetQuery({
    url: `/admin/coach-specializations/${id}`,
    queryProps: {
      queryKey: ["admin", "coach-specializations", id],
      enabled: Boolean(id),
    },
  });
  const item = getResponsePayload(specializationData);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: ["admin", "languages"],
    },
  });
  const languages = get(languagesData, "data.data", []);

  const activeLanguages = useMemo(
    () => getSupportedActiveLanguages(languages),
    [languages],
  );
  const activeLanguage = useMemo(
    () => resolveCurrentLanguage(activeLanguages, currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const initialValues = useMemo(() => {
    if (!item) return emptyForm;

    return {
      category: get(item, "category", ""),
      name: resolveLocalizedName(item, get(activeLanguage, "code", "uz")),
      imageUrl: get(item, "imageUrl", ""),
      isActive: get(item, "isActive", true),
    };
  }, [activeLanguage, item]);

  React.useEffect(() => {
    if (item) {
      form.reset(initialValues);
    }
  }, [form, initialValues, item]);

  const imageUrl = form.watch("imageUrl");

  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: ["admin", "coach-specializations"],
  });

  const onSubmit = async (values) => {
    if (isUploadingImage) {
      toast.error("Rasm yuklanishini kuting");
      return;
    }

    await mutateAsync(
      {
        url: `/admin/coach-specializations/${id}`,
        attributes: buildEditPayload(values, activeLanguage),
      },
      {
        onSuccess: (response) => {
          const responseData = getResponsePayload(response);
          toast.success(
            get(responseData, "message") || "Yo'nalish yangilandi",
          );
          closeAdminDrawer();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Yo'nalishni saqlab bo'lmadi"));
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) closeAdminDrawer();
  };

  const isSubmitting = isPending || isUploadingImage;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Yo'nalishni tahrirlash</DrawerTitle>
          <DrawerDescription className="max-w-sm">
            Yo'nalish ma'lumotlarini o'zgartiring
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
                id="coach-specialization-edit-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={() => (
                    <FormItem>
                      <SpecializationImagePicker
                        value={imageUrl}
                        onUploadingChange={setIsUploadingImage}
                        onChange={(nextUrl) =>
                          form.setValue("imageUrl", nextUrl, {
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
                          options={CATEGORY_OPTIONS}
                          title="Kategoriya tanlang"
                          description="Yo'nalish qaysi sport kategoriyasiga tegishli ekanini belgilang"
                          placeholder="Kategoriyani tanlang"
                          triggerClassName="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-bold">
                        <span>{get(activeLanguage, "flag")}</span>
                        Nomi ({get(activeLanguage, "name", "Faol til")}) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`${get(activeLanguage, "name", "Faol til")} tilida nom`}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                        <div>
                          <Label>Status</Label>
                          <p className="text-xs text-muted-foreground">
                            Faol bo'lsa, ilovada ko'rinadi.
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
              form="coach-specialization-edit-form"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              O'zgarishlarni saqlash
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default EditSpecialization;
