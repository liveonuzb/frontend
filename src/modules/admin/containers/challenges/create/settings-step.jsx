import React from "react";
import { entries } from "lodash";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";

const METRIC_TYPE_META = {
  STEPS: { label: "Qadam", unit: "qadam" },
  WORKOUT_MINUTES: { label: "Mashq vaqti", unit: "daqiqa" },
  BURNED_CALORIES: { label: "Yondirilgan kaloriya", unit: "kcal" },
  SLEEP_HOURS: { label: "Uyqu", unit: "soat" },
};

const METRIC_AGGREGATION_META = {
  SUM: "Yig'indi",
  AVERAGE: "O'rtacha",
};

const SettingsStep = ({ formData, setFormData, onNext, onBack }) => {
  const isPlacePercentInput =
    formData.rewardMode === "PLACE_XP" && Number(formData.joinFeeXp || 0) > 0;

  return (
    <>
      <DrawerBody className="flex flex-col gap-8 py-6">
        {/* Vaqt va holat */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
            Vaqt sozlamalari
          </span>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel className="font-semibold">Boshlanish vaqti</FieldLabel>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="rounded-xl"
                />
              </Field>
              <Field>
                <FieldLabel className="font-semibold">Tugash vaqti</FieldLabel>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="rounded-xl"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Musobaqa sozlamalari */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
            Musobaqa sozlamalari
          </span>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel className="font-semibold">Kirish narxi (XP)</FieldLabel>
                <NumberField
                  value={formData.joinFeeXp !== "" ? Number(formData.joinFeeXp) : undefined}
                  onValueChange={(val) =>
                    setFormData((current) => ({
                      ...current,
                      joinFeeXp: val !== undefined ? String(val) : "",
                    }))
                  }
                  step={10}
                  minValue={0}
                  maxValue={100000}
                  formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="0" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </Field>
              <Field>
                <FieldLabel className="font-semibold">Maks ishtirokchi</FieldLabel>
                <NumberField
                  value={formData.maxParticipants !== "" ? Number(formData.maxParticipants) : undefined}
                  onValueChange={(val) =>
                    setFormData((current) => ({
                      ...current,
                      maxParticipants: val !== undefined ? String(val) : "",
                    }))
                  }
                  step={1}
                  minValue={1}
                  maxValue={100000}
                  formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="Cheksiz" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </Field>
            </div>

            <Field>
              <FieldLabel className="font-semibold">Mukofot rejimi</FieldLabel>
              <ToggleGroup
                type="single"
                value={formData.rewardMode}
                onValueChange={(value) => {
                  if (value) setFormData((current) => ({ ...current, rewardMode: value }));
                }}
                className="w-full justify-start rounded-xl border p-1"
              >
                <ToggleGroupItem value="FIXED_XP" className="flex-1 rounded-lg text-xs md:text-sm">Fixed XP</ToggleGroupItem>
                <ToggleGroupItem value="PERCENT_OF_POOL" className="flex-1 rounded-lg text-xs md:text-sm">Pool foizi</ToggleGroupItem>
                <ToggleGroupItem value="PLACE_XP" className="flex-1 rounded-lg text-xs md:text-sm">O'rinlar bo'yicha</ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel className="font-semibold">Challenge metrikasi</FieldLabel>
                <Select
                  value={formData.metricType}
                  onValueChange={(value) =>
                    setFormData((current) => ({ ...current, metricType: value }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {entries(METRIC_TYPE_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="font-semibold">Hisoblash usuli</FieldLabel>
                <Select
                  value={formData.metricAggregation}
                  onValueChange={(value) =>
                    setFormData((current) => ({ ...current, metricAggregation: value }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {entries(METRIC_AGGREGATION_META).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="font-semibold">
                  Maqsad ({METRIC_TYPE_META[formData.metricType]?.unit || "unit"})
                </FieldLabel>
                <NumberField
                  value={formData.metricTarget !== "" ? Number(formData.metricTarget) : undefined}
                  onValueChange={(val) =>
                    setFormData((current) => ({
                      ...current,
                      metricTarget: val !== undefined ? String(val) : "",
                    }))
                  }
                  step={0.01}
                  minValue={0.01}
                  maxValue={999999}
                  formatOptions={{ signDisplay: "never", maximumFractionDigits: 2 }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="0" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </Field>
            </div>

            {formData.rewardMode === "FIXED_XP" ? (
              <Field>
                <FieldLabel className="font-semibold">Umumiy mukofot (XP)</FieldLabel>
                <NumberField
                  value={formData.rewardXp !== "" ? Number(formData.rewardXp) : undefined}
                  onValueChange={(val) =>
                    setFormData((current) => ({
                      ...current,
                      rewardXp: val !== undefined ? String(val) : "",
                    }))
                  }
                  step={10}
                  minValue={0}
                  maxValue={1000000}
                  formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="0" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </Field>
            ) : null}

            {formData.rewardMode === "PERCENT_OF_POOL" ? (
              <Field>
                <FieldLabel className="font-semibold">Mukofot foizi (%)</FieldLabel>
                <NumberField
                  value={formData.rewardPercent !== "" ? Number(formData.rewardPercent) : undefined}
                  onValueChange={(val) =>
                    setFormData((current) => ({
                      ...current,
                      rewardPercent: val !== undefined ? String(val) : "",
                    }))
                  }
                  step={0.01}
                  minValue={0.01}
                  maxValue={100}
                  formatOptions={{ signDisplay: "never", maximumFractionDigits: 2 }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="0" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
                <p className="text-xs text-muted-foreground">
                  Pool = qatnashchilar soni x kirish XP. Mukofot shu pooldan foiz bo'yicha hisoblanadi.
                </p>
              </Field>
            ) : null}

            {formData.rewardMode === "PLACE_XP" ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isPlacePercentInput
                    ? "Kirish narxi mavjud: o'rinlar uchun foiz kiriting (masalan 50, 30, 20)."
                    : "Kirish narxi 0: o'rinlar uchun to'g'ridan-to'g'ri XP kiriting."}
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel className="font-semibold">{`1-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                    <NumberField
                      value={formData.firstPlaceXp !== "" ? Number(formData.firstPlaceXp) : undefined}
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          firstPlaceXp: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={1}
                      minValue={0}
                      maxValue={isPlacePercentInput ? 100 : 1000000}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: isPlacePercentInput ? 2 : 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">{`2-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                    <NumberField
                      value={formData.secondPlaceXp !== "" ? Number(formData.secondPlaceXp) : undefined}
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          secondPlaceXp: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={1}
                      minValue={0}
                      maxValue={isPlacePercentInput ? 100 : 1000000}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: isPlacePercentInput ? 2 : 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">{`3-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                    <NumberField
                      value={formData.thirdPlaceXp !== "" ? Number(formData.thirdPlaceXp) : undefined}
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          thirdPlaceXp: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={1}
                      minValue={0}
                      maxValue={isPlacePercentInput ? 100 : 1000000}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: isPlacePercentInput ? 2 : 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter className="mt-5">
        <Button onClick={onNext} className="gap-2">
          Keyingisi
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          Ortga
        </Button>
      </DrawerFooter>
    </>
  );
};

export default SettingsStep;
