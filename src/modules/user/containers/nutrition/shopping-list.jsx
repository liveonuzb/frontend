import React, { useEffect, useMemo, useState } from "react";
import defaultTo from "lodash/defaultTo";
import each from "lodash/each";
import filter from "lodash/filter";
import get from "lodash/get";
import isArray from "lodash/isArray";
import isEmpty from "lodash/isEmpty";
import size from "lodash/size";
import sortBy from "lodash/sortBy";
import forEach from "lodash/forEach";
import map from "lodash/map";
import reduce from "lodash/reduce";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  mealPlanDaysToKanban,
  useGenerateMealPlanShoppingList,
  useMealPlanShoppingLists,
  useUpdateShoppingListItemCheck,
} from "@/hooks/app/use-meal-plan";

const weekDays = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const priceRegions = [
  { value: "", label: "Umumiy" },
  { value: "uzbekistan", label: "O'zbekiston" },
  { value: "tashkent", label: "Toshkent" },
  { value: "samarqand", label: "Samarqand" },
  { value: "buxoro", label: "Buxoro" },
  { value: "fargona", label: "Farg'ona" },
  { value: "andijon", label: "Andijon" },
  { value: "namangan", label: "Namangan" },
  { value: "qashqadaryo", label: "Qashqadaryo" },
  { value: "surxondaryo", label: "Surxondaryo" },
  { value: "xorazm", label: "Xorazm" },
  { value: "navoiy", label: "Navoiy" },
  { value: "jizzax", label: "Jizzax" },
  { value: "sirdaryo", label: "Sirdaryo" },
  { value: "qoraqalpogiston", label: "Qoraqalpog'iston" },
];

const priceSeasons = [
  { value: "all", label: "Butun yil" },
  { value: "spring", label: "Bahor" },
  { value: "summer", label: "Yoz" },
  { value: "autumn", label: "Kuz" },
  { value: "winter", label: "Qish" },
];

export const getPlanShoppingDays = (plan) => {
  if (isArray(plan?.days)) {
    return map(plan.days, (day, index) => ({
      key: `day-${day?.dayNumber || index + 1}`,
      label: `${day?.dayNumber || index + 1}-kun`,
    }));
  }

  const durationDays = toNumber(get(plan, "durationDays")) || 0;

  if (durationDays > weekDays.length) {
    return Array.from({ length: durationDays }, (_, index) => ({
      key: `day-${index + 1}`,
      label: `${index + 1}-kun`,
    }));
  }

  return map(weekDays, (day) => ({ key: day, label: day }));
};

export const buildShoppingList = (planOrWeeklyPlan) => {
  const hasPlanShape =
    planOrWeeklyPlan &&
    typeof planOrWeeklyPlan === "object" &&
    (Object.prototype.hasOwnProperty.call(planOrWeeklyPlan, "days") ||
      Object.prototype.hasOwnProperty.call(planOrWeeklyPlan, "weeklyKanban"));
  const weeklyPlan = hasPlanShape
    ? isArray(get(planOrWeeklyPlan, "days"))
      ? mealPlanDaysToKanban(get(planOrWeeklyPlan, "days", []))
      : get(planOrWeeklyPlan, "weeklyKanban", {})
    : planOrWeeklyPlan || {};
  const shoppingDays = getPlanShoppingDays(
    hasPlanShape ? planOrWeeklyPlan : { weeklyKanban: weeklyPlan },
  );
  const productsMap = new Map();

  each(shoppingDays, ({ key }) => {
    each(defaultTo(weeklyPlan[key], []), (col) => {
      each(defaultTo(get(col, "items"), []), (item) => {
        const name = trim(String(get(item, "name", "")));
        if (!name) return;

        const qty = toNumber(get(item, "qty")) || 1;
        const grams =
          toNumber(get(item, "grams")) ||
          toNumber(get(item, "defaultAmount")) ||
          0;
        const unit = get(item, "unit", "g");

        const existing = productsMap.get(name) || {
          name,
          count: 0,
          totalCal: 0,
          totalAmount: 0,
          unit,
          emoji: get(item, "emoji", "🛒"),
          category: get(item, "category", ""),
        };

        existing.count += qty;
        existing.totalCal += (toNumber(get(item, "cal")) || 0) * qty;
        existing.totalAmount += grams * qty;
        productsMap.set(name, existing);
      });
    });
  });

  return sortBy(Array.from(productsMap.values()), [
    (item) => -item.count,
    (item) => item.name,
  ]);
};

