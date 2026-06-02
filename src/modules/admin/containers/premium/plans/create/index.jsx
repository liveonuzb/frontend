import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import trim from "lodash/trim";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { usePostQuery } from "@/hooks/api";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { PlanForm } from "../components/plan-form.jsx";

const PREMIUM_PLANS_PATH = "/admin/premium/plans";

const CreatePlan = () => {
  const closeAdminDrawer = useAdminDrawerCloseNavigation(PREMIUM_PLANS_PATH);
  const { canManageGrowth } = useAdminPermissions();

  const createMutation = usePostQuery({
    queryKey: ["admin", "premium-plans"],
  });
  const isCreating = createMutation.isPending;

  const handleSave = React.useCallback(
    async (payload) => {
      if (!canManageGrowth) return;

      if (!payload.name || !trim(payload.name)) {
        toast.error("Plan nomini kiriting");
        return;
      }

      try {
        await createMutation.mutateAsync({
          url: "/admin/premium/plans",
          attributes: payload,
        });
        toast.success("Plan yaratildi");
        closeAdminDrawer();
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Planni saqlab bo'lmadi",
        );
      }
    },
    [canManageGrowth, closeAdminDrawer, createMutation],
  );

  const handleOpenChange = (open) => {
    if (!open) closeAdminDrawer();
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PlusIcon className="size-5" />
              Yangi plan
            </DrawerTitle>
            <DrawerDescription>
              Yangi premium plan yarating. Barcha maydonlarni to'ldiring.
            </DrawerDescription>
          </DrawerHeader>

          <PlanForm
            onSubmit={handleSave}
            isSubmitting={isCreating || !canManageGrowth}
            submitLabel="Yaratish"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreatePlan;
