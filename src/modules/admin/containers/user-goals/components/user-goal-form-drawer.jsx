import React from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import OptionDrawerPicker from "@/components/option-drawer-picker";
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
  CALCULATION_MODE_OPTIONS,
  GOAL_TYPE_OPTIONS,
  getPayload,
  QUERY_KEY,
  resolveLabel,
  userGoalSchema,
} from "./utils.jsx";
import UserGoalImagePicker from "./user-goal-image-picker.jsx";

const UserGoalFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/user-goals/${id}`,
    queryProps: {
      queryKey: ["admin", "user-goals", id],
      enabled: isEdit && Boolean(id),
    },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(userGoalSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      goalType: "other",
      calculationMode: "maintain",
      key: "",
    },
  });
  const goalType = form.watch("goalType");
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
      imageUrl: item.imageUrl || "",
      goalType: item.goalType || "other",
      calculationMode: item.calculationMode || "maintain",
      key: item.key || "",
    });
  }, [currentLanguage, form, item]);

  const close = () => navigate("/admin/user-goals/list");

  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: isEdit ? `/admin/user-goals/${id}` : "/admin/user-goals",
      attributes: {
        ...values,
        calculationMode:
          values.goalType === "weight"
            ? values.calculationMode || "maintain"
            : "maintain",
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
    toast.success(isEdit ? "Maqsad yangilandi" : "Maqsad yaratildi");
    close();
  };

  return (
    <Drawer open onOpenChange={(open) => !open && close()} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>
            {isEdit ? "Maqsadni tahrirlash" : "Yangi maqsad"}
          </DrawerTitle>
          <DrawerDescription>
            Create va editda faqat faol tildagi matn kiritiladi
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
                  id="user-goal-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <UserGoalImagePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="goalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maqsad turi</FormLabel>
                        <FormControl>
                          <OptionDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={GOAL_TYPE_OPTIONS}
                            title="Maqsad turi"
                            placeholder="Tanlang"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {goalType === "weight" ? (
                    <FormField
                      control={form.control}
                      name="calculationMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hisoblash rejimi</FormLabel>
                          <FormControl>
                            <OptionDrawerPicker
                              value={field.value}
                              onChange={field.onChange}
                              options={CALCULATION_MODE_OPTIONS}
                              title="Hisoblash rejimi"
                              placeholder="Tanlang"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
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
                            placeholder="lose, maintain, gain"
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
                form="user-goal-form"
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

export default UserGoalFormDrawer;
