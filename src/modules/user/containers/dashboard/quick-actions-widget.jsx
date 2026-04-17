import React from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Droplets,
  Dumbbell,
  Scale,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useMeasurements from "@/hooks/app/use-measurements";
import useHealthGoals from "@/hooks/app/use-health-goals";

const ACTIONS = [
  {
    id: "water",
    label: "Suv qo'shish",
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    id: "meal",
    label: "Ovqat qo'shish",
    icon: Utensils,
    color: "text-orange-500",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
  },
  {
    id: "workout",
    label: "Mashg'ulot",
    icon: Dumbbell,
    color: "text-green-500",
    bg: "bg-green-500/10 hover:bg-green-500/20",
  },
  {
    id: "weight",
    label: "Og'irlik",
    icon: Scale,
    color: "text-purple-500",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
];

const WeightDrawer = ({ open, onOpenChange }) => {
  const [value, setValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const { saveMeasurement } = useMeasurements();

  const handleSave = async () => {
    const weight = parseFloat(value);
    if (!weight || weight <= 0 || weight > 500) {
      toast.error("To'g'ri og'irlik kiriting (kg)");
      return;
    }
    setIsSaving(true);
    try {
      await saveMeasurement({
        date: format(new Date(), "yyyy-MM-dd"),
        weight,
      });
      toast.success(`${weight} kg saqlandi`);
      setValue("");
      onOpenChange(false);
    } catch {
      toast.error("Og'irlikni saqlab bo'lmadi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Og'irlik yozish</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="Masalan: 72.5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="flex-1"
              inputMode="decimal"
            />
            <span className="text-sm text-muted-foreground shrink-0">kg</span>
          </div>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!value || isSaving}
          >
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const QuickActionsWidget = ({ dateKey }) => {
  const navigate = useNavigate();
  const { addWaterCup } = useDailyTrackingActions();
  const { goals } = useHealthGoals();
  const [weightDrawerOpen, setWeightDrawerOpen] = React.useState(false);
  const [addingWater, setAddingWater] = React.useState(false);

  const cupSize = goals?.waterCupMl ?? 250;

  const handleAction = React.useCallback(
    async (id) => {
      if (id === "water") {
        if (addingWater) return;
        setAddingWater(true);
        try {
          await addWaterCup(dateKey, cupSize);
          toast.success(`${cupSize} ml suv qo'shildi`);
        } catch {
          toast.error("Suv qo'shib bo'lmadi");
        } finally {
          setAddingWater(false);
        }
      } else if (id === "meal") {
        navigate("/user/nutrition");
      } else if (id === "workout") {
        navigate("/user/workout");
      } else if (id === "weight") {
        setWeightDrawerOpen(true);
      }
    },
    [addingWater, addWaterCup, dateKey, cupSize, navigate],
  );

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isLoading = action.id === "water" && addingWater;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action.id)}
              disabled={isLoading}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 min-w-[80px] transition-colors shrink-0 disabled:opacity-60 ${action.bg}`}
            >
              <Icon className={`size-5 ${action.color}`} />
              <span className="text-xs font-medium whitespace-nowrap">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      <WeightDrawer
        open={weightDrawerOpen}
        onOpenChange={setWeightDrawerOpen}
      />
    </>
  );
};

export default QuickActionsWidget;
