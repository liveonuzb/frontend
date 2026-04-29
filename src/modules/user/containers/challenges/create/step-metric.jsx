import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getMetricMeta } from "../challenge-utils.js";
import { LabeledNumberField, StepSection } from "./form-fields.jsx";
import MetricTypeSelectTrigger, {
  MetricTypeSelectDrawer,
} from "./metric-type-select-drawer.jsx";

const StepMetric = ({ form, setForm }) => {
  const [metricOpen, setMetricOpen] = React.useState(false);
  const metric = getMetricMeta(form.metricType);

  const handleMetricChange = (metricType) => {
    const nextMetric = getMetricMeta(metricType);
    setForm((current) => ({
      ...current,
      metricType,
      metricTarget: nextMetric.default,
    }));
  };

  return (
    <StepSection
      title="O'lchov va maqsad"
      description="Challenge qanday hisoblanishini va kunlik maqsadni tanlang."
    >
      <div className="space-y-2">
        <label className="text-sm font-bold">O'lchov turi</label>
        <MetricTypeSelectTrigger
          value={form.metricType}
          onClick={() => setMetricOpen(true)}
        />
      </div>
      <LabeledNumberField
        label={`Maqsad qiymati (${metric.shortUnit})`}
        value={form.metricTarget}
        onChange={(metricTarget) =>
          setForm((current) => ({ ...current, metricTarget }))
        }
        min={metric.min}
        max={metric.max}
        step={metric.step}
      />
      <div className="space-y-2">
        <label className="text-sm font-bold">Hisoblash usuli</label>
        <ToggleGroup
          type="single"
          value={form.metricAggregation}
          onValueChange={(value) => {
            if (value)
              setForm((current) => ({ ...current, metricAggregation: value }));
          }}
          className="w-full rounded-md border bg-muted/20 p-1"
        >
          <ToggleGroupItem value="SUM" className="flex-1 rounded-sm">
            Jami
          </ToggleGroupItem>
          <ToggleGroupItem value="AVERAGE" className="flex-1 rounded-sm">
            O'rtacha
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <MetricTypeSelectDrawer
        open={metricOpen}
        onOpenChange={setMetricOpen}
        value={form.metricType}
        onChange={handleMetricChange}
      />
    </StepSection>
  );
};

export default StepMetric;
