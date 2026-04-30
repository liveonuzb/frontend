import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { filter, find, get, isArray, join, map, trim } from "lodash";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner.jsx";
import {
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  getAdminAchievementQueryKey,
} from "../api";

const FALLBACK_LANGUAGE = {
  id: "uz",
  code: "uz",
  name: "O'zbek",
  flag: "UZ",
  isActive: true,
};

const translationSchema = z.object({}).catchall(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
);

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const getActiveLanguages = (languages) => {
  const activeLanguages = filter(languages, (language) => get(language, "isActive"));
  return activeLanguages.length ? activeLanguages : [FALLBACK_LANGUAGE];
};

const resolveCurrentLanguage = (activeLanguages, currentLanguage) =>
  find(
    activeLanguages,
    (language) => get(language, "code") === currentLanguage,
  ) || get(activeLanguages, "0", FALLBACK_LANGUAGE);

const buildDefaultValues = (item, languages) =>
  Object.fromEntries(
    map(languages, (language) => {
      const code = get(language, "code");
      return [
        code,
        {
          name: get(item, `translations.${code}`, ""),
          description: get(item, `descriptionTranslations.${code}`, ""),
        },
      ];
    }),
  );

const buildPayload = (values, languages) =>
  languages.reduce(
    (acc, language) => {
      const code = get(language, "code");
      acc.translations[code] = trim(get(values, `${code}.name`, ""));
      acc.descriptionTranslations[code] = trim(
        get(values, `${code}.description`, ""),
      );
      return acc;
    },
    { translations: {}, descriptionTranslations: {} },
  );

const TranslateAchievement = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: achievementData, isLoading } = useGetQuery({
    url: `/admin/achievements/${id}`,
    queryProps: {
      queryKey: getAdminAchievementQueryKey(id),
      enabled: Boolean(id),
    },
  });
  const item = getResponsePayload(achievementData);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: ["admin", "languages"],
    },
  });
  const activeLanguages = useMemo(
    () => getActiveLanguages(get(languagesData, "data.data", [])),
    [languagesData],
  );
  const activeLanguage = useMemo(
    () => resolveCurrentLanguage(activeLanguages, currentLanguage),
    [activeLanguages, currentLanguage],
  );
  const defaultValues = useMemo(
    () => buildDefaultValues(item, activeLanguages),
    [activeLanguages, item],
  );

  const form = useForm({
    resolver: zodResolver(translationSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (item) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, item]);

  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: `/admin/achievements/${id}`,
        attributes: buildPayload(values, activeLanguages),
      },
      {
        onSuccess: (response) => {
          const responseData = getResponsePayload(response);
          toast.success(
            get(responseData, "message") || "Tarjimalar yangilandi",
          );
          navigate("/admin/achievements/list");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/achievements/list");
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
          <DrawerHeader className="items-center text-center">
            <DrawerTitle>Tarjima qo'shish</DrawerTitle>
            <DrawerDescription className="max-w-sm">
              {item
                ? `${trim(get(item, "name", "")) || "Achievement"} uchun faol tillardagi nom va tavsif`
                : "Achievement tarjimalari"}
            </DrawerDescription>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center px-4 py-8">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
            <>
              <Form {...form}>
                <form
                  id="achievement-translation-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
                >
                  {map(activeLanguages, (language) => {
                    const code = get(language, "code");
                    const isCurrent = code === get(activeLanguage, "code");

                    return (
                      <div key={code} className="space-y-3 rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{get(language, "flag", "Lang")}</span>
                          {get(language, "name")}
                          {isCurrent ? (
                            <span className="text-xs text-muted-foreground">
                              Asosiy
                            </span>
                          ) : null}
                        </div>
                        <FormField
                          control={form.control}
                          name={`${code}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nomi</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder={`${get(language, "name")} tilida nom`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`${code}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tavsif</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder={`${get(language, "name")} tilida tavsif`}
                                  className="min-h-20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </form>
              </Form>

              <DrawerFooter className="px-6 pb-6 pt-2">
                <Button
                  type="submit"
                  form="achievement-translation-form"
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <CheckCircle2Icon />
                  )}
                  Tarjimalarni saqlash
                </Button>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TranslateAchievement;
