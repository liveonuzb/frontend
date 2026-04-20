import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
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
import { Textarea } from "@/components/ui/textarea";

const groupSchema = z.object({
  name: z.string().min(1, "Guruh nomini kiriting"),
  description: z.string().optional(),
});

const GroupFormDrawer = ({
  mode,
  group,
  isSubmitting,
  onSave,
  onClose,
}) => {
  const isEdit = mode === "edit";
  const open = true;

  const form = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isEdit && group) {
      form.reset({
        name: group.name ?? "",
        description: group.description ?? "",
      });
    } else if (!isEdit) {
      form.reset({ name: "", description: "" });
    }
  }, [isEdit, group, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
  });

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">
            {isEdit ? "Guruhni tahrirlash" : "Yangi guruh"}
          </DrawerTitle>
          <DrawerDescription className="mt-1">
            Guruh ma&apos;lumotlarini kiriting
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <Form {...form}>
            <form
              id="group-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Guruh nomi <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masalan: Erkaklar (Vazn yo'qotish)"
                        className="rounded-xl h-11"
                      />
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
                    <FormLabel>Ta&apos;rif</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Guruh haqida batafsil..."
                        className="rounded-xl min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-5 py-4">
          <Button type="submit" form="group-form" disabled={isSubmitting}>
            {isEdit ? "Saqlash" : "Yaratish"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" type="button">
              Bekor qilish
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default GroupFormDrawer;
