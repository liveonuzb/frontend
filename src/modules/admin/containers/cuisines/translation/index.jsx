import React from "react";
import { useNavigate, useParams } from "react-router";
import get from "lodash/get";
import trim from "lodash/trim";
import filter from "lodash/filter";
import find from "lodash/find";
import fromPairs from "lodash/fromPairs";
import map from "lodash/map";
import lodashValues from "lodash/values";
import { z } from "zod";
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

import { getPayload, QUERY_KEY } from "../components/utils.jsx";

const TranslationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({
    url: `/admin/cuisines/${id}`,
    queryProps: {
      queryKey: ["admin", "cuisines", id],
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
      filter(get(languagesData, "data.data", []), (language) => language.isActive),
    [languagesData],
  );
  const form = useForm({
    resolver: zodResolver(z.object({}).catchall(z.string().optional())),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (item) {
      form.reset(
        fromPairs(map(languages, (language) => [
          language.code,
          get(item, `translations.${language.code}`, ""),
        ])),
      );
    }
  }, [form, item, languages]);

  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: `/admin/cuisines/${id}`,
      attributes: {
        translations: values,
        name: trim(find(lodashValues(values), Boolean) || item?.name || ""),
      },
    });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/cuisines/list");
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/cuisines/list")}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>
            Oshxona nomlarini faol tillarda kiriting
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
                  id="cuisine-translate-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <AdminTranslationFields
                    control={form.control}
                    languages={languages}
                    getFieldName={(code) => code}
                    fields={[
                      {
                        key: "name",
                        label: "Nomi",
                        placeholder: (language) =>
                          `${get(language, "name")} tilida nom`,
                      },
                    ]}
                  />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="cuisine-translate-form"
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



