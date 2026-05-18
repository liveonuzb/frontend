import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, map, trim, filter, find, fromPairs, values as lodashValues } from "lodash";
import { z } from "zod";
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

import { getPayload, QUERY_KEY } from "../components/utils.jsx";

const TranslationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({
    url: `/admin/ingredients/${id}`,
    queryProps: {
      queryKey: ["admin", "ingredients", id],
      enabled: Boolean(id),
    },
  });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = filter(get(languagesData, "data.data", []), (language) => language.isActive);
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
  }, [form, item, languagesData]);

  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: `/admin/ingredients/${id}`,
      attributes: {
        translations: values,
        name: trim(find(lodashValues(values), Boolean) || item?.name || ""),
      },
    });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/ingredients/list");
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/ingredients/list")}
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>
            Ingredient nomlarini faol tillarda kiriting
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
                  id="ingredient-translate-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {map(languages, (language) => (
                    <FormField
                      key={language.code}
                      control={form.control}
                      name={language.code}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language.flag} {language.name}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="ingredient-translate-form"
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



