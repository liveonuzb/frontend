import React, { useMemo, useState } from "react";
import { defaultTo, each, filter, get, isEmpty, size, sortBy } from "lodash";
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
        const name = String(get(item, "name", "")).trim();
        if (!name) return;

        const qty = Number(get(item, "qty")) || 1;
        const grams =
          Number(get(item, "grams")) || Number(get(item, "defaultAmount")) || 0;
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
        existing.totalCal += (Number(get(item, "cal")) || 0) * qty;
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

const downloadPDF = (shoppingList, planName, checkedItems) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 20;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkY = (needed = 8) => {
    if (y + needed > 275) addPage();
  };

  doc.setFillColor(249, 115, 22);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Xaridlar ro'yxati", margin + 6, y + 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, pageW - margin - 6, y + 13, { align: "right" });

  y += 26;

  if (planName) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`Reja: ${planName}`, margin, y);
    y += 7;
  }

  const total = shoppingList.length;
  const bought = shoppingList.filter((i) => checkedItems[i.name]).length;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Jami: ${total} ta mahsulot  |  Xarid qilingan: ${bought}`,
    margin,
    y,
  );
  y += 10;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  shoppingList.forEach((item, idx) => {
    checkY(10);

    const isChecked = !!checkedItems[item.name];

    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, y - 4, contentW, 9, 1, 1, "F");
    }

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.rect(margin + 1, y - 3, 5, 5);
    if (isChecked) {
      doc.setDrawColor(34, 197, 94); // green
      doc.setLineWidth(0.8);
      doc.line(margin + 2, y, margin + 3.5, y + 1.5);
      doc.line(margin + 3.5, y + 1.5, margin + 5.5, y - 1.5);
    }

    doc.setTextColor(
      isChecked ? 160 : 30,
      isChecked ? 160 : 30,
      isChecked ? 160 : 30,
    );
    doc.setFontSize(10);
    doc.setFont("helvetica", isChecked ? "normal" : "bold");
    doc.text(item.name, margin + 9, y + 0.5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    const amountStr =
      item.totalAmount > 0
        ? `${item.totalAmount} ${item.unit}`
        : `x${item.count}`;
    doc.text(amountStr, pageW - margin - 28, y + 0.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const metaStr =
      item.totalAmount > 0
        ? `x${item.count} • ${item.totalCal} kcal`
        : `${item.totalCal} kcal`;
    doc.text(metaStr, pageW - margin, y + 0.5, { align: "right" });

    y += 10;
  });

  // --- Footer ---
  y += 4;
  checkY(10);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("LiveOn — Sog'lom turmush tarzi", margin, y);

  const fileName = planName
    ? `xaridlar-${planName.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : "xaridlar-royxati.pdf";
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
            shoppingList.map((item) => (
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
                downloadPDF(shoppingList, planName, checkedShoppingItems)
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
