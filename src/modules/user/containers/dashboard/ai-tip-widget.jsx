import React from "react";
import { SparklesIcon } from "lucide-react";
import { get } from "lodash";

const aiTips = [
  {
    text: "Bugun nonushtani o'tkazib yubormang — metabolizmingizni ishga tushiradi",
    emoji: "🌅",
  },
  {
    text: "Har 2 soatda bir stakan suv iching — tana energiyasini ushlab turadi",
    emoji: "💧",
  },
  {
    text: "Ko'proq oqsil iste'mol qiling — muskul saqlashga yordam beradi",
    emoji: "🍗",
  },
  {
    text: "Kechki ovqatni 19:00 dan oldin yeb bo'lishga harakat qiling",
    emoji: "🌙",
  },
  {
    text: "20 daqiqalik sayr ham 2000 qadam qo'shadi — harakatlaning!",
    emoji: "🚶",
  },
  {
    text: "Kaloriyaning 30% nonushtaga ajrating — tun bo'yi sarflangan energiyani tiklang",
    emoji: "☀️",
  },
  {
    text: "Ovqatdan 30 daqiqa oldin suv iching — kam kaloriya iste'mol qilishga yordam beradi",
    emoji: "💡",
  },
];

const dayOfYear = Math.floor(
  (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000,
);

export default function AiTipWidget() {
  const todayTip = get(aiTips, dayOfYear % aiTips.length, {});

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-primary/5 via-card to-accent/5 border border-primary/20 rounded-2xl px-5 py-4 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <SparklesIcon className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
          AI Murabbiy maslahati
        </p>
        <p className="text-sm font-medium leading-snug">
          {get(todayTip, "emoji")} {get(todayTip, "text")}
        </p>
      </div>
    </div>
  );
}
