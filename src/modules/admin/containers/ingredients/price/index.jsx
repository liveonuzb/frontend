import React from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import OptionDrawerPicker from "@/components/option-drawer-picker";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

import {
  BUDGET_TIERS,
  formatMoney,
  getPayload,
  NumberInput,
  priceSchema,
  PRICE_UNITS,
  QUERY_KEY,
} from "../components/utils.jsx";

const PricePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({
    url: `/admin/ingredients/${id}`,
    queryProps: {
      queryKey: ["admin", "ingredients", id],
      enabled: Boolean(id),
    },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      priceAmount: 0,
      priceUnit: "kg",
      currency: "UZS",
      budgetTier: "auto",
    },
  });
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });

  React.useEffect(() => {
    if (!item) return;
    form.reset({
      priceAmount: Number(item.priceAmount) || 0,
      priceUnit: PRICE_UNITS.some((unit) => unit.value === item.priceUnit)
        ? item.priceUnit
        : "kg",
      currency: item.currency || "UZS",
      budgetTier: item.budgetTier || "auto",
    });
  }, [form, item]);

  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: `/admin/ingredients/${id}/price`,
      attributes: values,
    });
    toast.success("Ingredient narxi saqlandi");
    navigate("/admin/ingredients/list");
  };
  const amount = form.watch("priceAmount");
  const unit = form.watch("priceUnit");
  const previewPer100g = React.useMemo(() => {
    if (unit === "dona") return null;
    if (unit === "kg" || unit === "litr") return amount / 10;
    if (unit === "100g") return amount;
    return amount * 100;
  }, [amount, unit]);

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/ingredients/list")}
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Narx</DrawerTitle>
          <DrawerDescription>
            Budget hisobida 100g uchun narx ishlatiladi
          </DrawerDescription>
        </DrawerHeader>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form
                  id="ingredient-price-form"
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="priceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Narx</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            step={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Narx birligi</FormLabel>
                        <FormControl>
                          <OptionDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={PRICE_UNITS}
                            title="Narx birligi"
                            placeholder="Tanlang"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valyuta</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget turi</FormLabel>
                        <FormControl>
                          <OptionDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={BUDGET_TIERS}
                            title="Budget turi"
                            placeholder="Tanlang"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
                    <div className="text-muted-foreground">
                      Taxminiy 100g narx
                    </div>
                    <div className="mt-1 font-semibold">
                      {formatMoney(previewPer100g, form.watch("currency"))}
                    </div>
                  </div>
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                form="ingredient-price-form"
                type="submit"
                disabled={mutation.isPending}
              >
                Saqlash
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default PricePage;
