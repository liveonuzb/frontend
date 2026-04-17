import React from "react";
import { SparklesIcon, RefreshCwIcon, BrainCircuitIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useClientAiSummary } from "@/hooks/app/use-coach-ai";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientAISummaryWidget({ clientId }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useClientAiSummary(clientId);

  const aiData = data?.data ?? null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: [`/coach/clients/${clientId}/ai-summary`],
    });
  };

  return (
    <Card className="py-2 border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden relative border-2">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <BrainCircuitIcon className="size-48" />
      </div>
      <CardHeader className="pb-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <SparklesIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">AI Sun&apos;iy Intelekt Xulosasi</CardTitle>
              <CardDescription className="text-xs font-medium">
                Mijozning so&apos;nggi faolligi va oziqlanishi bo&apos;yicha tahlil
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2 bg-background/50 backdrop-blur-sm rounded-xl h-10 border-primary/20 hover:bg-primary/10 transition-all font-bold"
          >
            <RefreshCwIcon className={cn("size-4", isLoading && "animate-spin")} />
            Yangilash
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-[90%] rounded-lg" />
            <div className="grid grid-cols-1 gap-4 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : isError || !aiData ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>AI xulosasini yuklab bo&apos;lmadi. Qaytadan urinib ko&apos;ring.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-primary/10">
              <p className="text-sm leading-relaxed text-foreground md:text-base font-medium">
                {aiData.summary}
              </p>
            </div>

            {aiData.keyInsights && aiData.keyInsights.length > 0 && (
              <div className="space-y-3 bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  Asosiy Xulosalar
                </h4>
                <ul className="text-xs space-y-2 text-muted-foreground font-medium">
                  {aiData.keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2 leading-snug">
                      <span className="text-blue-500">•</span> {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
