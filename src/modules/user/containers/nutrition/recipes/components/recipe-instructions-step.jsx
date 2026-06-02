import React from "react";
import { CalendarPlusIcon, LightbulbIcon, PlusIcon, SendIcon } from "lucide-react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StepInstructionCard from "./step-instruction-card.jsx";
import NutritionSummary from "./nutrition-summary.jsx";

const RecipeInstructionsStep = ({
  steps,
  nutrition,
  visibility,
  onVisibilityChange,
  onStepChange,
  onStepAdd,
  onStepDelete,
  onStepMoveUp,
  onStepMoveDown,
  onDraftSave,
  onPublish,
  onAddToMealPlan,
}) => (
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Qadamlar / Yo'riqnoma
          </h2>
          <p className="text-sm text-muted-foreground">
            Retseptni tayyorlash bosqichlarini ketma-ket qo'shing.
          </p>
        </div>
        <Button type="button" onClick={onStepAdd}>
          <PlusIcon data-icon="inline-start" />
          Qadam qo'shish
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {map(steps, (step, index) => (
          <StepInstructionCard
            key={step.id}
            step={step}
            index={index}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
            onChange={onStepChange}
            onDelete={onStepDelete}
            onMoveUp={onStepMoveUp}
            onMoveDown={onStepMoveDown}
          />
        ))}
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <LightbulbIcon className="mt-0.5 size-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Maslahat:</span>{" "}
            Qadamlar aniq va qisqa bo'lsa, retseptni bajarish oson bo'ladi.
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Oziqlaviy qiymat (jami)</CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionSummary nutrition={nutrition} className="grid-cols-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ko'rinish (visibility)</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={visibility} onValueChange={onVisibilityChange}>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3">
              <RadioGroupItem value="public" aria-label="Ommaga ochiq" />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Ommaga ochiq
                </span>
                <span className="text-sm text-muted-foreground">
                  Barcha foydalanuvchilar retseptni ko'rishi va saqlashi mumkin.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3">
              <RadioGroupItem value="private" aria-label="Faqat men uchun" />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Faqat men uchun
                </span>
                <span className="text-sm text-muted-foreground">
                  Faqat siz retseptni ko'rasiz.
                </span>
              </span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retseptni saqlash va nashr etish</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={onDraftSave}>
            Qoralama sifatida saqlash
          </Button>
          <Button type="button" onClick={onPublish}>
            <SendIcon data-icon="inline-start" />
            Nashr etish
          </Button>
          <Button type="button" variant="secondary" onClick={onAddToMealPlan}>
            <CalendarPlusIcon data-icon="inline-start" />
            Ovqatlanish rejasiga qo'shish
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Nashr etilgandan so'ng, retseptni tahrirlashingiz va yangilashingiz mumkin.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default RecipeInstructionsStep;
