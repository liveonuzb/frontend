import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { get, trim, isArray, join, find } from "lodash";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PencilIcon, TagIcon } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  name: "",
  code: "",
  flag: "",
  isActive: true,
};

const EditLanguage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);

  const { data: languagesData, isLoading } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: ["admin", "languages"],
    },
  });
  const languages = get(languagesData, "data.data", []);
  const language = find(languages, (lang) => String(get(lang, "id")) === String(id));

  const { mutateAsync: patchLanguage, isPending: isUpdating } = usePatchQuery({
    queryKey: ["admin", "languages"],
  });

  useEffect(() => {
    if (language) {
      setForm({
        name: get(language, "name", ""),
        code: get(language, "code", ""),
        flag: get(language, "flag", ""),
        isActive: get(language, "isActive", true),
      });
    }
  }, [language]);

  const handleSave = async () => {
    if (
      !trim(get(form, "name")) ||
      !trim(get(form, "code")) ||
      !trim(get(form, "flag"))
    ) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    try {
      await patchLanguage({
        url: `/admin/languages/${id}`,
        attributes: form,
      });
      toast.success("Til yangilandi");
      navigate("/admin/languages/list");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Tilni saqlab bo'lmadi",
      );
    }
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/languages/list");
  };

  if (isLoading) {
    return null;
  }

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto max-h-[90vh]">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon />
              Tilni tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              Til ma'lumotlarini o'zgartiring
            </DrawerDescription>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold flex items-center gap-2">
                <TagIcon />
                Til nomi *
              </Label>
              <Input
                value={get(form, "name")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: get(event, "target.value"),
                  }))
                }
                placeholder="Masalan: O'zbekcha"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold">Kodi *</Label>
                <Input
                  value={get(form, "code")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: get(event, "target.value"),
                    }))
                  }
                  placeholder="Masalan: uz"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold">
                  Bayroq (Emoji) *
                </Label>
                <Input
                  value={get(form, "flag")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      flag: get(event, "target.value"),
                    }))
                  }
                  placeholder="Masalan: \uD83C\uDDFA\uD83C\uDDFF"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-dashed">
              <Switch
                id="active-switch"
                checked={get(form, "isActive")}
                onCheckedChange={(value) =>
                  setForm((current) => ({ ...current, isActive: value }))
                }
              />
              <Label
                htmlFor="active-switch"
                className="cursor-pointer text-sm font-medium"
              >
                Faol holatda saqlash
              </Label>
            </div>
          </div>

          <DrawerFooter className="gap-2 border-t bg-muted/5 p-6">
            <Button
              onClick={handleSave}
              size="lg"
              className="w-full"
              disabled={isUpdating}
            >
              O'zgarishlarni saqlash
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Bekor qilish
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditLanguage;
