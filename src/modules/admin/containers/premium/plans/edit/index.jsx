import React from "react";
import { useParams } from "react-router";
import { find, get, isArray, join, trim } from "lodash";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { PlanForm } from "../components/plan-form.jsx";

const PREMIUM_PLANS_PATH = "/admin/premium/plans";

const EditPlan = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(PREMIUM_PLANS_PATH);
  const { canManageGrowth } = useAdminPermissions();

  const { data: plansData, isLoading } = useGetQuery({
    url: "/admin/premium/plans",
    queryProps: { queryKey: ["admin", "premium-plans"] },
  });
  const plans = get(plansData, "data.data", get(plansData, "data", []));
  const plan = find(plans, (p) => String(get(p, "id")) === String(id));

  const patchMutation = usePatchQuery({
    queryKey: ["admin", "premium-plans"],
  });
  const isUpdating = patchMutation.isPending;

  const handleSave = React.useCallback(
    async (payload) => {
      if (!canManageGrowth) return;

      if (!payload.name || !trim(payload.name)) {
        toast.error("Plan nomini kiriting");
        return;
      }

      try {
        await patchMutation.mutateAsync({
          url: `/admin/premium/plans/${id}`,
          attributes: payload,
        });
        toast.success("Plan yangilandi");
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
    [canManageGrowth, closeAdminDrawer, id, patchMutation],
  );

  const handleOpenChange = (open) => {
    if (!open) closeAdminDrawer();
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon className="size-5" />
              Planni tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              Plan ma'lumotlarini tahrirlang va saqlang.
            </DrawerDescription>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center px-4 py-10">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
            <PlanForm
              defaultValues={plan}
              onSubmit={handleSave}
              isSubmitting={isUpdating || !canManageGrowth}
              submitLabel="Saqlash"
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditPlan;
