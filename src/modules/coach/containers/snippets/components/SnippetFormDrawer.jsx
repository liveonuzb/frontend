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
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

const MAX_TAGS = 12;

const snippetSchema = z.object({
  title: z
    .string()
    .min(1, "Sarlavha kiritish shart")
    .max(200, "Sarlavha 200 ta belgidan oshmasligi kerak"),
  content: z.string().min(1, "Mazmun kiritish shart"),
  tagsInput: z.string().optional(),
});

const SnippetFormDrawer = ({
  mode,
  snippet,
  isSubmitting,
  onSave,
  onClose,
}) => {
  const isEdit = mode === "edit";

  const form = useForm({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      title: "",
      content: "",
      tagsInput: "",
    },
  });

  const [tags, setTags] = React.useState([]);
  const [tagInputValue, setTagInputValue] = React.useState("");

  useEffect(() => {
    if (isEdit && snippet) {
      form.reset({
        title: snippet.title ?? "",
        content: snippet.content ?? "",
        tagsInput: "",
      });
      setTags(Array.isArray(snippet.tags) ? snippet.tags : []);
      setTagInputValue("");
    } else if (!isEdit) {
      form.reset({ title: "", content: "", tagsInput: "" });
      setTags([]);
      setTagInputValue("");
    }
  }, [isEdit, snippet, form]);

  const addTag = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    if (tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, trimmed]);
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(tagInputValue);
      setTagInputValue("");
    } else if (e.key === "Backspace" && !tagInputValue && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleTagBlur = () => {
    if (tagInputValue.trim()) {
      addTag(tagInputValue);
      setTagInputValue("");
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave({
      title: data.title,
      content: data.content,
      tags,
    });
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
            {isEdit ? "Shablonni tahrirlash" : "Yangi shablon"}
          </DrawerTitle>
          <DrawerDescription className="mt-1">
            Shablon ma&apos;lumotlarini kiriting
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <Form {...form}>
            <form
              id="snippet-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sarlavha <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masalan: Xush kelibsiz"
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mazmun <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Shablon matni..."
                        className="rounded-xl min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium leading-none">
                  Teglar{" "}
                  <span className="text-muted-foreground font-normal">
                    (ixtiyoriy, vergul yoki Enter bilan ajrating)
                  </span>
                </label>

                <div className="flex flex-wrap gap-1.5 rounded-xl border border-input bg-background px-3 py-2 min-h-[44px] focus-within:ring-1 focus-within:ring-ring">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 rounded-lg px-2 h-6 text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                        aria-label={`${tag} tegini olib tashlash`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length < MAX_TAGS ? (
                    <input
                      type="text"
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={handleTagBlur}
                      placeholder={tags.length === 0 ? "Teg qo'shish..." : ""}
                      className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground self-center">
                      Maksimal {MAX_TAGS} ta teg
                    </span>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-5 py-4">
          <Button type="submit" form="snippet-form" disabled={isSubmitting}>
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

export default SnippetFormDrawer;
