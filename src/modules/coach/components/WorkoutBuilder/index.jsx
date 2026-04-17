import React, { useState } from "react";
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
    DumbbellIcon,
    PlusIcon,
    TrashIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    SparklesIcon
} from "lucide-react";
import { toast } from "sonner";
import { get, trim } from "lodash";
import { useGeneratePlanDraft } from "@/hooks/app/use-coach-ai";

const WorkoutBuilder = ({ plan, onSave, onClose }) => {
    const [exercises, setExercises] = useState(get(plan, "exercises") || []);
    const generateDraft = useGeneratePlanDraft();
    const isGenerating = generateDraft.isPending;

    const handleAdd = () => {
        setExercises([...exercises, { name: "", sets: "3x10", muscle: "", rest: "60s" }]);
    };

    const handleRemove = (index) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        const newExercises = [...exercises];
        newExercises[index] = { ...newExercises[index], [field]: value };
        setExercises(newExercises);
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newExercises = [...exercises];
        const temp = newExercises[index - 1];
        newExercises[index - 1] = newExercises[index];
        newExercises[index] = temp;
        setExercises(newExercises);
    };

    const moveDown = (index) => {
        if (index === exercises.length - 1) return;
        const newExercises = [...exercises];
        const temp = newExercises[index + 1];
        newExercises[index + 1] = newExercises[index];
        newExercises[index] = temp;
        setExercises(newExercises);
    };

    const handleSave = () => {
        const cleanExercises = exercises.filter((e) => trim(e.name) !== "");
        onSave(cleanExercises);
    };

    const handleAIGenerate = async () => {
        try {
            const result = await generateDraft.mutateAsync({
                url: "/coach/ai/plan-draft",
                attributes: {
                    type: "workout",
                    goal: get(plan, "goal") || "general fitness",
                    clientContext: get(plan, "description") || get(plan, "title") || "weekly workout plan",
                },
            });

            const items = get(result, "data.items", []);
            if (items.length > 0) {
                const generated = items.map((item) => ({
                    name: item.name || "",
                    sets: item.details || "3x10",
                    muscle: "",
                    rest: "60s",
                }));
                setExercises([...exercises, ...generated]);
                toast.success("AI tomonidan mashqlar generatsiya qilindi ✨");
            } else {
                toast.error("AI hech qanday mashq yarata olmadi");
            }
        } catch {
            toast.error("AI xizmati hozir mavjud emas");
        }
    };

    return (
        <Drawer open={true} onOpenChange={(open) => !open && onClose()} direction="bottom">
            <DrawerContent className="h-[90vh]">
                <DrawerHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle className="text-xl flex items-center gap-2">
                                <DumbbellIcon className="size-5 text-primary" />
                                Vizual Konstruktor: {get(plan, "title")}
                            </DrawerTitle>
                            <DrawerDescription>
                                Mashqlarni qo&apos;shing, tahrirlang va tartiblang.
                            </DrawerDescription>
                        </div>
                        <Button
                            variant="secondary"
                            className="gap-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-fuchsia-500/20"
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                        >
                            <SparklesIcon className="size-4" />
                            {isGenerating ? "Generatsiya..." : "AI Yordamchi"}
                        </Button>
                    </div>
                </DrawerHeader>

                <ScrollArea className="flex-1 p-6 bg-muted/20">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {exercises.length === 0 ? (
                            <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl border-muted bg-background">
                                <DumbbellIcon className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <h3 className="font-semibold text-lg">Bu rejada mashqlar yo&apos;q</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Qo&apos;lda mashq qo&apos;shing yoki AI yordamchisidan foydalaning.
                                </p>
                                <Button onClick={handleAdd}>
                                    <PlusIcon className="size-4 mr-2" />
                                    Birinchi mashqni qo&apos;shish
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exercises.map((ex, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-background shadow-sm hover:border-primary/50 transition-colors group">
                                        <div className="flex flex-col justify-center gap-1 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => moveUp(index)} disabled={index === 0}>
                                                <ArrowUpIcon className="size-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => moveDown(index)} disabled={index === exercises.length - 1}>
                                                <ArrowDownIcon className="size-3" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <div className="sm:col-span-2 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Mashq nomi</Label>
                                                <Input
                                                    value={ex.name}
                                                    onChange={(e) => handleUpdate(index, "name", e.target.value)}
                                                    placeholder="masalan, Shtanga cho'qqayish"
                                                    className="font-medium"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Mushak guruhi</Label>
                                                <Input
                                                    value={ex.muscle}
                                                    onChange={(e) => handleUpdate(index, "muscle", e.target.value)}
                                                    placeholder="Oyoq"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Set/Takror</Label>
                                                    <Input
                                                        value={ex.sets}
                                                        onChange={(e) => handleUpdate(index, "sets", e.target.value)}
                                                        placeholder="3x10"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Dam</Label>
                                                    <Input
                                                        value={ex.rest}
                                                        onChange={(e) => handleUpdate(index, "rest", e.target.value)}
                                                        placeholder="60s"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end sm:justify-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemove(index)}>
                                                <TrashIcon className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button variant="outline" className="w-full border-dashed py-8 mt-2" onClick={handleAdd}>
                                    <PlusIcon className="size-4 mr-2 text-muted-foreground" />
                                    Yana mashq qo&apos;shish
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DrawerFooter className="border-t bg-background">
                    <div className="max-w-4xl mx-auto w-full flex gap-3">
                        <DrawerClose asChild>
                            <Button variant="outline" className="flex-1">Bekor qilish</Button>
                        </DrawerClose>
                        <Button className="flex-1" onClick={handleSave}>
                            Saqlash ({exercises.length} ta)
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default WorkoutBuilder;
