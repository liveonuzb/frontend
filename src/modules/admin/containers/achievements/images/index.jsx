import React from "react";
import { useNavigate, useParams } from "react-router";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import find from "lodash/find";
import map from "lodash/map";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
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
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner.jsx";
import { cn } from "@/lib/utils";
import AchievementImagePicker from "../components/AchievementImagePicker";
import {
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  APP_MODE_OPTIONS,
  IMAGE_FIELD_BY_MODE,
  getAdminAchievementQueryKey,
  normalizeAchievementForm,
  resolveAchievementApiErrorMessage,
} from "../api";

const imagesSchema = z.object({
  imageMadagascarUrl: z.string().optional(),
  imageZenUrl: z.string().optional(),
  imageFocusUrl: z.string().optional(),
});

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const AchievementImagesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedMode, setSelectedMode] = React.useState("madagascar");
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const selectedField =
    IMAGE_FIELD_BY_MODE[selectedMode] || IMAGE_FIELD_BY_MODE.madagascar;
  const selectedLabel =
    find(APP_MODE_OPTIONS, (option) => option.value === selectedMode)?.label ||
    "Madagascar";

  const form = useForm({
    resolver: zodResolver(imagesSchema),
    defaultValues: normalizeAchievementForm(),
  });

  const { data, isLoading } = useGetQuery({
    url: `/admin/achievements/${id}`,
    queryProps: {
      queryKey: getAdminAchievementQueryKey(id),
      enabled: Boolean(id),
    },
  });
  const achievement = getResponsePayload(data);

  React.useEffect(() => {
    if (achievement) {
      form.reset(normalizeAchievementForm(achievement));
    }
  }, [achievement, form]);

  const imageUrl = form.watch(selectedField);
  const { mutateAsync, isPending } = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const onSubmit = async (values) => {
    if (isUploadingImage) {
      toast.error("Rasm yuklanishini kuting");
      return;
    }

    await mutateAsync(
      {
        url: `/admin/achievements/${id}`,
        attributes: {
          [selectedField]: get(values, selectedField, ""),
        },
      },
      {
        onSuccess: () => {
          toast.success("Achievement rasmi yangilandi.");
          navigate("/admin/achievements/list", { replace: true });
        },
        onError: (error) => {
          toast.error(
            resolveAchievementApiErrorMessage(
              error,
              getErrorMessage(error, "Rasmni saqlab bo'lmadi."),
            ),
          );
        },
      },
    );
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/achievements/list", { replace: true });
  };

  const isSubmitting = isPending || isUploadingImage;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Achievement rasmlari</DrawerTitle>
          <DrawerDescription className="max-w-sm">
            Har bir app mode uchun alohida rasm yuklang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
            <Form {...form}>
              <form
                id="achievement-images-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-3 gap-2">
                  {map(APP_MODE_OPTIONS, (mode) => (
                    <button
                      type="button"
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value)}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-sm font-medium transition",
                        selectedMode === mode.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name={selectedField}
                  render={() => (
                    <FormItem>
                      <AchievementImagePicker
                        label={`${selectedLabel} rasmi`}
                        value={imageUrl}
                        onUploadingChange={setIsUploadingImage}
                        onChange={(nextUrl) =>
                          form.setValue(selectedField, nextUrl, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </DrawerBody>

        {!isLoading ? (
          <DrawerFooter>
            <Button
              type="submit"
              form="achievement-images-form"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Rasmni saqlash
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default AchievementImagesPage;
