import React from "react";
import { usePutQuery } from "@/hooks/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  filter,
  sortBy,
  map,
  values,
  keyBy,
  takeRight,
  get,
  max,
  min,
} from "lodash";

import { AiInsightWidget } from "./ai-insight-widget";
import { CurrentWeightCard } from "./current-weight-card";
import { GoalProgressCard } from "./goal-progress-card";
import { BmiCard } from "./bmi-card";
import { WeightHistoryChart } from "./weight-history-chart";
import { WeightInputDrawer } from "./weight-input-drawer";
import { GoalInputDrawer } from "./goal-input-drawer";
import { HeightWeightDrawer } from "./height-weight-drawer";
import useMe, { ME_QUERY_KEY } from "@/hooks/app/use-me";

const weightSchema = z.object({
  weight: z.coerce
    .number({ invalid_type_error: "Iltimos, vazn kiriting" })
    .min(20, "Vazn juda kam")
    .max(300, "Vazn juda yuqori"),
});

const goalSchema = z.object({
  weight: z.coerce
    .number({ invalid_type_error: "Iltimos, vazn kiriting" })
    .min(20, "Vazn juda kam")
    .max(300, "Vazn juda yuqori"),
});

const heightSchema = z.object({
  height: z.coerce
    .number({ invalid_type_error: "Iltimos, bo'y kiriting" })
    .min(100, "Bo'y juda kam")
    .max(250, "Bo'y juda baland"),
});

