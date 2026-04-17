import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { filter, some } from "lodash";
import {
  UsersIcon,
  SearchIcon,
  StarIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import useCoaches from "@/hooks/app/use-coaches";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerBody,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";

export const FindCoachTab = () => {
  const { t } = useTranslation();
  const { coaches, status, requestCoach, isRequesting } = useCoaches();
  const [search, setSearch] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [requestNotes, setRequestNotes] = useState("");

  const filteredCoaches = filter(
    coaches,
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      some(c.specializations, (s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const handleSendRequest = async () => {
    if (!selectedCoach) return;
    try {
      await requestCoach(selectedCoach.id, requestNotes);
      toast.success(t("profile.findCoach.requestSuccess"));
      setSelectedCoach(null);
      setRequestNotes("");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t("profile.findCoach.requestError"),
      );
    }
  };

  if (status.connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <Avatar className="size-16 border-2 border-primary/20">
            <AvatarImage src={status.coach.avatar} />
            <AvatarFallback>{status.coach.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-black">{status.coach.name}</h2>
            <p className="text-sm text-muted-foreground">
              {t("profile.findCoach.yourCoach")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {t("profile.findCoach.active")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t("profile.findCoach.connectedDate", { date: new Date(status.startDate).toLocaleDateString() })}
              </span>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border-dashed">
          <CardContent className="p-10 flex flex-col items-center text-center space-y-4">
            <UsersIcon className="size-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <h3 className="font-bold">{t("profile.findCoach.needOtherTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                {t("profile.findCoach.needOtherDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight">
          {t("profile.tabs.findCoach")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("profile.findCoach.subtitle")}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("profile.findCoach.searchPlaceholder")}
          className="pl-10 h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredCoaches.map((coach) => (
          <Card
            key={coach.id}
            className="group overflow-hidden hover:border-primary/30 transition-all rounded-3xl"
          >
            <CardContent className="p-0">
              <div className="p-5 sm:p-6 flex items-start gap-4">
                <Avatar className="size-14 sm:size-16 border shadow-sm group-hover:scale-105 transition-transform">
                  <AvatarImage src={coach.avatar} />
                  <AvatarFallback>{coach.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-black text-lg truncate flex items-center gap-1.5">
                        {coach.name}
                        <CheckCircle2Icon className="size-4 text-blue-500 shrink-0" />
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <StarIcon className="size-3 fill-current" />
                        <span className="text-xs font-bold">
                          4.9 (120+ {t("profile.findCoach.clients")})
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-primary">
                        {new Intl.NumberFormat("uz-UZ").format(
                          coach.monthlyPrice || 200000,
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {t("profile.coach.currency")}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {coach.bio ||
                      t("profile.findCoach.bioFallback", { exp: coach.experience || "5+" })}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      coach.specializations || ["Fitness", "Kikboksing", "Yoga"]
                    )
                      .slice(0, 3)
                      .map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="text-[10px] h-5 bg-muted/50 border-none font-bold"
                        >
                          {s}
                        </Badge>
                      ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      className="flex-1 rounded-xl font-bold h-10"
                      onClick={() => setSelectedCoach(coach)}
                    >
                      {t("profile.findCoach.connect")}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-10 rounded-xl"
                    >
                      <MessageSquareIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCoaches.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <UsersIcon className="size-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground font-medium">
              {t("profile.findCoach.noResults")}
            </p>
          </div>
        )}
      </div>

      <Drawer
        open={Boolean(selectedCoach)}
        onOpenChange={(o) => !o && setSelectedCoach(null)}
      >
        <DrawerContent className="rounded-t-[32px]">
          <DrawerHeader className="text-left px-6 pt-8">
            <DrawerTitle className="text-2xl font-black">
              {t("profile.findCoach.requestTitle")}
            </DrawerTitle>
            <DrawerDescription className="text-base">
              {t("profile.findCoach.requestSubtitle", { name: selectedCoach?.name })}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="px-6 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border">
              <Avatar className="size-12 border">
                <AvatarImage src={selectedCoach?.avatar} />
                <AvatarFallback>{selectedCoach?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{selectedCoach?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.findCoach.professionalCoach")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                {t("profile.findCoach.messageLabel")}
              </label>
              <Textarea
                placeholder={t("profile.findCoach.messagePlaceholder")}
                className="min-h-[120px] rounded-2xl bg-muted/20 border-border/50 focus:border-primary/50 resize-none"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
              />
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-xs leading-relaxed text-muted-foreground italic">
                {t("profile.findCoach.requestHint")}
              </p>
            </div>
          </DrawerBody>
          <DrawerFooter className="px-6 pb-10 pt-4 flex flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-12 font-bold"
              onClick={() => setSelectedCoach(null)}
            >
              {t("profile.general.cancel")}
            </Button>
            <Button
              className="flex-[2] rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              onClick={handleSendRequest}
              disabled={isRequesting}
            >
              {isRequesting ? t("profile.general.sending") : t("profile.findCoach.sendRequest")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
