import React, { useState } from "react";
import { useNavigate } from "react-router";
import { get, isArray, join, trim } from "lodash";
import { usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CheckCircle2Icon, LoaderCircleIcon, PlusIcon } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input.jsx";
import { toast } from "sonner";
import {
  createInitialUserForm,
  normalizeFormRoles,
  toggleFormRole,
} from "../config";

const ROLE_OPTIONS = [
  { value: "USER", label: "User", disabled: true },
  { value: "COACH", label: "Coach" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const CreateUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(createInitialUserForm());

  const { mutateAsync: createUser, isPending: isCreating } = usePostQuery({
    queryKey: ["admin-users"],
  });

  const handleSave = async () => {
    if (!trim(get(form, "firstName"))) {
      toast.error("Ismni kiriting");
      return;
    }
    if (!trim(get(form, "email")) && !trim(get(form, "phone"))) {
      toast.error("Email yoki telefon raqamini kiriting");
      return;
    }
    if (!trim(get(form, "password"))) {
      toast.error("Parolni kiriting");
      return;
    }

    try {
      await createUser({
        url: "/admin/users",
        attributes: {
          ...form,
          roles: normalizeFormRoles(form.roles),
        },
      });
      toast.success("Foydalanuvchi yaratildi");
      navigate("/admin/users/list");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Foydalanuvchini yaratib bo'lmadi",
      );
    }
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/users/list");
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PlusIcon className="size-5" />
              Yangi foydalanuvchi
            </DrawerTitle>
            <DrawerDescription>
              Yangi foydalanuvchi accountini yarating
            </DrawerDescription>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold">Ism *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, firstName: e.target.value }))
                  }
                  placeholder="Ism"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold">Familiya</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, lastName: e.target.value }))
                  }
                  placeholder="Familiya"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((c) => ({ ...c, email: e.target.value }))
                }
                placeholder="email@example.com"
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Telefon</Label>
              <PhoneInput
                value={form.phone}
                onChange={(value) =>
                  setForm((c) => ({ ...c, phone: value }))
                }
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Parol *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((c) => ({ ...c, password: e.target.value }))
                }
                placeholder="Parol"
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-xs font-bold">Rollar</Label>
              <div className="flex flex-wrap gap-4">
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={form.roles.includes(option.value)}
                      disabled={option.disabled}
                      onCheckedChange={(checked) =>
                        setForm((c) => ({
                          ...c,
                          roles: toggleFormRole(c.roles, option.value, checked),
                        }))
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter className="px-6 pb-6 pt-2">
            <Button
              onClick={handleSave}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Yaratish
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/users/list")}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateUser;
