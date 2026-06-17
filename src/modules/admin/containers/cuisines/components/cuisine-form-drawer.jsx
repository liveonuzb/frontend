import React from "react";
import { useParams } from "react-router";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useLanguageStore } from "@/store";

import {
  cuisineSchema,
  getPayload,
  QUERY_KEY,
  resolveLabel,
} from "./utils.jsx";

import toUpper from "lodash/toUpper";

const CuisineFormDrawer = ({ mode }) => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation("/admin/cuisines/list");
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/nutrition/cuisines/${id}`,
    queryProps: {
      queryKey: ["admin", "cuisines", id],
      enabled: isEdit && Boolean(id),
    },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(cuisineSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (item) {
      form.reset({
        name: resolveLabel(item.translations, item.name, currentLanguage),
      });
    }
  }, [currentLanguage, form, item]);

  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const mutation = isEdit ? patchMutation : postMutation;
  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: isEdit
        ? `/admin/nutrition/cuisines/${id}`
        : "/admin/nutrition/cuisines",
      attributes: {
        name: values.name,
        translations: {
          ...(item?.translations ?? {}),
          [currentLanguage]: values.name,
        },
      },
    });
    toast.success(isEdit ? "Oshxona yangilandi" : "Oshxona yaratildi");
    closeAdminDrawer();
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && closeAdminDrawer()}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>
            {isEdit ? "Oshxonani tahrirlash" : "Yangi oshxona"}
          </DrawerTitle>
          <DrawerDescription>Joriy faol til uchun nom kiriting</DrawerDescription>
        </DrawerHeader>
        {isEdit && isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form
                  id="cuisine-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nomi ({toUpper(currentLanguage)})
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Masalan: O'zbek oshxonasi"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="cuisine-form"
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

export default CuisineFormDrawer;