const getItemAmountLabel = (item) => {
  const amount =
    toNumber(get(item, "grams")) || toNumber(get(item, "defaultAmount")) || 0;
  const unit = get(item, "unit", "g");
  return amount > 0 ? `${amount} ${unit}` : "";
};

const getItemMetaLabel = (item) => {
  const cal = toNumber(get(item, "cal")) || 0;
  const protein = toNumber(get(item, "protein")) || 0;
  const carbs = toNumber(get(item, "carbs")) || 0;
  const fat = toNumber(get(item, "fat")) || 0;
  const macros = [];

  if (cal) macros.push(`${cal} kcal`);
  if (protein) macros.push(`P ${protein}g`);
  if (carbs) macros.push(`C ${carbs}g`);
  if (fat) macros.push(`F ${fat}g`);

  return macros.join("  ");
};

const getFileSafeName = (value, fallback) => {
  const safe = toLower(trim(String(value || "")))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safe || fallback;
};

const formatCurrency = (value, currency = "UZS") => {
  const amount = toNumber(value) || 0;

  return `${new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency || "UZS"}`;
};

const getBudgetStatusLabel = (budget) => {
  if (!budget || !budget.targetCost) {
    return null;
  }

  const currency = budget.currency || "UZS";
  const difference = toNumber(budget.difference) || 0;

  if (budget.status === "over_budget" || difference > 0) {
    return `Byudjetdan ${formatCurrency(Math.abs(difference), currency)} oshdi`;
  }

  return `Byudjet ichida: ${formatCurrency(Math.abs(difference), currency)} qoldi`;
};

const getFamilyBudgetStatusLabel = (familyBudget) => {
  if (!familyBudget || !familyBudget.familyTargetCost) {
    return null;
  }

  const currency = familyBudget.currency || "UZS";
  const difference = toNumber(familyBudget.familyDifference) || 0;

  if (familyBudget.status === "over_budget" || difference > 0) {
    return `Oilaviy byudjetdan ${formatCurrency(Math.abs(difference), currency)} oshdi`;
  }

  return `Oilaviy byudjet ichida: ${formatCurrency(Math.abs(difference), currency)} qoldi`;
};

const buildPriceContextInput = (regionKey, season) => {
  const input = {};

  if (regionKey) {
    input.regionKey = regionKey;
  }

  if (season && season !== "all") {
    input.season = season;
  }

  return input;
};

const buildGeneratedShoppingList = (generatedList) =>
  map(get(generatedList, "items", []), (item) => ({
    id: get(item, "id", null),
    ingredientId: get(item, "ingredientId", null),
    name: get(item, "name", "Ingredient"),
    count: Math.max(1, size(get(item, "sources", []))),
    totalCal: 0,
    totalAmount: toNumber(get(item, "grams")) || 0,
    unit: get(item, "unit", "g"),
    emoji: "🛒",
    category: "ingredient",
    estimatedCost: get(item, "estimatedCost", null),
    currency:
      get(item, "currency") ||
      get(generatedList, "totals.currency") ||
      get(generatedList, "priceContext.currency") ||
      "UZS",
    priceSource: get(item, "priceSource", "unknown"),
    isChecked: get(item, "isChecked") === true,
  }));

const getShoppingItemKey = (item) =>
  get(item, "id") || get(item, "ingredientId") || get(item, "name");

const buildCheckedItemMap = (items = []) =>
  reduce(
    items,
    (result, item) => {
      const key = getShoppingItemKey(item);

      if (key && get(item, "isChecked") === true) {
        result[key] = true;
      }

      return result;
    },
    {},
  );

