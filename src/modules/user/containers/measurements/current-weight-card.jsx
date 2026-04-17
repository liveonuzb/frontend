import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { motion } from "framer-motion";
import { get } from "lodash";

export const CurrentWeightCard = ({ currentW, onOpenModal }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
              Hozirgi vazn
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-foreground">
                {currentW > 0 ? currentW.toFixed(1) : "—"}
              </span>
              <span className="text-xl font-bold text-muted-foreground">
                kg
              </span>
            </div>
            <p className="text-sm text-balance mt-2 text-muted-foreground font-medium px-4">
              Hozircha o'zgarishlar yaxshi ketyapti. Qadamlarni mo'tadil
              tashlang!
            </p>
            <Button
              onClick={onOpenModal}
              className="mt-4 rounded-full px-8 font-bold h-11 bg-primary hover:bg-primary/90 text-white"
            >
              <PencilIcon className="size-4 mr-2" /> Vazn kiritish
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
