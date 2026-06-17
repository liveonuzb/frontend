import React from "react";
import {
  CheckCircle2Icon,
  DropletIcon,
  DumbbellIcon,
  FlameIcon,
  HeartIcon,
  HelpCircleIcon,
  UtensilsIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { cn } from "@/lib/utils";

const resultMeta = {
  water: {
    label: "Suv",
    icon: DropletIcon,
    tone: "text-sky-700 bg-sky-50",
  },
  meal: {
    label: "Food",
    icon: UtensilsIcon,
    tone: "text-orange-700 bg-orange-50",
  },
  calorie: {
    label: "Kaloriya",
    icon: FlameIcon,
    tone: "text-emerald-700 bg-emerald-50",
  },
  workout: {
    label: "Mashq",
    icon: DumbbellIcon,
    tone: "text-blue-700 bg-blue-50",
  },
  mood: {
    label: "Kayfiyat",
    icon: HeartIcon,
    tone: "text-pink-700 bg-pink-50",
  },
  unknown: {
    label: "Aniqlanmadi",
    icon: HelpCircleIcon,
    tone: "text-slate-600 bg-slate-50",
  },
};

const formatItem = (item) => {
  const amount =
    item?.amount !== undefined && item?.amount !== null
      ? `${Number(item.amount).toLocaleString("uz-UZ")} ${item.unit || ""}`.trim()
      : "";
  const name = item?.name || item?.category || "";
  return [name, amount].filter(Boolean).join(" · ");
};

const DetectedResultCard = ({ result, className }) => {
  if (!result) return null;

  const meta = resultMeta[result.type] || resultMeta.unknown;
  const Icon = meta.icon;
  const confidence = Number(result.confidence || 0);
  const confidenceText =
    confidence >= 0.7 ? "Aniqlandi" : `${Math.round(confidence * 100)}%`;

  return (
    <Card
      size="sm"
      className={cn(
        "gap-0 border-0 bg-white/90 shadow-none ring-1 ring-emerald-100",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              meta.tone,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Aniqlangan tur
                </p>
                <p className="text-base font-semibold text-slate-950">
                  {meta.label}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="h-7 bg-emerald-50 text-emerald-700"
              >
                <CheckCircle2Icon className="size-3.5" />
                {confidenceText}
              </Badge>
            </div>

            {result.items?.length ? (
              <div className="mt-3 space-y-2">
                {result.items.map((item, index) => (
                  <div
                    key={`${item.category}-${index}`}
                    className="rounded-2xl bg-emerald-50/55 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    {formatItem(item)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Aniq miqdor topilmadi.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectedResultCard;
