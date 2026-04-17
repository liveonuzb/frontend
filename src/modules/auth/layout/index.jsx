import { map } from "lodash";
import React from "react";
import { Outlet, Link } from "react-router";
import LanguageSwitcher from "@/components/language-switcher";

const Index = () => {
  return (
    <div className={"min-h-screen flex flex-col"}>
      <header
        className={
          "absolute flex justify-between items-center inset-x-0 z-10 p-5"
        }
      >
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div>
            <img src={"/logo.png"} className={"h-10"} alt={"logo"} />
          </div>
        </Link>
        <LanguageSwitcher compact />
      </header>
      <div className={"grid md:grid-cols-2 flex-1"}>
        <div className={"flex h-full justify-center py-10"}>
          <Outlet />
        </div>
        {/* Branding Panel */}
        <div className="relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-orange-600  py-10">
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-8 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center text-white">
            <div className="flex flex-col items-center gap-6 mt-16">
              <div className="text-center">
                <h2 className="text-4xl font-bold tracking-tight">
                  Sog'lom hayot sari
                </h2>
                <p className="mt-2 text-lg font-medium text-white/80 max-w-sm">
                  O'z maqsadlaringizga erishish uchun eng yaxshi platforma
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-left">
              {map([
                { icon: "🔥", text: "Kaloriya va ovqatlanishni kuzating" },
                { icon: "💧", text: "Suv iste'molini nazorat qiling" },
                { icon: "🏋️", text: "Sport mashg'ulotlarini rejalashtiring" },
                { icon: "🤖", text: "AI murabbiy maslahatlaridan foydalaning" },
              ], ({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 text-white/90"
                >
                  <span className="text-xl bg-white/10 p-2 rounded-xl border border-white/10">
                    {icon}
                  </span>
                  <span className="text-base font-medium">{text}</span>
                </div>
              ))}
            </div>
            <p className="mt-12 text-xs text-white/50 border-t border-white/10 pt-6 w-full max-w-[200px]">
              © 2026 LiveOn. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
