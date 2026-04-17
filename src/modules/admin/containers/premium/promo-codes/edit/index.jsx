import React from "react";
import { useNavigate, useParams } from "react-router";
import { find, get, isArray, join } from "lodash";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import PromoCodeForm, {
  emptyPromoCodeForm,
} from "../components/promo-code-form.jsx";

const formatDateValue = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
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
  const navigate = useNavigate();
  const { id } = useParams();

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
    const code = form.code.trim();
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
      discountValue: Number(form.discountValue),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      stackable: form.stackable,
      minPlanPrice: form.minPlanPrice ? Number(form.minPlanPrice) : null,
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
      navigate("/admin/premium/promo-codes");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Promo kodni saqlab bo'lmadi",
      );
    }
  }, [form, id, navigate, patchMutation]);

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/premium/promo-codes");
  };

  if (isLoading) return null;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
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

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
            <PromoCodeForm form={form} setForm={setForm} />
          </div>

          <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
            <Button onClick={handleSave} disabled={isUpdating}>
              Saqlash
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Bekor qilish</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditPromoCode;
