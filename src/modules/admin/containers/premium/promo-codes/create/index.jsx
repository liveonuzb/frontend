import React from "react";
import { get, isArray, join, toNumber, trim } from "lodash";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import PromoCodeForm, {
  emptyPromoCodeForm,
} from "../components/promo-code-form.jsx";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const PREMIUM_PROMO_CODES_PATH = "/admin/premium/promo-codes";

const CreatePromoCode = () => {
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    PREMIUM_PROMO_CODES_PATH,
  );
  const { canManageGrowth } = useAdminPermissions();
  const [form, setForm] = React.useState(emptyPromoCodeForm);

  const createMutation = usePostQuery({
    queryKey: ["admin", "promo-codes"],
  });
  const isCreating = createMutation.isPending;

  const handleSave = React.useCallback(async () => {
    if (!canManageGrowth) return;

    const code = trim(form.code);
    if (!code) {
      toast.error("Promo kodni kiriting");
      return;
    }
    if (!form.discountValue) {
      toast.error("Chegirma qiymatini kiriting");
      return;
    }

    const attributes = {
      code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: toNumber(form.discountValue),
      maxUses: form.maxUses ? toNumber(form.maxUses) : null,
      stackable: form.stackable,
      minPlanPrice: form.minPlanPrice ? toNumber(form.minPlanPrice) : null,
      validFrom: form.validFrom || undefined,
      validTo: form.validTo || undefined,
      applicablePlanIds:
        form.applicablePlanIds.length > 0
          ? form.applicablePlanIds
          : undefined,
      isActive: form.isActive,
    };

    try {
      await createMutation.mutateAsync({
        url: "/admin/premium/promo-codes",
        attributes,
      });
      toast.success("Promo kod yaratildi");
      closeAdminDrawer();
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Promo kodni saqlab bo'lmadi",
      );
    }
  }, [canManageGrowth, closeAdminDrawer, createMutation, form]);

  const handleOpenChange = (open) => {
    if (!open) closeAdminDrawer();
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PlusIcon className="size-5" />
              Yangi promo kod
            </DrawerTitle>
            <DrawerDescription>
              Yangi promo kod yarating va sozlamalarini kiriting.
            </DrawerDescription>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
            <PromoCodeForm form={form} setForm={setForm} />
          </div>

          <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
            <Button onClick={handleSave} disabled={isCreating || !canManageGrowth}>
              Yaratish
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreatePromoCode;
