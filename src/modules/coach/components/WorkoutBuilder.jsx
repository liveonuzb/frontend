import React, { useState, useMemo } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
    SearchIcon, 
    DumbbellIcon, 
    PlusIcon, 
    Trash2Icon, 
    GripVerticalIcon,
    Settings2Icon,
    ChevronRightIcon,
    FlameIcon,
    XIcon,
    Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetQuery } from "@/hooks/api";
import { toast } from "sonner";

const DAYS = [
    { id: "mon", label: "Dushanba" },
    { id: "tue", label: "Seshanba" },
    { id: "wed", label: "Chorshanba" },
    { id: "thu", label: "Payshanba" },
    { id: "fri", label: "Juma" },
    { id: "sat", label: "Shanba" },
    { id: "sun", label: "Yakshanba" },
];

const WorkoutBuilder = ({ plan, onSave, onClose }) => {
    const [search, setSearch] = useState("");
    const [activeId, setActiveId] = useState(null);

    // Fetch official exercises from admin library
    const { data: exercisesData, isLoading: isLibraryLoading } = useGetQuery({
        url: "/admin/exercises/public",
        queryProps: {
            queryKey: ["exercises", "public"],
        },
    });

    const libraryExercises = get(exercisesData, "data") || [];
    
    // local state for the workout plan structure
    const [daysData, setDaysData] = useState(() => {
        const initial = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
        if (plan && plan.schedule) {
            // Plan structure uses schedule array from backend
            plan.schedule.forEach(day => {
                if (initial[day.day]) {
                    initial[day.day] = (day.exercises || []).map((ex, idx) => ({
                        ...ex,
                        id: `existing-${day.day}-${idx}-${Date.now()}`,
                    }));
                }
            });
        }
        return initial;
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const filteredLibrary = useMemo(() => {
        if (!trim(search)) return libraryExercises;
        const q = toLower(search);
        return libraryExercises.filter(ex => 
            toLower(ex.name).includes(q) || 
            (ex.category && toLower(ex.category).includes(q))
        );
    }, [search, libraryExercises]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dragging from library to a day
        if (typeof activeId === 'string' && activeId.startsWith('lib-')) {
            const realId = activeId.replace('lib-', '');
            const libEx = libraryExercises.find(ex => ex.id.toString() === realId);
            if (!libEx) return;

            // Find which day we dropped into
            const overDay = DAYS.find(d => d.id === overId) || 
                           DAYS.find(d => daysData[d.id].some(item => item.id === overId));
            
            if (overDay) {
                const newEx = {
                    id: `new-${Date.now()}`,
                    exerciseId: libEx.id,
                    name: libEx.name,
                    sets: "3x12",
                    muscle: libEx.category || "General",
                    rest: "60s",
                    imageUrl: libEx.imageUrl
                };
                setDaysData(prev => ({
                    ...prev,
                    [overDay.id]: [...prev[overDay.id], newEx]
                }));
                toast.success(`${libEx.name} qo'shildi`);
            }
            return;
        }

        // Reordering logic... (remains same)
        const activeDayId = Object.keys(daysData).find(day => daysData[day].some(ex => ex.id === activeId));
        const overDayId = DAYS.find(d => d.id === overId)?.id || 
                         Object.keys(daysData).find(day => daysData[day].some(ex => ex.id === overId));

        if (!activeDayId || !overDayId) return;

        if (activeDayId === overDayId) {
            const oldIndex = daysData[activeDayId].findIndex(ex => ex.id === activeId);
            const newIndex = daysData[overDayId].findIndex(ex => ex.id === overId);
            if (oldIndex !== newIndex) {
                setDaysData(prev => ({
                    ...prev,
                    [activeDayId]: arrayMove(prev[activeDayId], oldIndex, newIndex)
                }));
            }
        } else {
            const activeItem = daysData[activeDayId].find(ex => ex.id === activeId);
            setDaysData(prev => ({
                ...prev,
                [activeDayId]: prev[activeDayId].filter(ex => ex.id !== activeId),
                [overDayId]: [...prev[overDayId], activeItem]
            }));
        }
    };

    const removeExercise = (dayId, exId) => {
        setDaysData(prev => ({
            ...prev,
            [dayId]: prev[dayId].filter(ex => ex.id !== exId)
        }));
    };

    const updateExerciseDetails = (dayId, exId, field, value) => {
        setDaysData(prev => ({
            ...prev,
            [dayId]: prev[dayId].map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
        }));
    };

    const handleSaveLocal = () => {
        // Prepare schedule for API
        const schedule = DAYS.map(day => ({
            day: day.id,
            exercises: daysData[day.id].map(({ id, ...rest }) => rest)
        }));
        onSave(schedule);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose}><XIcon className="size-5" /></Button>
                    <div>
                        <h2 className="text-lg font-bold">Visual Workout Builder</h2>
                        <p className="text-xs text-muted-foreground">{plan.name || plan.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleSaveLocal} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Saqlash</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {/* Sidebar: Library */}
                    <div className="w-80 border-r bg-muted/30 flex flex-col shrink-0">
                        <div className="p-4 space-y-4 bg-background/50 border-b">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Admin kutubxonasidan qidirish..." 
                                    className="pl-9 bg-background h-10 rounded-xl"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Rasmiy mashqlar</span>
                                <Badge variant="outline" className="text-[9px] uppercase">{libraryExercises.length} ta</Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                            {isLibraryLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                                    <Loader2Icon className="size-6 animate-spin text-primary" />
                                </div>
                            ) : filteredLibrary.length > 0 ? (
                                filteredLibrary.map(ex => (
                                    <LibraryItem key={`lib-${ex.id}`} ex={ex} />
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-2">
                                    <DumbbellIcon className="size-8 mx-auto opacity-20" />
                                    <p className="text-xs font-bold text-muted-foreground">Mashqlar topilmadi</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Area: Days */}
                    <div className="flex-1 overflow-x-auto bg-muted/10 p-6 flex gap-6 custom-scrollbar">
                        {DAYS.map(day => (
                            <DayColumn 
                                key={day.id} 
                                day={day} 
                                exercises={daysData[day.id]} 
                                onRemove={removeExercise}
                                onUpdate={updateExerciseDetails}
                            />
                        ))}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } },
                        }),
                    }}>
                        {activeId ? (
                            activeId.toString().startsWith('lib-') ? (
                                <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl flex items-center gap-3 w-64 rotate-3 border-2 border-white/20">
                                    <DumbbellIcon className="size-5" />
                                    <span className="font-bold truncate">
                                        {libraryExercises.find(ex => `lib-${ex.id}` === activeId)?.name || "Mashq"}
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-background border-2 border-primary p-3 rounded-xl shadow-2xl w-64 rotate-3">
                                    <div className="flex items-center gap-2">
                                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                                        <span className="font-bold text-sm">Mashq ko'chirilmoqda</span>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

const LibraryItem = ({ ex }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: `lib-${ex.id}`,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className="group bg-background border rounded-xl p-3 hover:border-primary hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex items-center justify-between"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors overflow-hidden">
                    {ex.imageUrl ? <img loading="lazy" src={ex.imageUrl} className="size-full object-cover" /> : <DumbbellIcon className="size-5 text-primary/40" />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{ex.category}</p>
                </div>
            </div>
            <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
        </div>
    );
};
const DayColumn = ({ day, exercises, onRemove, onUpdate }) => {
    const { setNodeRef } = useSortable({ id: day.id });

    return (
        <div className="w-72 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm uppercase tracking-wider">{day.label}</h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{exercises.length}</Badge>
                </div>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Settings2Icon className="size-4" />
                </button>
            </div>

            <div 
                ref={setNodeRef}
                className={cn(
                    "flex-1 bg-background/40 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-3 space-y-3 transition-colors",
                    "hover:bg-background/60 hover:border-primary/20 min-h-[400px]"
                )}
            >
                <SortableContext items={exercises.map(ex => ex.id)} strategy={verticalListSortingStrategy}>
                    {exercises.map((ex) => (
                        <SortableExerciseItem 
                            key={ex.id} 
                            ex={ex} 
                            dayId={day.id} 
                            onRemove={onRemove}
                            onUpdate={onUpdate}
                        />
                    ))}
                </SortableContext>
                
                {exercises.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 pt-20">
                        <PlusIcon className="size-8 mb-2" />
                        <p className="text-xs font-bold text-center">Mashqni bu yerga sudrab tashlang</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SortableExerciseItem = ({ ex, dayId, onRemove, onUpdate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ex.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-background border rounded-xl p-3 shadow-sm hover:shadow-md transition-all relative"
        >
            <div className="flex items-center gap-2 mb-2">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors">
                    <GripVerticalIcon className="size-4" />
                </div>
                <span className="text-lg">{ex.emoji || "🏋️"}</span>
                <p className="text-xs font-black flex-1 truncate">{ex.name}</p>
                <button 
                    onClick={() => onRemove(dayId, ex.id)}
                    className="size-6 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2Icon className="size-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase opacity-50">Setlar</label>
                    <input 
                        value={ex.sets} 
                        onChange={e => onUpdate(dayId, ex.id, "sets", e.target.value)}
                        className="w-full h-7 bg-muted/50 border-0 rounded px-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase opacity-50">Dam</label>
                    <input 
                        value={ex.rest} 
                        onChange={e => onUpdate(dayId, ex.id, "rest", e.target.value)}
                        className="w-full h-7 bg-muted/50 border-0 rounded px-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkoutBuilder;
