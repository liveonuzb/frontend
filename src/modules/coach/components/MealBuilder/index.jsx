import React, { useState, useMemo } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UtensilsIcon,
    PlusIcon,
    TrashIcon,
    SparklesIcon,
    FlameIcon,
    InfoIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { get, trim, split } from "lodash";
import { useGeneratePlanDraft } from "@/hooks/app/use-coach-ai";

const MEAL_TYPES = ["Nonushta", "Tushlik", "Kechlik", "Gazak", "Kechki gazak"];

const MealBuilder = ({ plan, onSave, onClose }) => {
    const [title, setTitle] = useState(get(plan, "title") || "");
    const [description, setDescription] = useState(get(plan, "description") || "");
    const [duration, setDuration] = useState(get(plan, "duration") || "");
    const [tags, setTags] = useState(get(plan, "tags") ? plan.tags.join(", ") : "");
    const [meals, setMeals] = useState(
        get(plan, "meals.length") > 0
            ? [...plan.meals]
            : [{ type: "Nonushta", name: "", calories: 0, protein: 0, carbs: 0, fat: 0 }]
    );

    const generateDraft = useGeneratePlanDraft();
    const isGenerating = generateDraft.isPending;

    // Derived Macros Calculation
    const macros = useMemo(() => {
        return meals.reduce(
            (acc, meal) => {
                const cal = Number(meal.calories) || 0;
                const p = Number(meal.protein) || 0;
                const c = Number(meal.carbs) || 0;
                const f = Number(meal.fat) || 0;

                // Simple auto-calculation of calories if they enter macros but leave cal empty
                // Proteins = 4 kcal, Carbs = 4 kcal, Fats = 9 kcal
                const calculatedCal = p * 4 + c * 4 + f * 9;

                return {
                    calories: acc.calories + (cal > 0 ? cal : calculatedCal),
                    protein: acc.protein + p,
                    carbs: acc.carbs + c,
                    fat: acc.fat + f,
                };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
    }, [meals]);

    const handleAddMeal = () => {
        setMeals([...meals, { type: "Tushlik", name: "", calories: "", protein: "", carbs: "", fat: "" }]);
    };

    const handleRemoveMeal = (index) => {
        setMeals(meals.filter((_, i) => i !== index));
    };

    const handleMealUpdate = (index, field, value) => {
        const updatedMeals = [...meals];
        updatedMeals[index] = { ...updatedMeals[index], [field]: value };
        setMeals(updatedMeals);
    };

    const handleSave = () => {
        if (!trim(title)) {
            toast.error("Reja nomini kiriting");
            return;
        }

        const validMeals = meals.filter(m => trim(m.name) !== "");

        const planData = {
            title: trim(title),
            description: trim(description),
            calories: Math.round(macros.calories),
            duration: trim(duration),
            tags: split(tags, ",").map(t => trim(t)).filter(Boolean),
            meals: validMeals,
            mealsPerDay: validMeals.length,
            // Carry over supplements if they existed, though hidden from this immediate view for simplicity
            supplements: get(plan, "supplements") || [],
            clients: get(plan, "clients") || []
        };

        onSave(planData);
    };

    const handleAIGenerate = async () => {
        try {
            const result = await generateDraft.mutateAsync({
                url: "/coach/ai/plan-draft",
                attributes: {
                    type: "meal",
                    goal: get(plan, "goal") || "balanced nutrition",
                    clientContext: title || get(plan, "description") || "weekly meal plan",
                },
            });

            const items = get(result, "data.items", []);
            const generatedTitle = get(result, "data.title", "");
            const generatedDescription = get(result, "data.description", "");

            if (items.length > 0) {
                const mealTypesCycle = ["Nonushta", "Tushlik", "Kechlik", "Gazak", "Kechki gazak"];
                const generated = items.map((item, idx) => ({
                    type: mealTypesCycle[idx % mealTypesCycle.length],
                    name: item.name || "",
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                }));
                setMeals(generated);
                if (!title && generatedTitle) setTitle(generatedTitle);
                if (!description && generatedDescription) setDescription(generatedDescription);
                if (!duration) setDuration("4 hafta");
                toast.success("AI dietolog menyuni muvaffaqiyatli shakllantirdi ✨");
            } else {
                toast.error("AI hech qanday ovqat yarata olmadi");
            }
        } catch {
            toast.error("AI xizmati hozir mavjud emas");
        }
    };

    return (
        <Drawer open={true} onOpenChange={(open) => !open && onClose()} direction="bottom">
            <DrawerContent className="h-[95vh] sm:h-[90vh]">
                <DrawerHeader className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle className="text-xl flex items-center gap-2">
                                <UtensilsIcon className="size-5 text-orange-500" />
                                {plan ? "Rejani Tahrirlash" : "Yangi Ovqatlanish Rejasi"}
                            </DrawerTitle>
                            <DrawerDescription>
                                Ozuqaviy qiymatlarni aniq kuzating
                            </DrawerDescription>
                        </div>
                        <Button
                            variant="secondary"
                            className="bg-gradient-to-r from-orange-500/10 to-rose-500/10 text-orange-600 hover:from-orange-500/20 hover:to-rose-500/20 shadow-sm transition-all"
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                        >
                            <SparklesIcon className={cn("size-4 mr-2", isGenerating ? "animate-spin" : "animate-pulse")} />
                            {isGenerating ? "Tuzilmoqda..." : "AI Menyusi"}
                        </Button>
                    </div>
                </DrawerHeader>

                <ScrollArea className="flex-1 bg-muted/10">
                    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

                        {/* Meta Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background p-5 rounded-2xl border shadow-sm">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Reja Nomi</Label>
                                    <Input
                                        placeholder="Masalan: 30 kunlik vazn tashlash"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-11 font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tavsif</Label>
                                    <Input
                                        placeholder="Asosiy qoidalar..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Davomiyligi</Label>
                                        <Input
                                            placeholder="Masalan: 4 hafta"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Teglar</Label>
                                        <Input
                                            placeholder="Keto, Arzon"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Macro Dashboard */}
                                <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-4 border flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Jami Kaloriya</p>
                                        <p className="text-2xl font-black text-orange-500 flex items-center gap-1">
                                            <FlameIcon className="size-5" />
                                            {Math.round(macros.calories)} <span className="text-xs font-medium text-muted-foreground">kcal</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-4 text-right">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Oqsil</p>
                                            <p className="font-bold">{Math.round(macros.protein)}g</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Uglevod</p>
                                            <p className="font-bold">{Math.round(macros.carbs)}g</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Yog&apos;</p>
                                            <p className="font-bold">{Math.round(macros.fat)}g</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Meals List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    Menyu tarkibi
                                </h3>
                                <Button size="sm" variant="outline" onClick={handleAddMeal}>
                                    <PlusIcon className="size-4 mr-1" /> Ovqat qo&apos;shish
                                </Button>
                            </div>

                            {meals.length === 0 ? (
                                <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl bg-background text-muted-foreground">
                                    Hali ovqatlanishlar ro&apos;yxati shakllanmagan. Mavjudini tahrirlang yoki AI yordamida tezgina yarating.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {meals.map((meal, index) => (
                                        <div key={index} className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl border bg-background shadow-sm hover:border-orange-500/30 transition-colors group relative">

                                            <div className="w-full lg:w-48 shrink-0">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Turi</Label>
                                                <Select
                                                    value={meal.type}
                                                    onValueChange={(v) => handleMealUpdate(index, "type", v)}
                                                >
                                                    <SelectTrigger className="h-10 bg-muted/50 border-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MEAL_TYPES.map((t) => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Taom nomi</Label>
                                                <Input
                                                    placeholder="Masalan: 2 ta qaynatilgan tuxum + bodring"
                                                    value={meal.name}
                                                    onChange={(e) => handleMealUpdate(index, "name", e.target.value)}
                                                    className="h-10 font-medium"
                                                />
                                            </div>

                                            <div className="flex gap-2 lg:w-auto w-full">
                                                <div className="w-20">
                                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Oqsil (g)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={meal.protein}
                                                        onChange={(e) => handleMealUpdate(index, "protein", e.target.value)}
                                                        className="h-10 px-2 text-center"
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Ugl (g)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={meal.carbs}
                                                        onChange={(e) => handleMealUpdate(index, "carbs", e.target.value)}
                                                        className="h-10 px-2 text-center"
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Yog&apos; (g)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={meal.fat}
                                                        onChange={(e) => handleMealUpdate(index, "fat", e.target.value)}
                                                        className="h-10 px-2 text-center"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Label className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-0.5">
                                                        <FlameIcon className="size-3" /> kcal
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Avto"
                                                        value={meal.calories}
                                                        onChange={(e) => handleMealUpdate(index, "calories", e.target.value)}
                                                        className="h-10 px-2 text-center border-orange-200 bg-orange-50/50 text-orange-600 font-bold"
                                                    />
                                                </div>

                                                <div className="w-10 flex items-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveMeal(index)}
                                                    >
                                                        <TrashIcon className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-500/10 text-blue-600 p-3 rounded-lg text-xs flex items-start gap-2 max-w-xl">
                            <InfoIcon className="size-4 shrink-0 mt-0.5" />
                            <p>Agar siz kaloriyani kiritmasangiz, dastur avtomatik ravishda makrolar (Oqsilx4 + Uglx4 + Yog&apos;x9) orqali hisoblaydi.</p>
                        </div>
                    </div>
                </ScrollArea>

                <DrawerFooter className="border-t bg-background px-6 py-4">
                    <div className="max-w-5xl mx-auto w-full flex gap-3">
                        <DrawerClose asChild>
                            <Button variant="outline" className="flex-1 py-6 rounded-xl font-bold">Bekor qilish</Button>
                        </DrawerClose>
                        <Button className="flex-1 py-6 rounded-xl font-bold text-md shadow-md bg-orange-500 hover:bg-orange-600 border-none text-white" onClick={handleSave}>
                            Rejani Saqlash ({meals.length} ta ovqat)
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default MealBuilder;
