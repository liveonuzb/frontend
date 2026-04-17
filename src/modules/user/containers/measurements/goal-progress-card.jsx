import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2Icon, TargetIcon } from "lucide-react";
import { motion } from "framer-motion";
import { round, min, get } from "lodash";

export const GoalProgressCard = ({
  startW,
  currentW,
  targetW,
  progressDone,
  onOpenModal,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-full flex flex-col"
    >
      <Card className="h-full flex flex-col">
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                <TargetIcon className="size-4 text-orange-600 dark:text-orange-500" />
              </div>
              <span className="font-bold text-sm">Maqsad progressi</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full hover:bg-muted shrink-0"
              onClick={onOpenModal}
            >
              <Settings2Icon className="size-3.5 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-tighter">
              <span>Bosh: {Number(startW).toFixed(1)} kg</span>
              <span className="text-primary">{round(progressDone * 100)}%</span>
              <span>Maqsad: {Number(targetW).toFixed(1)} kg</span>
            </div>

            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${min([100, progressDone * 100])}%` }}
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700 ease-out"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-muted-foreground/5 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Hozirgi vazn
              </span>
              <span className="text-lg font-black">
                {Number(currentW).toFixed(1)} kg
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Qoldi
              </span>
              <span className="text-lg font-black text-primary">
                {Math.abs(currentW - targetW).toFixed(1)} kg
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
