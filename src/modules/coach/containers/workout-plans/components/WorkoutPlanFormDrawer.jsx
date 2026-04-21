import React from "react";
import { get, isArray, trim } from "lodash";
import { toast } from "sonner";
import WorkoutPlanBuilder from "@/components/workout-plan-builder/index.jsx";
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
  useCoachWorkoutPlan,
  useCoachWorkoutPlansMutations,
} from "@/modules/coach/lib/hooks/useCoachWorkoutPlans";

const WorkoutPlanFormDrawer = ({ mode, planId, open, onOpenChange }) => {
  const mutations = useCoachWorkoutPlansMutations();

  const { data: existingData, isLoading: isLoadingPlan } = useCoachWorkoutPlan(
    planId,
    {},
    { enabled: mode === "edit" && Boolean(planId) },
  );

  const existingPlan =
    get(existingData, "data.data", null) || get(existingData, "data", null);

  const [step, setStep] = React.useState("meta");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [builderData, setBuilderData] = React.useState(null);

  React.useEffect(() => {
    if (mode === "edit" && existingPlan && !isLoadingPlan) {
      setName(existingPlan.name || "");
      setDescription(existingPlan.description || "");
      setBuilderData(existingPlan);
    }
  }, [mode, existingPlan, isLoadingPlan]);

  React.useEffect(() => {
    if (mode === "create" && open) {
      setName(`Yangi mashq rejasi ${new Date().toLocaleDateString("uz-UZ")}`);
      setDescription("");
      setBuilderData(null);
      setStep("meta");
    }
  }, [mode, open]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleContinueToBuilder = () => {
    if (!trim(name)) {
      toast.error("Reja nomini kiriting");
      return;
    }
    setStep("builder");
  };

  const handleSaveMetadata = async () => {
    if (!trim(name)) {
      toast.error("Reja nomini kiriting");
      return;
    }
    if (!planId) return;

    try {
      await mutations.updateResource(planId, {
        name: trim(name),
        description: trim(description),
        schedule: existingPlan?.schedule || [],
      });
      toast.success("Mashq rejasi ma'lumotlari yangilandi");
      handleClose();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
    }
  };

  const handleBuilderSave = async (plan) => {
    if (!trim(name)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    const payload = {
      name: trim(name),
      description: trim(description),
      schedule: plan.schedule || [],
    };

    try {
      if (mode === "edit" && planId) {
        await mutations.updateResource(planId, payload);
        toast.success("Mashq rejasi yangilandi");
      } else {
        await mutations.createResource(payload);
        toast.success("Yangi mashq rejasi yaratildi");
      }
      handleClose();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
    }
  };

  if (step === "builder") {
    return (
      <WorkoutPlanBuilder
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setStep("meta");
        }}
        initialData={
          builderData
            ? { ...builderData, name: trim(name), description: trim(description) }
            : { name: trim(name), description: trim(description), schedule: [] }
        }
        onSave={handleBuilderSave}
        onClose={() => setStep("meta")}
        fullscreen
        lockWeekDays
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {mode === "edit" ? "Mashq rejasini tahrirlash" : "Yangi mashq rejasi"}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "edit"
              ? "Nom va izohni yangilang, keyin builderda tarkibni tahrir qiling."
              : "Avval reja nomi va izohini kiriting, keyin builder ochiladi."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="workout-plan-name">Reja nomi</Label>
            <Input
              id="workout-plan-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Full Body A"
              disabled={isLoadingPlan}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-plan-description">Izoh</Label>
            <Textarea
              id="workout-plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ushbu reja haqida batafsil ma'lumot..."
              className="min-h-[120px] resize-none"
              disabled={isLoadingPlan}
            />
          </div>
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
  );
};

export default WorkoutPlanFormDrawer;