const downloadPDF = (plan, shoppingList, planName, checkedItems) => {
  const weeklyPlan = isArray(get(plan, "days"))
    ? mealPlanDaysToKanban(get(plan, "days", []))
    : get(plan, "weeklyKanban", {});
  const shoppingDays = getPlanShoppingDays(plan);
  const isDurationPlan =
    (toNumber(get(plan, "durationDays")) || 0) > weekDays.length;
  const planLabel = isDurationPlan ? "30 kunlik" : "Haftalik";
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const bottomLimit = pageH - 20;
  const dateStr = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let y = 16;

  doc.setProperties({
    title: planName ? `${planName} - menyu` : `${planLabel} menyu`,
    subject: "LiveOn meal plan export",
    creator: "LiveOn",
  });

  const addPage = () => {
    doc.addPage();
    y = 16;
  };

  const checkY = (needed = 10) => {
    if (y + needed > bottomLimit) addPage();
  };

  const addHeader = () => {
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin, y, contentW, 24, 4, 4, "F");
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(margin + 5, y + 5, 14, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("LO", margin + 12, y + 14, { align: "center" });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(15);
    doc.text("LiveOn", margin + 24, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${planLabel} menyu va xarid ro'yxati`, margin + 24, y + 17);
    doc.text(dateStr, pageW - margin - 5, y + 10, { align: "right" });
    if (planName) {
      doc.text(planName, pageW - margin - 5, y + 17, { align: "right" });
    }

    y += 32;
  };

  const addSectionTitle = (title, subtitle) => {
    checkY(18);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, margin, y);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, pageW - margin, y, { align: "right" });
    }
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 7;
  };

  const addWrappedText = (text, x, maxWidth, options = {}) => {
    const lines = doc.splitTextToSize(String(text || ""), maxWidth);
    doc.text(lines, x, y, options);
    y += lines.length * 4;
  };

  addHeader();
  addSectionTitle(`${planLabel} menyu`, "1 ustunli ko'rinish");

  each(shoppingDays, ({ key, label }) => {
    const columns = defaultTo(weeklyPlan[key], []);
    const dayItemCount = reduce(
      columns,
      (sum, col) => sum + size(defaultTo(get(col, "items"), [])),
      0,
    );

    checkY(18);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(label, margin + 3, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${dayItemCount} ta ovqat`, pageW - margin - 3, y + 1, {
      align: "right",
    });
    y += 10;

    if (!dayItemCount) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Reja kiritilmagan", margin + 3, y);
      y += 7;
      return;
    }

    each(columns, (col) => {
      const items = defaultTo(get(col, "items"), []);
      if (isEmpty(items)) return;

      checkY(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(249, 115, 22);
      doc.text(
        `${get(col, "type", "Ovqat")} ${get(col, "time") ? `(${get(col, "time")})` : ""}`,
        margin + 3,
        y,
      );
      y += 5;

      each(items, (item) => {
        const amount = getItemAmountLabel(item);
        const meta = getItemMetaLabel(item);

        checkY(meta ? 12 : 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        addWrappedText(get(item, "name", "Ovqat"), margin + 6, contentW - 40);
        if (amount) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(amount, pageW - margin - 3, y - 4, { align: "right" });
        }
        if (meta) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(meta, margin + 8, y);
          y += 4;
        }
      });

      y += 2;
    });

    y += 3;
  });

  addPage();
  addHeader();
  const total = shoppingList.length;
  const bought = filter(shoppingList, (item) => checkedItems[item.name]).length;
  addSectionTitle("Xarid ro'yxati", `${bought}/${total} belgilangan`);

  if (isEmpty(shoppingList)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Xarid ro'yxati bo'sh.", margin, y);
  } else {
    forEach(shoppingList, (item, idx) => {
      checkY(12);
      const isChecked = !!checkedItems[item.name];

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y - 4, contentW, 10, 2, 2, "F");
      }

      doc.setDrawColor(
        isChecked ? 34 : 203,
        isChecked ? 197 : 213,
        isChecked ? 94 : 225,
      );
      doc.setLineWidth(0.4);
      doc.rect(margin + 2, y - 2.5, 4.5, 4.5);
      if (isChecked) {
        doc.setLineWidth(0.8);
        doc.line(margin + 2.8, y - 0.2, margin + 4.0, y + 1.1);
        doc.line(margin + 4.0, y + 1.1, margin + 6.0, y - 1.5);
      }

      doc.setFont("helvetica", isChecked ? "normal" : "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        isChecked ? 148 : 30,
        isChecked ? 163 : 41,
        isChecked ? 184 : 59,
      );
      doc.text(item.name, margin + 10, y + 0.5);

      const amountStr =
        item.totalAmount > 0
          ? `${item.totalAmount} ${item.unit}`
          : `x${item.count}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(amountStr, pageW - margin - 38, y + 0.5, { align: "right" });

      const metaStr =
        item.totalAmount > 0
          ? `x${item.count} marta, ${item.totalCal} kcal`
          : `${item.totalCal} kcal`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(metaStr, pageW - margin - 3, y + 0.5, { align: "right" });

      y += 10;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 13, pageW - margin, pageH - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("LiveOn - Sog'lom turmush tarzi", margin, pageH - 8);
    doc.text(`${page}/${pageCount}`, pageW - margin, pageH - 8, {
      align: "right",
    });
  }

  const fileName = `${getFileSafeName(planName, "haftalik-menyu")}.pdf`;
  doc.save(fileName);
};

export const ShoppingList = ({
  open,
  onOpenChange,
  plan = null,
  isLoading = false,
  isFetching = false,
}) => {
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});
  const [generatedShoppingList, setGeneratedShoppingList] = useState(null);
  const [priceRegionKey, setPriceRegionKey] = useState("");
  const [priceSeason, setPriceSeason] = useState("all");
  const generatedPlanIdRef = React.useRef(null);
  const { generateShoppingList, isGeneratingShoppingList } =
    useGenerateMealPlanShoppingList();
  const planId = get(plan, "id", null);
  const planName = get(plan, "name", "");
  const {
    shoppingLists,
    latestShoppingList,
    isLoading: isLoadingShoppingLists,
    isFetching: isFetchingShoppingLists,
    refetch: refetchShoppingLists,
  } = useMealPlanShoppingLists(planId, { enabled: open });
  const { updateShoppingListItemCheck, isUpdatingShoppingListItem } =
    useUpdateShoppingListItemCheck(planId);

  const legacyShoppingList = useMemo(() => buildShoppingList(plan), [plan]);
  const generatedItems = useMemo(
    () => buildGeneratedShoppingList(generatedShoppingList),
    [generatedShoppingList],
  );
  const shoppingList = generatedItems.length > 0
    ? generatedItems
    : legacyShoppingList;
  const totalEstimatedCost =
    generatedItems.length > 0
      ? toNumber(get(generatedShoppingList, "totals.estimatedCost")) || 0
      : 0;
  const estimatedCostCurrency =
    get(generatedShoppingList, "totals.currency") ||
    get(generatedShoppingList, "priceContext.currency") ||
    "UZS";
  const budgetStatusLabel = getBudgetStatusLabel(
    get(generatedShoppingList, "budget", null),
  );
  const familyBudget = get(generatedShoppingList, "familyBudget", null);
  const familyBudgetStatusLabel = getFamilyBudgetStatusLabel(familyBudget);
  const familyEstimatedCost =
    toNumber(get(familyBudget, "familyEstimatedCost")) || 0;
  const familyMemberCount = toNumber(get(familyBudget, "memberCount")) || 0;
  const isGenerating =
    Boolean(planId) && isGeneratingShoppingList && !generatedShoppingList;
  const isLoadingSavedShoppingLists =
    Boolean(planId) &&
    (isLoadingShoppingLists || (isFetchingShoppingLists && !generatedShoppingList));

  useEffect(() => {
    if (!planId || generatedPlanIdRef.current !== planId) {
      setGeneratedShoppingList(null);
      setCheckedShoppingItems({});
      setPriceRegionKey("");
      setPriceSeason("all");
      generatedPlanIdRef.current = null;
    }
  }, [planId]);

  useEffect(() => {
    if (!open || !planId) {
      return undefined;
    }

    if (isLoadingShoppingLists) {
      return undefined;
    }

    if (latestShoppingList) {
      setGeneratedShoppingList(latestShoppingList);
      setCheckedShoppingItems(buildCheckedItemMap(latestShoppingList.items));
      setPriceRegionKey(get(latestShoppingList, "priceContext.regionKey") || "");
      setPriceSeason(get(latestShoppingList, "priceContext.season") || "all");
      generatedPlanIdRef.current = planId;
      return undefined;
    }

    if (generatedPlanIdRef.current === planId && generatedShoppingList) {
      return undefined;
    }

    let isCancelled = false;
    setGeneratedShoppingList(null);

    generateShoppingList(planId)
      .then((list) => {
        if (!isCancelled) {
          setGeneratedShoppingList(list);
          setCheckedShoppingItems(buildCheckedItemMap(list.items));
          generatedPlanIdRef.current = planId;
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error("Xarid ro'yxatini ingredientlar bo'yicha hisoblab bo'lmadi");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    generateShoppingList,
    generatedShoppingList,
    isLoadingShoppingLists,
    latestShoppingList,
    open,
    planId,
  ]);

  const checkedShoppingCount = useMemo(
    () =>
      size(
        filter(
          shoppingList,
          (item) => checkedShoppingItems[getShoppingItemKey(item)],
        ),
      ),
    [shoppingList, checkedShoppingItems],
  );

  const regenerateShoppingList = async () => {
    if (!planId || isGeneratingShoppingList) return;

    try {
      const priceContextInput = buildPriceContextInput(
        priceRegionKey,
        priceSeason,
      );
      const list = await generateShoppingList(
        planId,
        isEmpty(priceContextInput) ? undefined : priceContextInput,
      );
      setGeneratedShoppingList(list);
      setCheckedShoppingItems(buildCheckedItemMap(list.items));
      setPriceRegionKey(get(list, "priceContext.regionKey") || priceRegionKey);
      setPriceSeason(get(list, "priceContext.season") || priceSeason || "all");
      generatedPlanIdRef.current = planId;
      await refetchShoppingLists?.();
    } catch {
      toast.error("Xarid ro'yxatini qayta yaratib bo'lmadi");
    }
  };

  const toggleShoppingItem = async (item) => {
    const key = getShoppingItemKey(item);
    const nextChecked = !checkedShoppingItems[key];

    setCheckedShoppingItems((prev) => ({
      ...prev,
      [key]: nextChecked,
    }));

    if (!get(generatedShoppingList, "id") || !get(item, "id")) {
      return;
    }

    try {
      const list = await updateShoppingListItemCheck(
        generatedShoppingList.id,
        item.id,
        nextChecked,
      );

      setGeneratedShoppingList(list);
      setCheckedShoppingItems(buildCheckedItemMap(list.items));
    } catch {
      setCheckedShoppingItems((prev) => ({
        ...prev,
        [key]: !nextChecked,
      }));
      toast.error("Xarid holatini saqlab bo'lmadi");
    }
  };

  return (
    <Drawer direction={"bottom"} open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-black">
              Xaridlar ro'yxati{" "}
              <span className="text-sm font-medium text-muted-foreground">
                ({checkedShoppingCount}/{size(shoppingList)})
              </span>
            </DrawerTitle>
          </div>
          {planName && (
            <p className="text-xs text-muted-foreground mt-1">📋 {planName}</p>
          )}
          {totalEstimatedCost > 0 ? (
            <p className="mt-1 text-xs font-bold text-primary">
              Taxminiy xarajat:{" "}
              {formatCurrency(totalEstimatedCost, estimatedCostCurrency)}
            </p>
          ) : null}
          {budgetStatusLabel ? (
            <p
              className={
                get(generatedShoppingList, "budget.status") === "over_budget"
                  ? "mt-1 text-xs font-bold text-destructive"
                  : "mt-1 text-xs font-bold text-emerald-600"
              }
            >
              {budgetStatusLabel}
            </p>
          ) : null}
          {familyBudget && familyMemberCount > 1 && familyEstimatedCost > 0 ? (
            <p className="mt-1 text-xs font-bold text-primary">
              Oila ({familyMemberCount} kishi):{" "}
              {formatCurrency(
                familyEstimatedCost,
                get(familyBudget, "currency", estimatedCostCurrency),
              )}
            </p>
          ) : null}
          {familyBudgetStatusLabel ? (
            <p
              className={
                get(familyBudget, "status") === "over_budget"
                  ? "mt-1 text-xs font-bold text-destructive"
                  : "mt-1 text-xs font-bold text-emerald-600"
              }
            >
              {familyBudgetStatusLabel}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 text-left">
            <label className="text-[11px] font-bold text-muted-foreground">
              Hudud
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground"
                value={priceRegionKey}
                onChange={(event) => setPriceRegionKey(event.target.value)}
              >
                {map(priceRegions, (region) => (
                  <option key={region.value || "all"} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold text-muted-foreground">
              Mavsum
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground"
                value={priceSeason}
                onChange={(event) => setPriceSeason(event.target.value)}
              >
                {map(priceSeasons, (season) => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </DrawerHeader>
        <DrawerBody className="space-y-2">
          {isLoading || isFetching || isGenerating || isLoadingSavedShoppingLists ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {isGenerating
                ? "Xarid ro'yxati hisoblanmoqda..."
                : isLoadingSavedShoppingLists
                  ? "Saqlangan xarid ro'yxati yuklanmoqda..."
                  : "Reja yuklanmoqda..."}
            </div>
          ) : shoppingList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">🛒</p>
              <p className="text-sm font-bold text-foreground mb-1">
                Ro'yxat bo'sh
              </p>
              <p className="text-xs text-muted-foreground">
                Avval haftalik rejangizga ovqat qo'shing
              </p>
            </div>
          ) : (
            map(shoppingList, (item) => (
              <label
                key={getShoppingItemKey(item)}
                className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <Checkbox
                  checked={!!checkedShoppingItems[getShoppingItemKey(item)]}
                  disabled={isUpdatingShoppingListItem}
                  onCheckedChange={() => void toggleShoppingItem(item)}
                  aria-label={`${item.name} ni xarid qilingan deb belgilash`}
                />
                <span className="text-lg">{item.emoji}</span>
                <span
                  className={
                    checkedShoppingItems[getShoppingItemKey(item)]
                      ? "font-medium flex-1 line-through text-muted-foreground"
                      : "font-medium flex-1"
                  }
                >
                  {item.name}
                </span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs font-bold text-foreground/80 whitespace-nowrap">
                    {item.totalAmount > 0
                      ? `${item.totalAmount} ${item.unit}`
                      : `x${item.count}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {item.estimatedCost != null
                      ? formatCurrency(item.estimatedCost, item.currency)
                      : `${item.totalAmount > 0 ? `x${item.count} marta` : ""} ${
                          item.totalCal
                        } kcal`}
                  </span>
                </div>
              </label>
            ))
          )}
        </DrawerBody>
        <DrawerFooter>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {size(shoppingLists) > 0
                ? `${size(shoppingLists)} ta saqlangan ro'yxat`
                : "Saqlangan ro'yxat yo'q"}
            </span>
            {planId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1 px-2 text-xs"
                disabled={isGeneratingShoppingList}
                onClick={() => void regenerateShoppingList()}
              >
                <RefreshCwIcon
                  className={
                    isGeneratingShoppingList
                      ? "size-3.5 animate-spin"
                      : "size-3.5"
                  }
                />
                Qayta yaratish
              </Button>
            ) : null}
          </div>
          {!isEmpty(shoppingList) && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadPDF(plan, shoppingList, planName, checkedShoppingItems)
              }
            >
              <DownloadIcon className="size-3.5" />
              PDF
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
