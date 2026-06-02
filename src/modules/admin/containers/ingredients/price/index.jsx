import React from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
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
import { useDeleteQuery, useGetQuery, usePatchQuery } from "@/hooks/api";

import {
  BUDGET_TIERS,
  budgetTierLabel,
  formatMoney,
  getPayload,
  NumberInput,
  priceSchema,
  PRICE_REGIONS,
  PRICE_SEASONS,
  PRICE_UNITS,
  QUERY_KEY,
  regionalPriceSchema,
} from "../components/utils.jsx";

import find from "lodash/find";
import map from "lodash/map";
import some from "lodash/some";
import toNumber from "lodash/toNumber";

const PricePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, refetch } = useGetQuery({
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
  const regionalForm = useForm({
    resolver: zodResolver(regionalPriceSchema),
    defaultValues: {
      regionKey: "uzbekistan",
      regionName: "O'zbekiston",
      season: "all",
      priceAmount: 0,
      priceUnit: "kg",
      currency: "UZS",
      budgetTier: "auto",
    },
  });
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  const regionalMutation = usePatchQuery({
    queryKey: ["admin", "ingredients", id],
    listKey: QUERY_KEY,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: ["admin", "ingredients", id],
    listKey: QUERY_KEY,
  });

  React.useEffect(() => {
    if (!item) return;
    form.reset({
      priceAmount: toNumber(item.priceAmount) || 0,
      priceUnit: some(PRICE_UNITS, (unit) => unit.value === item.priceUnit)
        ? item.priceUnit
        : "kg",
      currency: item.currency || "UZS",
      budgetTier: item.budgetTier || "auto",
    });
  }, [form, item]);

  const regionKey = regionalForm.watch("regionKey");
  React.useEffect(() => {
    const region = find(PRICE_REGIONS, (option) => option.value === regionKey);
    if (region && regionalForm.getValues("regionName") !== region.label) {
      regionalForm.setValue("regionName", region.label, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [regionKey, regionalForm]);

  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: `/admin/ingredients/${id}/price`,
      attributes: values,
    });
    toast.success("Ingredient narxi saqlandi");
    await refetch();
  };
  const onRegionalSubmit = async (values) => {
    await regionalMutation.mutateAsync({
      url: `/admin/ingredients/${id}/regional-prices`,
      attributes: values,
    });
    toast.success("Region narxi saqlandi");
    regionalForm.reset({
      ...values,
      priceAmount: 0,
      budgetTier: "auto",
    });
    await refetch();
  };
  const onRegionalDelete = async (priceId) => {
    await deleteMutation.mutateAsync({
      url: `/admin/ingredients/${id}/regional-prices/${priceId}`,
    });
    toast.success("Region narxi o'chirildi");
    await refetch();
  };
  const amount = form.watch("priceAmount");
  const unit = form.watch("priceUnit");
  const previewPer100g = React.useMemo(() => {
    if (unit === "dona") return null;
    if (unit === "kg" || unit === "litr") return amount / 10;
    if (unit === "100g") return amount;
    return amount * 100;
  }, [amount, unit]);
  const regionalAmount = regionalForm.watch("priceAmount");
  const regionalUnit = regionalForm.watch("priceUnit");
  const regionalPreviewPer100g = React.useMemo(() => {
    if (regionalUnit === "dona") return null;
    if (regionalUnit === "kg" || regionalUnit === "litr") {
      return regionalAmount / 10;
    }
    if (regionalUnit === "100g") return regionalAmount;
    return regionalAmount * 100;
  }, [regionalAmount, regionalUnit]);
  const regionalPrices = React.useMemo(
    () => item?.regionalPrices ?? [],
    [item?.regionalPrices],
  );

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && navigate("/admin/ingredients/list")}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Narx</DrawerTitle>
          <DrawerDescription>
            Asosiy narx va region/season bo'yicha narxlarni boshqaring
          </DrawerDescription>
        </DrawerHeader>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody className="max-h-[72vh] overflow-y-auto no-scrollbar">
              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-2xl border p-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold">Asosiy narx</h3>
                    <p className="text-sm text-muted-foreground">
                      Region topilmasa budget hisobida shu narx ishlatiladi
                    </p>
                  </div>
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
                </section>
                <section className="rounded-2xl border p-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold">
                      Region va season narxi
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Masalan Toshkent yozgi narxi yoki umumiy region narxi
                    </p>
                  </div>
                  <Form {...regionalForm}>
                    <form
                      id="ingredient-regional-price-form"
                      className="grid gap-4 md:grid-cols-2"
                      onSubmit={regionalForm.handleSubmit(onRegionalSubmit)}
                    >
                      <FormField
                        control={regionalForm.control}
                        name="regionKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <FormControl>
                              <OptionDrawerPicker
                                value={field.value}
                                onChange={field.onChange}
                                options={PRICE_REGIONS}
                                title="Region"
                                placeholder="Region tanlang"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionalForm.control}
                        name="season"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Season</FormLabel>
                            <FormControl>
                              <OptionDrawerPicker
                                value={field.value}
                                onChange={field.onChange}
                                options={PRICE_SEASONS}
                                title="Season"
                                placeholder="Season tanlang"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionalForm.control}
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
                        control={regionalForm.control}
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
                        control={regionalForm.control}
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
                        control={regionalForm.control}
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
                      <div className="rounded-2xl border bg-muted/30 p-3 text-sm md:col-span-2">
                        <div className="text-muted-foreground">
                          Region uchun taxminiy 100g narx
                        </div>
                        <div className="mt-1 font-semibold">
                          {formatMoney(
                            regionalPreviewPer100g,
                            regionalForm.watch("currency"),
                          )}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={regionalMutation.isPending}
                        className="md:col-span-2"
                      >
                        Region narxini saqlash
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-5 space-y-2">
                    {regionalPrices.length ? (
                      map(regionalPrices, (price) => (
                        <div
                          key={price.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {price.regionName} -{" "}
                              {
                                find(PRICE_SEASONS, (season) => season.value === price.season)?.label
                              }
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatMoney(price.pricePer100g, price.currency)}
                              /100g - {budgetTierLabel(price.budgetTier)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={deleteMutation.isPending}
                            onClick={() => onRegionalDelete(price.id)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Hali region narxlari kiritilmagan
                      </div>
                    )}
                  </div>
                </section>
              </div>
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
