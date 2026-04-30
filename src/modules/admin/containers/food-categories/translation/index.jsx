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
import { Spinner } from "@/components/ui/spinner.jsx";

const translationSchema = z.object({}).catchall(z.string().optional());

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const resolveCurrentLanguage = (activeLanguages, currentLanguage) =>
  find(activeLanguages, (language) => get(language, "code") === currentLanguage) ||
  get(activeLanguages, "0", { code: "uz", name: "Uzbek", flag: "UZ" });

const buildDefaultValues = (item, languages) =>
  Object.fromEntries(
    map(languages, (language) => {
      const code = get(language, "code");
      return [code, get(item, `translations.${code}`, "")];
    }),
  );

const buildPayload = (values, languages, currentLanguage) => {
  const translations = languages.reduce((acc, language) => {
    const code = get(language, "code");
    const value = trim(get(values, code, ""));
    if (value) acc[code] = value;
    return acc;
  }, {});
  const localizedName = trim(get(values, currentLanguage, ""));

  return {
    translations,
    ...(localizedName ? { name: localizedName } : {}),
  };
};

const TranslateFoodCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoryData, isLoading } = useGetQuery({
    url: `/admin/food-categories/${id}`,
    queryProps: {
      queryKey: ["admin", "food-categories", id],
      enabled: Boolean(id),
    },
  });
  const item = getResponsePayload(categoryData);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const activeLanguages = useMemo(
    () => filter(get(languagesData, "data.data", []), (language) => language.isActive),
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
    queryKey: ["admin", "food-categories"],
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: `/admin/food-categories/${id}`,
        attributes: buildPayload(values, activeLanguages, get(activeLanguage, "code")),
      },
      {
        onSuccess: () => {
          toast.success("Tarjimalar yangilandi");
          navigate("/admin/food-categories/list");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/food-categories/list");
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
          <DrawerHeader className="items-center text-center">
            <DrawerTitle>Tarjima qo'shish</DrawerTitle>
            <DrawerDescription className="max-w-sm">
              {item
                ? `${trim(get(item, "name", "")) || "Kategoriya"} uchun faol tillardagi nomlar`
                : "Kategoriya tarjimalari"}
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
                  id="food-category-translation-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
                >
                  {map(activeLanguages, (language) => {
                    const code = get(language, "code");
                    const isCurrent = code === get(activeLanguage, "code");

                    return (
                      <FormField
                        key={code}
                        control={form.control}
                        name={code}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <span>{get(language, "flag", "Lang")}</span>
                              {get(language, "name")}
                              {isCurrent ? (
                                <span className="text-xs text-muted-foreground">
                                  Asosiy
                                </span>
                              ) : null}
                            </FormLabel>
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
                    );
                  })}
                </form>
              </Form>

              <DrawerFooter className="px-6 pb-6 pt-2">
                <Button
                  type="submit"
                  form="food-category-translation-form"
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

export default TranslateFoodCategory;
