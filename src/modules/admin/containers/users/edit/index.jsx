import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { get, isArray, isEqual, join, trim, map, includes } from "lodash";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner.jsx";
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
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard";

const ROLE_OPTIONS = [
  { value: "USER", label: "User", disabled: true },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "CONTENT_MANAGER", label: "Content manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "FINANCE", label: "Finance" },
  { value: "GROWTH", label: "Growth" },
  { value: "READONLY_ADMIN", label: "Readonly admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "NUTRITION_MANAGER", label: "Nutrition manager" },
  { value: "WORKOUT_MANAGER", label: "Workout manager" },
];
const USERS_LIST_PATH = "/admin/users/list";

const EditUser = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(USERS_LIST_PATH);
  const { canManageSupport } = useAdminPermissions();

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
  const [initialForm, setInitialForm] = useState(null);

  useEffect(() => {
    if (user) {
      const nextForm = {
        firstName: get(user, "firstName", ""),
        lastName: get(user, "lastName", ""),
        email: get(user, "email", ""),
        phone: get(user, "phone", ""),
        roles: normalizeFormRoles(
          get(user, "roles") || [get(user, "role", "USER")],
        ),
      };
      React.startTransition(() => {
        setForm(nextForm);
        setInitialForm(nextForm);
      });
    }
  }, [user]);

  const { mutateAsync: updateUser, isPending: isUpdating } = usePatchQuery({
    queryKey: ["admin-users"],
  });
  const hasUnsavedChanges = Boolean(initialForm) && !isEqual(form, initialForm);
  const unsavedChanges = useUnsavedChangesGuard({
    when: hasUnsavedChanges && !isUpdating,
  });

  const handleSave = async () => {
    if (!canManageSupport) return;

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
      setInitialForm(form);
      unsavedChanges.runWithoutGuard(closeAdminDrawer);
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
    if (!open) {
      unsavedChanges.requestLeave(closeAdminDrawer);
    }
  };

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
                ? trim(`${get(user, "firstName", "")} ${get(user, "lastName", "")}`)
                : "Foydalanuvchi"}{" "}
              ma'lumotlarini o'zgartiring
            </DrawerDescription>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center px-4 py-10">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
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
                  onChange={(value) => setForm((c) => ({ ...c, phone: value }))}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-xs font-bold">Rollar</Label>
                <div className="flex flex-wrap gap-4">
                  {map(ROLE_OPTIONS, (option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={includes(form.roles, option.value)}
                        disabled={option.disabled}
                        onCheckedChange={(checked) =>
                          setForm((c) => ({
                            ...c,
                            roles: toggleFormRole(
                              c.roles,
                              option.value,
                              checked,
                            ),
                          }))
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DrawerFooter className="px-6 pb-6 pt-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating || isLoading || !canManageSupport}
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
              onClick={() => unsavedChanges.requestLeave(closeAdminDrawer)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
      <UnsavedChangesAlert
        open={unsavedChanges.confirmOpen}
        onCancel={unsavedChanges.cancelLeave}
        onConfirm={unsavedChanges.confirmLeave}
      />
    </Drawer>
  );
};

export default EditUser;
