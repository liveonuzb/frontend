import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, trim } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminTranslationFields } from "@/modules/admin/components/admin-translation-fields.jsx";
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
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

import { getPayload, QUERY_KEY, translateSchema } from "../components/utils.jsx";

const TranslationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({
    url: `/admin/user-goals/${id}`,
    queryProps: {
      queryKey: ["admin", "user-goals", id],
      enabled: Boolean(id),
    },
  });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = React.useMemo(
    () =>
      get(languagesData, "data.data", []).filter(
        (language) => language.isActive,
      ),
    [languagesData],
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
  }, [form, item, languages]);

  const close = () => navigate("/admin/user-goals/list");

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
      url: `/admin/user-goals/${id}`,
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
    close();
  };

  return (
    <Drawer open onOpenChange={(open) => !open && close()} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>
            Faol tillar uchun maqsad nomi va tavsifini kiriting
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
                  id="user-goal-translate-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <AdminTranslationFields
                    control={form.control}
                    languages={languages}
                    fields={[
                      {
                        key: "name",
                        label: "Nomi",
                        placeholder: (language) =>
                          `${get(language, "name")} tilida nom`,
                      },
                      {
                        key: "description",
                        label: "Tavsif",
                        placeholder: (language) =>
                          `${get(language, "name")} tilida tavsif`,
                      },
                    ]}
                  />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="user-goal-translate-form"
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
