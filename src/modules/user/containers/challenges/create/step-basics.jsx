import React from "react";
import { addDays, format } from "date-fns";
import { Clock3Icon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMetricMeta } from "../challenge-utils.js";
import ChallengeCoverPicker from "./challenge-cover-picker.jsx";
import { StepSection } from "./form-fields.jsx";

import { map, toNumber } from "lodash";

const toInputDate = (date) => format(date, "yyyy-MM-dd");

const TEMPLATES = [
  {
    title: "7 kunlik 10K qadam",
    description: "Har kuni 10 000 qadamlik qisqa challenge.",
    metricType: "STEPS",
    metricTarget: 10000,
    durationDays: 7,
  },
  {
    title: "30 kunlik mashq",
    description: "30 kun davomida har kuni mashq vaqtini yig'ing.",
    metricType: "WORKOUT_MINUTES",
    metricTarget: 30,
    durationDays: 30,
  },
  {
    title: "Kaloriya yoqish maraton",
    description: "14 kunlik kaloriya yoqish marafoni.",
    metricType: "BURNED_CALORIES",
    metricTarget: 500,
    durationDays: 14,
  },
  {
    title: "Uyqu isloh qilish",
    description: "7 kun davomida uyqu rejimini tartibga soling.",
    metricType: "SLEEP_HOURS",
    metricTarget: 8,
    durationDays: 7,
  },
];

const StepBasics = ({ form, setForm, imagePreviewUrl, onImageChange, onImageRemove }) => {
  const applyTemplate = (template) => {
    const startDate = new Date();
    const endDate = addDays(startDate, template.durationDays);
    setForm((current) => ({
      ...current,
      title: template.title,
      description: template.description,
      metricType: template.metricType,
      metricTarget: template.metricTarget,
      metricAggregation: "SUM",
      durationDays: template.durationDays,
      startDate: toInputDate(startDate),
      endDate: toInputDate(endDate),
    }));
  };

  return (
    <StepSection
      title="Asosiy ma'lumotlar"
      description="Challenge nomi, qisqa tavsifi va ko'rinadigan cover rasmini belgilang."
    >
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div>
          <h3 className="text-sm font-semibold">Tayyor shablonlardan tanlang</h3>
          <p className="text-xs text-muted-foreground">
            Tanlanganda keyingi steplar avtomatik to'ldiriladi.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {map(TEMPLATES, (template) => {
            const metric = getMetricMeta(template.metricType);
            const isSelected =
              form.title === template.title &&
              form.metricType === template.metricType &&
              toNumber(form.metricTarget) === template.metricTarget;

            return (
              <Button
                key={template.title}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="h-auto justify-start rounded-md px-3 py-2 text-left"
                onClick={() => applyTemplate(template)}
              >
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-sm font-semibold">{template.title}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
                    <span className="inline-flex items-center gap-1">
                      <TargetIcon className="size-3" />
                      {template.metricTarget.toLocaleString()} {metric.shortUnit}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3Icon className="size-3" />
                      {template.durationDays} kun
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      <ChallengeCoverPicker
        imageFile={form.imageFile}
        imagePreviewUrl={imagePreviewUrl}
        onImageChange={onImageChange}
        onImageRemove={onImageRemove}
      />
      <div className="space-y-2">
        <label className="text-sm font-bold">Sarlavha</label>
        <Input
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Chellenj nomi"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold">Tavsif</label>
        <Textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Chellenj haqida qisqacha"
          className="min-h-24 resize-none"
        />
      </div>
    </StepSection>
  );
};

export default StepBasics;
