import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { get, isArray, join, trim } from "lodash";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
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
import { CheckCircle2Icon, LoaderCircleIcon, PencilIcon } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input.jsx";
import { toast } from "sonner";
import { normalizeFormRoles, toggleFormRole } from "../config";

const ROLE_OPTIONS = [
  { value: "USER", label: "User", disabled: true },
  { value: "COACH", label: "Coach" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: userData, isLoading } = useGetQuery({
    url: `/admin/users/${id}`,
    queryProps: {
      queryKey: ["admin-user-detail", id],
      enabled: Boolean(id),
    },
  });
  const user = get(userData, "data.data") ?? get(userData, "data", null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roles: ["USER"],
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: get(user, "firstName", ""),
        lastName: get(user, "lastName", ""),
        email: get(user, "email", ""),
        phone: get(user, "phone", ""),
        roles: normalizeFormRoles(
          get(user, "roles") || [get(user, "role", "USER")],
        ),
      });
    }
  }, [user]);

  const { mutateAsync: updateUser, isPending: isUpdating } = usePatchQuery({
    queryKey: ["admin-users"],
  });

  const handleSave = async () => {
    if (!trim(form.firstName)) {
      toast.error("Ismni kiriting");
      return;
    }

    try {
      await updateUser({
        url: `/admin/users/${id}`,
        attributes: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          roles: normalizeFormRoles(form.roles),
        },
      });
      toast.success("Foydalanuvchi yangilandi");
      navigate("/admin/users/list");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Foydalanuvchini yangilab bo'lmadi",
      );
    }
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/users/list");
  };

  if (isLoading) return null;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon className="size-5" />
              Foydalanuvchini tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              {user
                ? `${get(user, "firstName", "")} ${get(user, "lastName", "")}`.trim()
                : "Foydalanuvchi"}{" "}
              ma'lumotlarini o'zgartiring
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
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              O'zgarishlarni saqlash
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

export default EditUser;
