import React from "react";
import { useNavigate, useParams } from "react-router";
import { find, get, isArray, join } from "lodash";
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
import { PlanForm } from "../components/plan-form.jsx";

const EditPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
      if (!payload.name || !payload.name.trim()) {
        toast.error("Plan nomini kiriting");
        return;
      }

      try {
        await patchMutation.mutateAsync({
          url: `/admin/premium/plans/${id}`,
          attributes: payload,
        });
        toast.success("Plan yangilandi");
        navigate("/admin/premium/plans");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Planni saqlab bo'lmadi",
        );
      }
    },
    [id, navigate, patchMutation],
  );

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/premium/plans");
  };

  if (isLoading) return null;

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

          <PlanForm
            defaultValues={plan}
            onSubmit={handleSave}
            isSubmitting={isUpdating}
            submitLabel="Saqlash"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditPlan;
