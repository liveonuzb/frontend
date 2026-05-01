import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, map, trim } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

import {
  getPayload,
  QUERY_KEY,
  translateSchema,
} from "../components/utils.jsx";

const TranslationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({
    url: `/admin/health-constraints/${id}`,
    queryProps: {
      queryKey: ["admin", "health-constraints", id],
      enabled: Boolean(id),
    },
  });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []).filter(
    (language) => language.isActive,
  );
  const form = useForm({
    resolver: zodResolver(translateSchema),
    defaultValues: {},
  });
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });

  React.useEffect(() => {
    if (!item) return;
    form.reset(
      Object.fromEntries(
        languages.map((language) => [
          language.code,
          {
            name: get(item, `translations.${language.code}`, ""),
            description: get(
              item,
              `descriptionTranslations.${language.code}`,
              "",
            ),
          },
        ]),
      ),
    );
  }, [form, item, languagesData]);

  const onSubmit = async (values) => {
    const translations = Object.fromEntries(
      Object.entries(values).map(([language, value]) => [
        language,
        value?.name || "",
      ]),
    );
    const descriptionTranslations = Object.fromEntries(
      Object.entries(values).map(([language, value]) => [
        language,
        value?.description || "",
      ]),
    );
    await mutation.mutateAsync({
      url: `/admin/health-constraints/${id}`,
      attributes: {
        translations,
        descriptionTranslations,
        name: trim(Object.values(translations).find(Boolean) || item?.name || ""),
        description: trim(
          Object.values(descriptionTranslations).find(Boolean) ||
            item?.description ||
            "",
        ),
      },
    });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/health-constraints/list");
  };

  return (
    <Drawer
      open
      onOpenChange={(open) =>
        !open && navigate("/admin/health-constraints/list")
      }
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>
            Faol tillar uchun nom va tavsif kiriting
          </DrawerDescription>
        </DrawerHeader>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form
                  id="health-constraint-translate-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {map(languages, (language) => (
                    <div
                      key={language.code}
                      className="flex flex-col gap-3 rounded-2xl border p-3"
                    >
                      <FormField
                        control={form.control}
                        name={`${language.code}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language.flag} {language.name} nomi
                            </FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`${language.code}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tavsif</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="health-constraint-translate-form"
                type="submit"
                disabled={mutation.isPending}
              >
                Saqlash
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default TranslationPage;
