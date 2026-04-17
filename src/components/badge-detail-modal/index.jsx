import { clamp, round } from "lodash";
import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import CircularProgress from "@/components/circular-progress";

const BadgeDetailModal = ({ badge, progress, onClose }) => {
    if (!badge) return null;

    const p = progress ?? {};
    const pct = badge.total > 0 ? clamp(round(((p.progress ?? 0) / badge.total) * 100), 0, 100) : 0;

    return (
        <AlertDialog open={!!badge} onOpenChange={(open) => !open && onClose?.()}>
            <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <span className="text-5xl">{badge.emoji}</span>
                        <AlertDialogTitle className="text-center">{badge.name}</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">{badge.desc}</AlertDialogDescription>
                    </div>
                </AlertDialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <CircularProgress value={p.progress ?? 0} max={badge.total} size={96} strokeWidth={6}>
                        <span className="text-lg font-bold">{pct}%</span>
                    </CircularProgress>

                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium">{p.progress ?? 0} / {badge.total}</p>
                        {p.earned ? (
                            <p className="text-xs text-green-600">Qo&apos;lga kiritilgan: {p.date}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">Hali bajarilmagan</p>
                        )}
                    </div>

                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10">
                        <span className="text-xs font-bold text-yellow-600">{badge.xp} XP mukofot</span>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Yopish</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default BadgeDetailModal;
