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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrophyIcon, ImagePlusIcon } from "lucide-react";

// ── Schema ───────────────────────────────────────────────────────────────────
const challengeSchema = z.object({
  title: z.string().min(1, "Musobaqa nomini kiriting"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ENDED"]).default("DRAFT"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  imageUrl: z.string().optional(),
});

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Qoralama" },
  { value: "ACTIVE", label: "Faol" },
  { value: "ENDED", label: "Tugagan" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const ChallengeFormDrawer = ({
  mode,
  challenge,
  isSubmitting,
  onSave,
  onClose,
}) => {
  const isEdit = mode === "edit";

  const form = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "DRAFT",
      startDate: "",
      endDate: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (isEdit && challenge) {
      form.reset({
        title: challenge.title ?? "",
        description: challenge.description ?? "",
        status: challenge.status ?? "DRAFT",
        startDate: challenge.startDate
          ? challenge.startDate.slice(0, 16)
          : "",
        endDate: challenge.endDate ? challenge.endDate.slice(0, 16) : "",
        imageUrl: challenge.imageUrl ?? "",
      });
    } else if (!isEdit) {
      form.reset({
        title: "",
        description: "",
        status: "DRAFT",
        startDate: "",
        endDate: "",
        imageUrl: "",
      });
    }
  }, [isEdit, challenge, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
  });

  return (
    <Drawer
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">
            <span className="inline-flex items-center gap-2">
              <TrophyIcon className="size-5 text-primary" />
              {isEdit ? "Musobaqani tahrirlash" : "Yangi musobaqa"}
            </span>
          </DrawerTitle>
          <DrawerDescription className="mt-1">
            Musobaqa ma&apos;lumotlarini kiriting
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <Form {...form}>
            <form
              id="challenge-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {/* ── Title ── */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Musobaqa nomi <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masalan: 30 kunlik qadamlar musobaqasi"
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Description ── */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ta&apos;rif</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Musobaqa haqida batafsil..."
                        className="rounded-xl min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Status ── */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Status tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Start date ── */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boshlanish sanasi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── End date ── */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tugash sanasi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Image URL ── */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="inline-flex items-center gap-1.5">
                        <ImagePlusIcon className="size-4" />
                        Rasm URL
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value ? (
                      <div className="mt-2 size-20 overflow-hidden rounded-xl border bg-muted/30">
                        <img loading="lazy"
                          src={field.value}
                          alt="preview"
                          className="size-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-5 py-4">
          <Button type="submit" form="challenge-form" disabled={isSubmitting}>
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

export default ChallengeFormDrawer;
