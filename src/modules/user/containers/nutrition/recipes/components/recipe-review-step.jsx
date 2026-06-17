import React from "react";
import { CalendarPlusIcon, SendIcon } from "lucide-react";
import map from "lodash/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import NutritionSummary from "./nutrition-summary.jsx";
import RecipeImage from "./recipe-image.jsx";

const RecipeReviewStep = ({
  basicInfo,
  ingredients,
  steps,
  nutrition,
  imageUrl,
  visibility,
  publishStatus,
  onDraftSave,
  onPublish,
  onAddToMealPlan,
  isSubmitting,
}) => (
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
            <RecipeImage src={imageUrl} alt={basicInfo.title || "Retsept rasmi"} />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {basicInfo.title || "Retsept nomi"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {basicInfo.description || "Qisqa tavsif shu yerda ko'rinadi..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {map(basicInfo.tags, (tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <NutritionSummary nutrition={nutrition} />
          </div>
        </div>

        <Separator />

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Ingredientlar
            </h3>
            {map(ingredients, (ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0"
              >
                <span>{ingredient.name}</span>
                <span className="text-muted-foreground">
                  {ingredient.quantity} {ingredient.unit}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Tayyorlash bosqichlari
            </h3>
            {map(steps, (step, index) => (
              <div key={step.id} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-semibold text-foreground">
                    {step.title}
                  </span>
                  <span className="text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nashr holati</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ko'rinish</span>
            <span className="font-semibold text-foreground">
              {visibility === "public" ? "Ommaga ochiq" : "Faqat men uchun"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Holat</span>
            <span className="font-semibold text-foreground">{publishStatus}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onDraftSave}
          >
            Qoralama sifatida saqlash
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onPublish}>
            <SendIcon data-icon="inline-start" />
            Admin ko'rib chiqishiga yuborish
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onAddToMealPlan}
          >
            <CalendarPlusIcon data-icon="inline-start" />
            Rejaga qo'shish
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default RecipeReviewStep;
