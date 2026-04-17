import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SortableItem = ({ id, children, className, disabled = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("relative", className)}>
            <div className="flex items-center gap-2">
                {!disabled && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted text-muted-foreground"
                        type="button"
                    >
                        <GripVerticalIcon className="size-4" />
                    </button>
                )}
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
};

export default SortableItem;
