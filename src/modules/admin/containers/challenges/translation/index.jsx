import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import trim from "lodash/trim";
import forEach from "lodash/forEach";
import fromPairs from "lodash/fromPairs";
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
  CHALLENGES_QUERY_KEY,
  getChallengeQueryKey,
  resolveChallengeApiErrorMessage,
} from "../api.js";

const FALLBACK_LANGUAGE = {
  id: "uz",
  code: "uz",
  name: "O'zbek",
  flag: "UZ",
  isActive: true,
};

const translationSchema = z.object({}).catchall(
  z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
);

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getActiveLanguages = (languages) => {
  const activeLanguages = filter(languages, (language) => get(language, "isActive"));
  return activeLanguages.length ? activeLanguages : [FALLBACK_LANGUAGE];
};

const resolveCurrentLanguage = (activeLanguages, currentLanguage) =>
  find(activeLanguages, (language) => get(language, "code") === currentLanguage) ||
  get(activeLanguages, "0", FALLBACK_LANGUAGE);

const buildDefaultValues = (item, languages) =>
  fromPairs(map(languages, (language) => {
    const code = get(language, "code");
    return [
      code,
      {
        title: get(item, `translations.${code}`, ""),
        description: get(item, `descriptionTranslations.${code}`, ""),
      },
    ];
  }));

const buildPayload = (values, languages, currentLanguage) => {
  const translations = {};
  const descriptionTranslations = {};

  forEach(languages, (language) => {
    const code = get(language, "code");
    const title = trim(get(values, `${code}.title`, ""));
    const description = trim(get(values, `${code}.description`, ""));

    if (title) translations[code] = title;
    if (description) descriptionTranslations[code] = description;
  });

  const localizedTitle = trim(get(values, `${currentLanguage}.title`, ""));
  const localizedDescription = trim(get(values, `${currentLanguage}.description`, ""));

  return {
    translations,
    descriptionTranslations,
    ...(localizedTitle ? { title: localizedTitle } : {}),
    ...(localizedDescription ? { description: localizedDescription } : {}),
  };
};

const TranslateChallenge = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";

  const { data: challengeData, isLoading } = useGetQuery({
    url: `/admin/challenges/${id}`,
    queryProps: {
      queryKey: getChallengeQueryKey(id),
      enabled: Boolean(id),
    },
  });
  const item = getResponsePayload(challengeData);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
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
    if (item) form.reset(defaultValues);
  }, [defaultValues, form, item]);

  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: CHALLENGES_QUERY_KEY,
  });

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/challenges/list");
  };

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: `/admin/challenges/${id}`,
        attributes: buildPayload(values, activeLanguages, get(activeLanguage, "code")),
      },
      {
        onSuccess: () => {
          toast.success("Tarjimalar yangilandi");
          navigate("/admin/challenges/list");
        },
        onError: (error) => {
          const message = get(error, "response.data.message");
          toast.error(
            isArray(message)
              ? join(message, ", ")
              : resolveChallengeApiErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"),
          );
        },
      },
    );
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
          <DrawerHeader className="items-center text-center">
            <DrawerTitle>Tarjima qo'shish</DrawerTitle>
            <DrawerDescription className="max-w-sm">
              {item
                ? `${trim(get(item, "title", "")) || "Musobaqa"} uchun faol tillardagi sarlavha va tavsif`
                : "Musobaqa tarjimalari"}
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
                  id="challenge-translation-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-4"
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
                          name={`${code}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sarlavha</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder={`${get(language, "name")} tilida sarlavha`}
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
                  form="challenge-translation-form"
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

export default TranslateChallenge;
