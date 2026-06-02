/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { useParams } from "react-router";
import find from "lodash/find";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import split from "lodash/split";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner.jsx";
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

const formatDateValue = (dateStr) => {
  if (!dateStr) return "";
  try {
    return split(new Date(dateStr).toISOString(), "T")[0];
  } catch {
    return "";
  }
};

const createFormFromData = (data) => ({
  code: get(data, "code", ""),
  description: get(data, "description", ""),
  discountType: get(data, "discountType", "PERCENTAGE"),
  discountValue: get(data, "discountValue", "") != null ? String(get(data, "discountValue")) : "",
  maxUses: get(data, "maxUses") != null ? String(get(data, "maxUses")) : "",
  stackable: get(data, "stackable", false),
  minPlanPrice: get(data, "minPlanPrice") != null ? String(get(data, "minPlanPrice")) : "",
  validFrom: formatDateValue(get(data, "validFrom")),
  validTo: formatDateValue(get(data, "validTo")),
  applicablePlanIds: get(data, "applicablePlanIds", []) || [],
  isActive: get(data, "isActive", true),
});

const EditPromoCode = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    PREMIUM_PROMO_CODES_PATH,
  );
  const { canManageGrowth } = useAdminPermissions();

  const { data: promoData, isLoading } = useGetQuery({
    url: "/admin/premium/promo-codes",
    queryProps: { queryKey: ["admin", "promo-codes"] },
  });
  const promoCodes = get(promoData, "data.data", []);
  const promoCode = find(promoCodes, (c) => String(get(c, "id")) === String(id));

  const [form, setForm] = React.useState(emptyPromoCodeForm);

  React.useEffect(() => {
    if (promoCode) {
      setForm(createFormFromData(promoCode));
    }
  }, [promoCode]);

  const patchMutation = usePatchQuery({
    queryKey: ["admin", "promo-codes"],
  });
  const isUpdating = patchMutation.isPending;

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
      await patchMutation.mutateAsync({
        url: `/admin/premium/promo-codes/${id}`,
        attributes,
      });
      toast.success("Promo kod yangilandi");
      closeAdminDrawer();
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Promo kodni saqlab bo'lmadi",
      );
    }
  }, [canManageGrowth, closeAdminDrawer, form, id, patchMutation]);

  const handleOpenChange = (open) => {
    if (!open) closeAdminDrawer();
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon className="size-5" />
              Promo kodni tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              Promo kod sozlamalarini o'zgartiring.
            </DrawerDescription>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center px-4 py-10">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            <PromoCodeForm form={form} setForm={setForm} />
          </div>
          )}

          <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
            <Button onClick={handleSave} disabled={isUpdating || isLoading || !canManageGrowth}>
              Saqlash
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditPromoCode;
