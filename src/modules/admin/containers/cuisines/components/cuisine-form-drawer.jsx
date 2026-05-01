import React from "react";
import { useNavigate, useParams } from "react-router";
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
import { useLanguageStore } from "@/store";

import {
  cuisineSchema,
  getPayload,
  QUERY_KEY,
  resolveLabel,
} from "./utils.jsx";

const CuisineFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/cuisines/${id}`,
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
      url: isEdit ? `/admin/cuisines/${id}` : "/admin/cuisines",
      attributes: {
        name: values.name,
        translations: {
          ...(item?.translations ?? {}),
          [currentLanguage]: values.name,
        },
      },
    });
    toast.success(isEdit ? "Oshxona yangilandi" : "Oshxona yaratildi");
    navigate("/admin/cuisines/list");
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/cuisines/list")}
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
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
                          Nomi ({currentLanguage.toUpperCase()})
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
