import React from "react";
import { useNavigate } from "react-router";
import { get, isArray, join } from "lodash";
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
import { PlanForm } from "../components/plan-form.jsx";

const CreatePlan = () => {
  const navigate = useNavigate();

  const createMutation = usePostQuery({
    queryKey: ["admin", "premium-plans"],
  });
  const isCreating = createMutation.isPending;

  const handleSave = React.useCallback(
    async (payload) => {
      if (!payload.name || !payload.name.trim()) {
        toast.error("Plan nomini kiriting");
        return;
      }

      try {
        await createMutation.mutateAsync({
          url: "/admin/premium/plans",
          attributes: payload,
        });
        toast.success("Plan yaratildi");
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
    [createMutation, navigate],
  );

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/premium/plans");
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
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
            isSubmitting={isCreating}
            submitLabel="Yaratish"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreatePlan;
