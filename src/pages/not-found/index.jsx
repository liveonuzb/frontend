import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Animated 404 number */}
        <div className="relative mb-8">
          <h1 className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-24 rounded-full bg-primary/10 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Sahifa topilmadi
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Siz qidirgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan.
          Bosh sahifaga qaytib, davom etishingiz mumkin.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Ortga
          </Button>
          <Button onClick={() => navigate("/user")} className="gap-2">
            <HomeIcon className="size-4" />
            Bosh sahifa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
