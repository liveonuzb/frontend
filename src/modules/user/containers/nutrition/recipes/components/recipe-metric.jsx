import React from "react";

const RecipeMetric = ({ icon: Icon, value, label }) => (
  <div className="rounded-[18px] border border-border/60 bg-background/70 px-3 py-2">
    <div className="flex items-center gap-1.5 text-sm font-black text-foreground">
      {Icon ? <Icon className="size-3.5 text-primary" /> : null}
      {value}
    </div>
    <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
      {label}
    </div>
  </div>
);

export default RecipeMetric;
