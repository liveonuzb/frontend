import React from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";

import {
  GENDER_SCOPE_OPTIONS,
  getPayload,
  healthConstraintSchema,
  QUERY_KEY,
  resolveLabel,
  TYPE_OPTIONS,
} from "./utils.jsx";

const HealthConstraintFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/health-constraints/${id}`,
    queryProps: {
      queryKey: ["admin", "health-constraints", id],
      enabled: isEdit && Boolean(id),
    },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(healthConstraintSchema),
    defaultValues: {
      name: "",
      description: "",
      key: "",
      type: "injury",
      genderScope: "all",
    },
  });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const mutation = isEdit ? patchMutation : postMutation;

  React.useEffect(() => {
    if (!item) return;
    form.reset({
      name: resolveLabel(item.translations, item.name, currentLanguage),
      description: resolveLabel(
        item.descriptionTranslations,
        item.description,
        currentLanguage,
      ),
      key: item.key || "",
      type: item.type || "injury",
      genderScope: item.genderScope || "all",
    });
  }, [currentLanguage, form, item]);

  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: isEdit
        ? `/admin/health-constraints/${id}`
        : "/admin/health-constraints",
      attributes: {
        ...values,
        translations: {
          ...(item?.translations ?? {}),
          [currentLanguage]: values.name,
        },
        descriptionTranslations: {
          ...(item?.descriptionTranslations ?? {}),
          [currentLanguage]: values.description || "",
        },
      },
    });
    toast.success(
      isEdit ? "Health constraint yangilandi" : "Health constraint yaratildi",
    );
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
          <DrawerTitle>
            {isEdit ? "Constraintni tahrirlash" : "Yangi constraint"}
          </DrawerTitle>
          <DrawerDescription>
            Gender scope onboardingda ko'rinishni boshqaradi
          </DrawerDescription>
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
                  id="health-constraint-form"
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Avtomatik yaratiladi"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turi</FormLabel>
                        <FormControl>
                          <OptionDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={TYPE_OPTIONS}
                            title="Constraint turi"
                            placeholder="Tanlang"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genderScope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jins bo'yicha ko'rinish</FormLabel>
                        <FormControl>
                          <OptionDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={GENDER_SCOPE_OPTIONS}
                            title="Jins bo'yicha ko'rinish"
                            placeholder="Tanlang"
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
                form="health-constraint-form"
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

export default HealthConstraintFormDrawer;
