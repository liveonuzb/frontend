import React from "react";
import { get, isArray, trim } from "lodash";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";
import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
import AiGeneratorDrawer from "@/components/meal-plan-builder/ai-generator-drawer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useCoachMealPlan,
  useCoachMealPlansMutations,
} from "@/modules/coach/lib/hooks/useCoachMealPlans";

const MealPlanFormDrawer = ({ mode, mealPlanId, open, onOpenChange }) => {
  const mutations = useCoachMealPlansMutations();

  const { data: existingData, isLoading: isLoadingPlan } = useCoachMealPlan(
    mealPlanId,
    {},
    { enabled: mode === "edit" && Boolean(mealPlanId) },
  );

  const existingPlan =
    get(existingData, "data.data", null) || get(existingData, "data", null);

  const [step, setStep] = React.useState("meta");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [builderData, setBuilderData] = React.useState({});
  const [aiGeneratorOpen, setAiGeneratorOpen] = React.useState(false);

  React.useEffect(() => {
    if (mode === "edit" && existingPlan && !isLoadingPlan) {
      setTitle(existingPlan.title || "");
      setDescription(existingPlan.description || "");
      setBuilderData(existingPlan.weeklyKanban || {});
    }
  }, [mode, existingPlan, isLoadingPlan]);

  React.useEffect(() => {
    if (mode === "create" && open) {
      setTitle(`Yangi reja ${new Date().toLocaleDateString("uz-UZ")}`);
      setDescription("");
      setBuilderData({});
      setStep("meta");
    }
  }, [mode, open]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleContinueToBuilder = () => {
    if (!trim(title)) {
      toast.error("Reja nomini kiriting");
      return;
    }
    setStep("builder");
  };

  const handleSaveMetadata = async () => {
    if (!trim(title)) {
      toast.error("Reja nomini kiriting");
      return;
    }
    if (!mealPlanId) return;

    try {
      await mutations.updateResource(mealPlanId, {
        title: trim(title),
        description: trim(description),
        weeklyKanban: existingPlan?.weeklyKanban || {},
        tags: existingPlan?.tags || [],
        source: existingPlan?.source || "manual",
      });
      toast.success("Reja ma'lumotlari yangilandi");
      handleClose();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
    }
  };

  const handleBuilderSave = async (weeklyKanban) => {
    if (!trim(title)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    const payload = {
      title: trim(title),
      description: trim(description),
      weeklyKanban,
      tags: existingPlan?.tags || [],
      source: existingPlan?.source || "manual",
    };

    try {
      if (mode === "edit" && mealPlanId) {
        await mutations.updateResource(mealPlanId, payload);
        toast.success("Ovqatlanish rejasi yangilandi");
      } else {
        await mutations.createResource(payload);
        toast.success("Yangi ovqatlanish rejasi yaratildi");
      }
      handleClose();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
    }
  };

  const handleAiGenerate = (weeklyKanban) => {
    setAiGeneratorOpen(false);
    setBuilderData(weeklyKanban);
    setStep("builder");
  };

  if (step === "builder") {
    return (
      <>
        <MealPlanBuilder
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) setStep("meta");
          }}
          initialData={builderData}
          onSave={handleBuilderSave}
          onClose={() => setStep("meta")}
        />
        <AiGeneratorDrawer
          open={aiGeneratorOpen}
          onOpenChange={setAiGeneratorOpen}
          onGenerate={handleAiGenerate}
        />
      </>
    );
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>
              {mode === "edit" ? "Reja ma'lumotlari" : "Yangi ovqatlanish rejasi"}
            </DrawerTitle>
            <DrawerDescription>
              {mode === "edit"
                ? "Nom va izohni yangilang, keyin builderda tarkibni tahrir qiling."
                : "Avval reja nomi va izohini kiriting, keyin builder ochiladi."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="meal-plan-title">Reja nomi</Label>
              <Input
                id="meal-plan-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Vazn yo'qotish rejasi"
                disabled={isLoadingPlan}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-plan-description">Izoh</Label>
              <Textarea
                id="meal-plan-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reja maqsadi yoki qisqacha tavsifini yozing"
                className="min-h-[120px] resize-none"
                disabled={isLoadingPlan}
              />
            </div>

            {mode === "create" ? (
              <button
                type="button"
                onClick={() => setAiGeneratorOpen(true)}
                className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 transition-colors"
              >
                <SparklesIcon className="size-4" />
                AI yordamida yaratish
              </button>
            ) : null}
          </div>

          <DrawerFooter className="flex flex-col gap-2 px-6 py-4">
            <Button onClick={handleContinueToBuilder} className="w-full" disabled={isLoadingPlan}>
              {mode === "edit" ? "Saqlash va tahrirlash" : "Saqlash va davom etish"}
            </Button>
            {mode === "edit" ? (
              <Button
                variant="secondary"
                onClick={handleSaveMetadata}
                className="w-full"
                disabled={mutations.updateMutation.isPending || isLoadingPlan}
              >
                Faqat ma&apos;lumotlarni saqlash
              </Button>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AiGeneratorDrawer
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        onGenerate={handleAiGenerate}
      />
    </>
  );
};

export default MealPlanFormDrawer;
