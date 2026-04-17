import { times } from "lodash";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>

            {/* Date Nav Skeleton */}
            <div className="flex items-center justify-between bg-muted/30 p-1 rounded-xl">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="size-8 rounded-lg" />
            </div>

            {/* Quote Skeleton */}
            <Skeleton className="h-20 w-full rounded-xl" />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {times(4, (i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between mb-4">
                                <Skeleton className="size-10 rounded-lg" />
                                <Skeleton className="h-4 w-12 rounded-md" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-24 rounded-md" />
                                <Skeleton className="h-2 w-full rounded-full" />
                                <Skeleton className="h-3 w-16 rounded-md" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle Section Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-80 lg:col-span-2 w-full rounded-xl" />
                <div className="space-y-6">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
};

export const WorkoutsSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-full max-w-sm rounded-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {times(4, (i) => (
                    <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-5 w-32 rounded-md" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-full rounded-md" />
                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-4 w-16 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-md" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export const RecipesSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-hidden">
                {times(5, (i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {times(6, (i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-3/4 rounded-md" />
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-16 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