export const WeightTab = ({
  history,
  saveMeasurement,
  deleteMeasurement,
  getLatest,
}) => {
  const { onboarding } = useMe();
  const onboardingTarget = get(onboarding, "targetWeight");
  const onboardingWeight = get(onboarding, "currentWeight");
  const onboardingHeight = get(onboarding, "height");
  const { mutateAsync: saveOnboarding } = usePutQuery({
    queryKey: ME_QUERY_KEY,
  });

  const [openWeightModal, setOpenWeightModal] = React.useState(false);
  const [openGoalModal, setOpenGoalModal] = React.useState(false);
  const [openHeightWeightModal, setOpenHeightWeightModal] =
    React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [chartPeriod, setChartPeriod] = React.useState("week");

  const latest = getLatest();
  const currentW =
    get(latest, "weight") || parseFloat(get(onboardingWeight, "value")) || 0;
  const targetW = parseFloat(get(onboardingTarget, "value")) || 0;

  const historyLen = get(history, "length", 0);
  const startW =
    historyLen >= 2
      ? get(history, `[${historyLen - 1}].weight`, currentW)
      : parseFloat(get(onboardingWeight, "value")) || currentW;

  const progressRange = targetW > 0 ? Math.abs(startW - targetW) : 0;
  const progressDone =
    progressRange > 0
      ? max([0, min([1, Math.abs(startW - currentW) / progressRange])])
      : 0;

  const heightCm = parseFloat(get(onboardingHeight, "value")) || 0;
  const heightM = heightCm / 100;
  const bmi =
    heightM > 0 && currentW > 0 ? currentW / (heightM * heightM) : null;

  const getBMICategory = (val) => {
    if (!val) return null;
    if (val < 18.5)
      return {
        label: "Underweight",
        color: "text-blue-500",
        bg: "bg-blue-500/15",
      };
    if (val < 25)
      return {
        label: "Normal",
        color: "text-green-500",
        bg: "bg-green-500/15",
      };
    if (val < 30)
      return {
        label: "Overweight",
        color: "text-yellow-500",
        bg: "bg-yellow-500/15",
      };
    return { label: "Obese", color: "text-red-500", bg: "bg-red-500/15" };
  };
  const bmiInfo = getBMICategory(bmi);

  const patchOnboarding = React.useCallback(
    async (patch) => {
      return saveOnboarding({
        url: "/user/onboarding/user",
        attributes: patch,
      });
    },
    [saveOnboarding],
  );

  const patchHeight = React.useCallback(
    async (heightValue) => {
      return saveOnboarding({
        url: "/user/measurements/height",
        attributes: {
          value: Number(heightValue),
          unit: "cm",
        },
      });
    },
    [saveOnboarding],
  );

  const weightForm = useForm({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: currentW > 0 ? currentW : "",
    },
  });

  const goalForm = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { weight: targetW > 0 ? targetW : "" },
  });

  const heightForm = useForm({
    resolver: zodResolver(heightSchema),
    defaultValues: {
      height: heightCm > 0 ? String(heightCm) : "170",
    },
  });

  const getFilteredHistory = () => {
    const withWeight = filter(history, (h) => get(h, "weight", 0) > 0);
    const sortedList = sortBy(withWeight, (h) => new Date(get(h, "date")));
    const uniqueDaysMap = keyBy(
      sortedList,
      (h) => get(h, "date", "").split("T")[0],
    );
    const uniqueSorted = values(uniqueDaysMap);

    if (chartPeriod === "day") return takeRight(uniqueSorted, 7);
    if (chartPeriod === "week") return takeRight(uniqueSorted, 14);
    if (chartPeriod === "month") return takeRight(uniqueSorted, 30);
    return uniqueSorted;
  };

  const chartData = map(getFilteredHistory(), (h) => ({
    date: get(h, "date", "").split("T")[0].slice(5),
    weight: get(h, "weight"),
  }));

  const onWeightSubmit = async (d) => {
    const kgVal = get(d, "weight");
    const isoDate = format(selectedDate, "yyyy-MM-dd");
    try {
      await saveMeasurement({ date: isoDate, weight: kgVal });
      toast.success("Vazn muvaffaqiyatli saqlandi!");
      setOpenWeightModal(false);
    } catch {
      toast.error("Vaznni saqlab bo'lmadi");
    }
  };

  const handleWeightDelete = async () => {
    const isoDate = format(selectedDate, "yyyy-MM-dd");
    try {
      await deleteMeasurement(isoDate);
      toast.error("Tanlangan kun uchun vazn o'chirildi");
      setOpenWeightModal(false);
    } catch {
      toast.error("Vaznni o'chirib bo'lmadi");
    }
  };

  const getAIInsight = () => {
    if (!targetW || currentW === 0) {
      return {
        message: "Vazningiz va maqsadingizni kiritib, tahlillarni oching!",
        color: "from-blue-500/10 to-transparent",
        textColor: "text-blue-500",
      };
    }

    const remaining = Math.abs(currentW - targetW);
    const isLosingGoal = startW > targetW;

    if (remaining <= 0.5) {
      return {
        message: "🎉 Tabriklaymiz! Siz maqsadingizga deyarli yetib keldingiz!",
        color: "from-green-500/10 to-transparent",
        textColor: "text-green-500",
      };
    }

    let progressMsg = "";
    let rateColor = "from-primary/10 to-transparent";
    let rateTextColor = "text-primary";

    if (get(history, "length", 0) >= 2) {
      const firstDate = new Date(get(history, "[0].date"));
      const latestDate = new Date(get(latest, "date", new Date()));
      const daysElapsed = max([
        1,
        (latestDate - firstDate) / (1000 * 60 * 60 * 24),
      ]);
      const weeksElapsed = daysElapsed / 7;
      const weightChanged = Math.abs(startW - currentW);
      const weeklyRate = weightChanged / (weeksElapsed > 0 ? weeksElapsed : 1);

      if (weeklyRate > 0.1) {
        const weeksToGoal = Math.ceil(remaining / weeklyRate);
        progressMsg = `Siz o'rtacha haftasiga ${weeklyRate.toFixed(1)} kg ${isLosingGoal ? "yo'qotyapsiz" : "qo'shyapsiz"}. Shu tempda taxminan ${weeksToGoal} haftada maqsadingizga yetasiz!`;
      } else {
        progressMsg = `Sizning vazningiz oxirgi paytlarda barqaror. Qanday ketayotgan bo'lsangiz shunday davom eting!`;
        rateColor = "from-orange-500/10 to-transparent";
        rateTextColor = "text-orange-500";
      }
    } else {
      progressMsg = `Ajoyib boshlanish! Maqsadingizgacha yana ${remaining.toFixed(1)} kg ${isLosingGoal ? "yo'qotishingiz" : "qo'shishingiz"} qoldi.`;
    }

    return { message: progressMsg, color: rateColor, textColor: rateTextColor };
  };

  return (
    <div className="flex flex-col gap-4">
      <AiInsightWidget insight={getAIInsight()} />

      <CurrentWeightCard
        currentW={currentW}
        onOpenModal={() => {
          weightForm.reset({
            weight: currentW > 0 ? currentW : "",
            unit: "kg",
          });
          setOpenWeightModal(true);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalProgressCard
          startW={startW}
          currentW={currentW}
          targetW={targetW}
          progressDone={progressDone}
          onOpenModal={() => {
            goalForm.reset({ weight: targetW > 0 ? targetW : "", unit: "kg" });
            setOpenGoalModal(true);
          }}
        />

        <BmiCard
          bmi={bmi}
          heightCm={heightCm}
          currentW={currentW}
          onOpenModal={() => {
            heightForm.reset({
              height: heightCm > 0 ? String(heightCm) : "170",
            });
            setOpenHeightWeightModal(true);
          }}
        />
      </div>

      <WeightHistoryChart
        chartData={chartData}
        chartPeriod={chartPeriod}
        setChartPeriod={setChartPeriod}
        targetW={targetW}
      />

      <WeightInputDrawer
        open={openWeightModal}
        setOpen={setOpenWeightModal}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        form={weightForm}
        onSubmit={onWeightSubmit}
        onDelete={handleWeightDelete}
      />

      <GoalInputDrawer
        open={openGoalModal}
        setOpen={setOpenGoalModal}
        form={goalForm}
        onSubmit={async (d) => {
          try {
            await patchOnboarding({
              targetWeight: {
                value: Number(get(d, "weight")),
                unit: "kg",
              },
            });
            toast.success("Maqsad muvaffaqiyatli saqlandi!");
            setOpenGoalModal(false);
          } catch {
            toast.error("Maqsadni saqlab bo'lmadi");
          }
        }}
      />

      <HeightWeightDrawer
        open={openHeightWeightModal}
        setOpen={setOpenHeightWeightModal}
        form={heightForm}
        onSubmit={async (d) => {
          const hVal = Number(get(d, "height"));
          if (hVal > 0) {
            try {
              await patchHeight(hVal);
              toast.success("Bo'y yangilandi!");
              setOpenHeightWeightModal(false);
            } catch {
              toast.error("Bo'yni saqlab bo'lmadi");
            }
            return;
          }

          toast.error("Iltimos, ma'lumotlarni to'g'ri kiriting");
        }}
      />
    </div>
  );
};
