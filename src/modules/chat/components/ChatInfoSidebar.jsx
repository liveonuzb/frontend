import React, { useState } from "react";
import { filter, find, some, toPairs } from "lodash";
import { Button } from "@/components/ui/button";
import {
    XIcon,
    ImageIcon,
    FileTextIcon,
    LinkIcon,
    UserIcon,
    BellIcon,
    BellOffIcon,
    BanIcon,
    Trash2Icon,
    BarChart3Icon,
    DropletsIcon,
    FlameIcon,
    FootprintsIcon,
    MoonIcon,
    UtensilsIcon,
    CoffeeIcon,
    SunIcon,
    CloudMoonIcon,
    PizzaIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon as LucideCalendar,
    ArrowLeftIcon,
    SparklesIcon,
    StickyNoteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyTrackingDay, getTodayKey } from "@/hooks/app/use-daily-tracking";
import { useChatStore } from "@/store";
import { useCoachClients, COACH_CLIENTS_QUERY_KEY } from "@/hooks/app/use-coach";
import { usePatchQuery } from "@/hooks/api";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

const ChatInfoSidebar = ({
    activeEntity,
    onClose,
    chatMessages = [],
    lastSeenText,
}) => {
    const {
        getChatSummary,
        activeChat,
        toggleMuteChat,
        toggleBlockChat,
        isChatMuted,
        isChatBlocked,
    } = useChatStore();
    const { clients } = useCoachClients();
    const updateClientMutation = usePatchQuery({
        queryKey: COACH_CLIENTS_QUERY_KEY,
    });
    const { openProfile } = useProfileOverlay();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const isMuted = isChatMuted(activeChat);
    const isBlocked = isChatBlocked(activeChat);

    // Notepad state
    const client = find(clients, c => c.id === activeChat || `g${c.id}` === activeChat);
    const [localNotes, setLocalNotes] = useState(client?.notes || "");

    const handleSaveNotes = async () => {
        if (client) {
            try {
                await updateClientMutation.mutateAsync({
                    url: `/coach/clients/${client.id}/notes`,
                    attributes: { notes: localNotes },
                });
                toast.success("Eslatma saqlandi");
            } catch {
                toast.error("Xatolik yuz berdi");
            }
        }
    };

    const handleGetSummary = () => {
        setLoadingSummary(true);
        setTimeout(() => {
            setSummary(getChatSummary(activeChat));
            setLoadingSummary(false);
        }, 1500);
    };

    const dateKey = selectedDate.toISOString().split("T")[0];
    const isToday = dateKey === getTodayKey();
    const displayDate = isToday ? "Bugun" : selectedDate.toLocaleDateString("uz-UZ", { day: 'numeric', month: 'long' });

    const { dayData } = useDailyTrackingDay(dateKey);

    const changeDate = (days) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + days);
        setSelectedDate(next);
        setSelectedMeal(null);
    };

    const media = filter(chatMessages, m => m.type === "image" || m.mediaUrl);
    const files = filter(chatMessages, m => m.type === "file");
    const links = filter(chatMessages, m => {
        const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
        return m.text && URL_REGEX.test(m.text);
    });

    const mealIcons = {
        breakfast: { icon: CoffeeIcon, label: "Nonushta", color: "text-orange-500", bg: "bg-orange-500/10" },
        lunch: { icon: SunIcon, label: "Tushlik", color: "text-yellow-500", bg: "bg-yellow-500/10" },
        dinner: { icon: CloudMoonIcon, label: "Kechki ovqat", color: "text-blue-500", bg: "bg-blue-500/10" },
        snack: { icon: PizzaIcon, label: "Gazaklar", color: "text-purple-500", bg: "bg-purple-500/10" },
    };

    const hasAnyMeals = some(dayData.meals, m => m.length > 0);

    return (
        <div className="w-full md:w-80 h-full border-l flex flex-col bg-background shrink-0 animate-in slide-in-from-right duration-300 z-[60] relative overflow-hidden">
            {/* Meal Details View (Slide-over) */}
            {selectedMeal && (
                <div className="absolute inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedMeal(null)}>
                            <ArrowLeftIcon className="size-4" />
                        </Button>
                        <h3 className="font-bold text-sm">Ovqat tafsilotlari</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="aspect-square rounded-3xl bg-muted overflow-hidden border shadow-inner flex items-center justify-center relative">
                            {selectedMeal.image ? (
                                <img src={selectedMeal.image} alt={selectedMeal.name} className="w-full h-full object-cover" />
                            ) : (
                                <UtensilsIcon className="size-20 opacity-10" />
                            )}
                            <Badge className="absolute bottom-4 right-4 bg-primary/90 backdrop-blur-md px-3 py-1 text-sm font-black">
                                {selectedMeal.calories} kcal
                            </Badge>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-2xl font-black tracking-tight">{selectedMeal.name}</h4>
                            <p className="text-muted-foreground text-sm">{selectedMeal.qty} {selectedMeal.unit || 'porsiya'}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <MacroCard label="Oqsil" value={selectedMeal.protein} unit="g" color="bg-blue-500" />
                            <MacroCard label="Uglevod" value={selectedMeal.carbs} unit="g" color="bg-orange-500" />
                            <MacroCard label="Yog'" value={selectedMeal.fat} unit="g" color="bg-yellow-500" />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h5 className="font-bold text-xs uppercase tracking-widest opacity-50">Qo'shimcha ma'lumotlar</h5>
                            <div className="space-y-3">
                                <DetailItem label="Kletchatka" value={`${selectedMeal.fiber || 0} g`} />
                                <DetailItem label="Shakar" value={`${selectedMeal.sugar || 0} g`} />
                                <DetailItem label="Tuz" value={`${selectedMeal.salt || 0} mg`} />
                                <DetailItem label="Vaqti" value={new Date(selectedMeal.addedAt).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-background z-10">
                <h3 className="font-bold text-sm">Ma'lumot</h3>
                <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
                    <XIcon className="size-4" />
                </Button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Profile Info */}
                <div className="p-6 flex flex-col items-center text-center border-b space-y-3">
                    <div className="text-6xl drop-shadow-xl">{activeEntity.avatar}</div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">{activeEntity.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{activeEntity.role}</p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                            {activeEntity.online ? "Online" : lastSeenText || "Oxirgi faollik noma'lum"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-full hover:bg-primary/10 transition-colors"
                            onClick={() => toggleMuteChat(activeChat)}
                        >
                            {isMuted ? <BellOffIcon className="size-4" /> : <BellIcon className="size-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-full hover:bg-primary/10 transition-colors"
                            onClick={() => openProfile("profile")}
                        >
                            <UserIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => toggleBlockChat(activeChat)}
                        >
                            <BanIcon className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-4 border-b">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bildirishnoma</p>
                            <p className="mt-1 text-sm font-medium">{isMuted ? "Jim" : "Yoqilgan"}</p>
                        </div>
                        <div className="rounded-xl border px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ruxsat</p>
                            <p className="mt-1 text-sm font-medium">{isBlocked ? "Bloklangan" : "Faol"}</p>
                        </div>
                    </div>
                </div>

                {/* AI Summary Section */}
                <div className="p-4 border-b bg-primary/5 space-y-3">
                    {/* ... (existing AI Summary code) ... */}
                </div>

                {/* Coach's Private Notepad */}
                <div className="p-4 border-b space-y-3 bg-amber-500/[0.02]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <StickyNoteIcon className="size-4 text-amber-500" />
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-600">Shaxsiy Eslatma</h5>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] px-2 font-black border border-amber-500/20 text-amber-600 hover:bg-amber-50"
                            onClick={handleSaveNotes}
                        >
                            SAQLASH
                        </Button>
                    </div>
                    <textarea
                        className="w-full min-h-[80px] p-2.5 rounded-xl border border-amber-500/10 bg-background text-[11px] leading-relaxed resize-none focus:ring-2 focus:ring-amber-500/20 outline-none placeholder:italic"
                        placeholder="Mijoz haqida faqat o'zingiz ko'radigan eslatmalar yozing (jarohatlar, qiziqishlar)..."
                        value={localNotes}
                        onChange={e => setLocalNotes(e.target.value)}
                    />
                </div>

                {/* Date Navigator */}
                <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => changeDate(-1)}>
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <LucideCalendar className="size-3.5 text-primary" />
                        <span className="text-xs font-bold">{displayDate}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => changeDate(1)}>
                        <ChevronRightIcon className="size-4" />
                    </Button>
                </div>

                <div className="p-2">
                    <Tabs defaultValue="stats" className="w-full">
                        <TabsList className="w-full grid grid-cols-5 h-9">
                            <TabsTrigger value="stats" className="text-[10px]"><BarChart3Icon className="size-3" /></TabsTrigger>
                            <TabsTrigger value="meals" className="text-[10px]"><UtensilsIcon className="size-3" /></TabsTrigger>
                            <TabsTrigger value="media" className="text-[10px]">Media</TabsTrigger>
                            <TabsTrigger value="files" className="text-[10px]">Fayl</TabsTrigger>
                            <TabsTrigger value="links" className="text-[10px]">Link</TabsTrigger>
                        </TabsList>

                        <TabsContent value="stats" className="mt-4 space-y-4 px-2 pb-4">
                            <StatWidget
                                icon={DropletsIcon}
                                label="Suv ichish"
                                value={`${dayData.waterCups * 250} / 2500 ml`}
                                color="text-blue-500"
                                percentage={(dayData.waterCups * 250 / 2500) * 100}
                            />
                            <StatWidget
                                icon={FlameIcon}
                                label="Kaloriya"
                                value={`${dayData.burnedCalories} / 2200 kcal`}
                                color="text-orange-500"
                                percentage={(dayData.burnedCalories / 2200) * 100}
                            />
                            <StatWidget
                                icon={FootprintsIcon}
                                label="Qadamlar"
                                value={`${dayData.steps} / 10000`}
                                color="text-emerald-500"
                                percentage={(dayData.steps / 10000) * 100}
                            />
                            <StatWidget
                                icon={MoonIcon}
                                label="Uyqu"
                                value={`${dayData.sleepHours} / 8 soat`}
                                color="text-purple-500"
                                percentage={(dayData.sleepHours / 8) * 100}
                            />
                        </TabsContent>

                        <TabsContent value="meals" className="mt-4 space-y-6 px-2 pb-4">
                            {hasAnyMeals ? (
                                toPairs(dayData.meals).map(([type, items]) => {
                                    if (items.length === 0) return null;
                                    const { icon: Icon, label, color, bg } = mealIcons[type];
                                    return (
                                        <div key={type} className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className={cn("size-6 rounded-md flex items-center justify-center", bg)}>
                                                    <Icon className={cn("size-3.5", color)} />
                                                </div>
                                                <h5 className="text-[11px] font-black uppercase tracking-wider opacity-70">{label}</h5>
                                            </div>
                                            <div className="space-y-2">
                                                {items.map((meal, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedMeal(meal)}
                                                        className="bg-muted/30 p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-background cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{meal.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-[10px] text-muted-foreground">{meal.qty} {meal.unit || 'porsiya'}</p>
                                                                <span className="size-1 rounded-full bg-muted-foreground/30" />
                                                                <p className="text-[10px] font-medium text-orange-500">{meal.calories} kcal</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[9px] h-5 bg-background font-medium border-primary/10">{meal.protein || 0}g P</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : <EmptyMedia icon={UtensilsIcon} label="Bu kunda ovqat kiritilmagan" />}
                        </TabsContent>

                        <TabsContent value="media" className="mt-2">
                            {media.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1 p-1">
                                    {media.map((m, i) => (
                                        <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity border">
                                            <img src={m.mediaUrl} alt="media" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyMedia icon={ImageIcon} label="Media yo'q" />}
                        </TabsContent>

                        <TabsContent value="files" className="mt-2">
                            {files.length > 0 ? (
                                <div className="space-y-1">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer truncate border-b border-transparent last:border-0">
                                            <div className="size-8 rounded bg-primary/10 flex items-center justify-center shrink-0"><FileTextIcon className="size-4 text-primary" /></div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate">{f.text || "Hujjat"}</p>
                                                <p className="text-[9px] text-muted-foreground">{f.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyMedia icon={FileTextIcon} label="Fayllar yo'q" />}
                        </TabsContent>

                        <TabsContent value="links" className="mt-2">
                            {links.length > 0 ? (
                                <div className="space-y-1">
                                    {links.map((l, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer truncate">
                                            <div className="size-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0"><LinkIcon className="size-4 text-blue-500" /></div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-blue-500 truncate underline font-medium">{l.text}</p>
                                                <p className="text-[9px] text-muted-foreground">{l.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyMedia icon={LinkIcon} label="Linklar yo'q" />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-4 border-t bg-background shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all h-10 font-bold"
                    onClick={() => {
                        if (window.confirm("Chatdagi barcha xabarlarni o'chirib tashlamoqchimisiz?")) {
                            toast.success("Chat tozalandi");
                        }
                    }}
                >
                    <Trash2Icon className="size-4 mr-2" /> Chatni tozalash
                </Button>
            </div>
        </div>
    );
};

const MacroCard = ({ label, value, unit, color }) => (
    <div className="bg-muted/30 p-3 rounded-2xl border flex flex-col items-center text-center space-y-1">
        <span className="text-[9px] font-black uppercase opacity-50 tracking-tighter">{label}</span>
        <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black">{value || 0}</span>
            <span className="text-[10px] opacity-50">{unit}</span>
        </div>
        <div className={cn("h-1 w-8 rounded-full", color)} />
    </div>
);

const DetailItem = ({ label, value }) => (
    <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-transparent">
        <span className="text-xs font-medium opacity-60">{label}</span>
        <span className="text-xs font-bold">{value}</span>
    </div>
);

const StatWidget = ({ icon: Icon, label, value, color, percentage }) => (
    <div className="bg-muted/30 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-all group">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className={cn("size-7 rounded-lg flex items-center justify-center bg-background group-hover:scale-110 transition-transform shadow-sm", color.replace('text', 'bg').replace('500', '500/10'))}>
                    <Icon className={cn("size-4", color)} />
                </div>
                <span className="text-[11px] font-bold opacity-70">{label}</span>
            </div>
            <span className="text-[10px] font-black">{value}</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
    </div>
);

const EmptyMedia = ({ icon: Icon, label }) => (
    <div className="p-12 text-center text-muted-foreground">
        <Icon className="size-10 mx-auto mb-3 opacity-10" />
        <p className="text-xs font-medium opacity-50">{label}</p>
    </div>
);

export default ChatInfoSidebar;
