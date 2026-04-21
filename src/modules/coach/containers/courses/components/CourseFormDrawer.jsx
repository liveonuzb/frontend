import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const isValidHttpUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, "URL juda uzun")
  .refine(isValidHttpUrl, "To'liq http(s) URL kiriting");

const courseFormSchema = z.object({
  title: z.string().trim().min(1, "Kurs nomini kiriting").max(160),
  description: z.string().max(5000).default(""),
  previewContent: z.string().max(5000).default(""),
  previewLessonUrl: optionalUrlSchema.default(""),
  learningOutcomesText: z.string().default(""),
  coverImageUrl: optionalUrlSchema.default(""),
  price: z.coerce.number().int().min(0, "Narx 0 yoki undan katta bo'lishi kerak"),
  accessDurationDays: z.coerce
    .number()
    .int()
    .min(1, "Kamida 1 kun")
    .max(3650, "Maksimal 3650 kun"),
  paymentMethodsText: z.string().default(""),
  autoApprovalEnabled: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

const splitValues = (value = "") =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const getDefaultValues = (course) => ({
  title: course?.title ?? "",
  description: course?.description ?? "",
  previewContent: course?.previewContent ?? "",
  previewLessonUrl: course?.previewLessonUrl ?? "",
  learningOutcomesText: Array.isArray(course?.learningOutcomes)
    ? course.learningOutcomes.join("\n")
    : "",
  coverImageUrl: course?.coverImageUrl ?? "",
  price: course?.price ?? 0,
  accessDurationDays: course?.accessDurationDays ?? 30,
  paymentMethodsText: Array.isArray(course?.paymentMethods)
    ? course.paymentMethods.join("\n")
    : "",
  autoApprovalEnabled: Boolean(course?.autoApprovalEnabled),
  isPublished: Boolean(course?.isPublished),
});

const CourseFormDrawer = ({
  open,
  mode = "create",
  course,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const isEdit = mode === "edit";

  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: getDefaultValues(course),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(course));
    }
  }, [course, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      previewContent: values.previewContent.trim() || undefined,
      previewLessonUrl: values.previewLessonUrl.trim() || undefined,
      learningOutcomes: splitValues(values.learningOutcomesText),
      coverImageUrl: values.coverImageUrl.trim() || undefined,
      price: values.price,
      accessDurationDays: values.accessDurationDays,
      paymentMethods: splitValues(values.paymentMethodsText),
      autoApprovalEnabled: values.autoApprovalEnabled,
      isPublished: values.isPublished,
    });
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? "Kursni tahrirlash" : "Yangi kurs"}
          </DrawerTitle>
          <DrawerDescription>
            Kurs tarkibi, narxi va checkout ma&apos;lumotlarini shu yerda
            boshqaring.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="coach-course-form"
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DrawerBody className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Kurs nomi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masalan: Telegram Commerce Pro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narx</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access muddati (kun)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" max="3650" step="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tavsif</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Kursdan foydalanuvchi nima oladi?"
                          className="min-h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previewContent"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Preview content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Landing yoki bot ichida ko'rinadigan qisqa preview matn"
                          className="min-h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previewLessonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview lesson URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover image URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learningOutcomesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning outcomes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Har qatorda bitta outcome"
                          className="min-h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethodsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment methods</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Click&#10;Payme&#10;Telegram receipt"
                          className="min-h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoApprovalEnabled"
                  render={({ field }) => (
                    <FormItem className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <FormLabel>Auto approval</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Telegram receipt kelganda purchase avtomatik approve
                            qilinsin.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <FormLabel>Published holati</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Saqlagandan keyin kurs commerce oqimida aktiv
                            ko&apos;rinsin.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DrawerBody>

            <DrawerFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? "Saqlash" : "Kurs yaratish"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Bekor qilish
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
};

export default CourseFormDrawer;
