import { LeafIcon, PalmtreeIcon, TargetIcon } from "lucide-react";
import { APP_MODES } from "@/store";

export const MODE_OPTIONS = [
  {
    value: APP_MODES.MADAGASCAR,
    title: "Madagascar mode",
    description: "Wild, playful and energetic.",
    icon: PalmtreeIcon,
    accent: "from-amber-500/18 via-orange-400/10 to-transparent",
    pageTint: "from-amber-500/20 via-orange-400/10 to-transparent",
    border: "border-amber-500/25",
    iconTone: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    dotTone: "bg-gradient-to-br from-amber-500 to-orange-500",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
  },
  {
    value: APP_MODES.FOCUS,
    title: "Focus mode",
    description: "Clean, minimal and distraction-free.",
    icon: TargetIcon,
    accent: "from-slate-500/16 via-zinc-400/9 to-transparent",
    pageTint: "from-slate-500/18 via-zinc-400/10 to-transparent",
    border: "border-slate-400/25",
    iconTone: "bg-gradient-to-br from-slate-500 to-zinc-600 text-white",
    dotTone: "bg-gradient-to-br from-slate-500 to-zinc-600",
    buttonTone:
      "from-slate-600 to-zinc-700 hover:from-slate-600/90 hover:to-zinc-700/90 text-white shadow-[0_18px_44px_rgba(71,85,105,0.22)]",
  },
  {
    value: APP_MODES.ZEN,
    title: "Zen mode",
    description: "Soft, calm and nature-inspired.",
    icon: LeafIcon,
    accent: "from-teal-500/15 via-green-400/8 to-transparent",
    pageTint: "from-teal-500/18 via-green-400/10 to-transparent",
    border: "border-teal-600/22",
    iconTone: "bg-gradient-to-br from-teal-500 to-green-600 text-white",
    dotTone: "bg-gradient-to-br from-teal-500 to-green-600",
    buttonTone:
      "from-teal-600 to-green-700 hover:from-teal-600/90 hover:to-green-700/90 text-white shadow-[0_18px_44px_rgba(20,148,122,0.22)]",
  },
];
