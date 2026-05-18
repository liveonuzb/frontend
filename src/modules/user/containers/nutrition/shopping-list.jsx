import React, { useMemo, useState } from "react";
import {
  defaultTo,
  each,
  filter,
  get,
  isEmpty,
  size,
  sortBy,
  forEach,
  map,
  reduce,
  toLower,
  toNumber,
  trim,
} from "lodash";
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
import { DownloadIcon } from "lucide-react";
import { jsPDF } from "jspdf";

const weekDays = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const buildShoppingList = (weeklyPlan) => {
  const productsMap = new Map();

  each(weekDays, (day) => {
    each(defaultTo(weeklyPlan[day], []), (col) => {
      each(defaultTo(get(col, "items"), []), (item) => {
        const name = trim(String(get(item, "name", "")));
        if (!name) return;

        const qty = toNumber(get(item, "qty")) || 1;
        const grams =
          toNumber(get(item, "grams")) || toNumber(get(item, "defaultAmount")) || 0;
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
  const amount = toNumber(get(item, "grams")) || toNumber(get(item, "defaultAmount")) || 0;
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

const downloadPDF = (weeklyPlan, shoppingList, planName, checkedItems) => {
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
    title: planName ? `${planName} - haftalik menyu` : "Haftalik menyu",
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
    doc.text("Haftalik menyu va xarid ro'yxati", margin + 24, y + 17);
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
  addSectionTitle("Haftalik menyu", "1 ustunli ko'rinish");

  each(weekDays, (day) => {
    const columns = defaultTo(weeklyPlan[day], []);
    const dayItemCount = reduce(columns, (sum, col) => sum + size(defaultTo(get(col, "items"), [])), 0);

    checkY(18);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(day, margin + 3, y + 1);
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
      doc.text(`${get(col, "type", "Ovqat")} ${get(col, "time") ? `(${get(col, "time")})` : ""}`, margin + 3, y);
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

      doc.setDrawColor(isChecked ? 34 : 203, isChecked ? 197 : 213, isChecked ? 94 : 225);
      doc.setLineWidth(0.4);
      doc.rect(margin + 2, y - 2.5, 4.5, 4.5);
      if (isChecked) {
        doc.setLineWidth(0.8);
        doc.line(margin + 2.8, y - 0.2, margin + 4.0, y + 1.1);
        doc.line(margin + 4.0, y + 1.1, margin + 6.0, y - 1.5);
      }

      doc.setFont("helvetica", isChecked ? "normal" : "bold");
      doc.setFontSize(9);
      doc.setTextColor(isChecked ? 148 : 30, isChecked ? 163 : 41, isChecked ? 184 : 59);
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
  const weeklyKanban = get(plan, "weeklyKanban", {});
  const planName = get(plan, "name", "");

  const shoppingList = useMemo(
    () => buildShoppingList(weeklyKanban),
    [weeklyKanban],
  );

  const checkedShoppingCount = useMemo(
    () => size(filter(shoppingList, (item) => checkedShoppingItems[item.name])),
    [shoppingList, checkedShoppingItems],
  );

  const toggleShoppingItem = (name) => {
    setCheckedShoppingItems((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <Drawer direction={"bottom"} open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
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
        </DrawerHeader>
        <DrawerBody className="space-y-2">
          {isLoading || isFetching ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Reja yuklanmoqda...
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
                key={item.name}
                className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <Checkbox
                  checked={!!checkedShoppingItems[item.name]}
                  onCheckedChange={() => toggleShoppingItem(item.name)}
                  aria-label={`${item.name} ni xarid qilingan deb belgilash`}
                />
                <span className="text-lg">{item.emoji}</span>
                <span
                  className={
                    checkedShoppingItems[item.name]
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
                    {item.totalAmount > 0 ? `x${item.count} marta` : ""}{" "}
                    {item.totalCal} kcal
                  </span>
                </div>
              </label>
            ))
          )}
        </DrawerBody>
        <DrawerFooter>
          {!isEmpty(shoppingList) && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadPDF(
                  weeklyKanban,
                  shoppingList,
                  planName,
                  checkedShoppingItems,
                )
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
