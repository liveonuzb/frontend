import { map } from "lodash";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewer = ({ stories, initialStoryIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);

    const activeStory = stories[currentIndex];

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress(0);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const nextProgress = (elapsed / STORY_DURATION) * 100;

            if (nextProgress >= 100) {
                handleNext();
            } else {
                setProgress(nextProgress);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [currentIndex]);

    if (!activeStory) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center animate-in fade-in duration-300">
            {/* Background Blur */}
            <div className="absolute inset-0 opacity-40 blur-3xl pointer-events-none">
                <img loading="lazy" src={activeStory.content} alt="bg" className="w-full h-full object-cover" />
            </div>

            <div className="relative w-full max-w-lg h-full md:h-[90dvh] md:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col">
                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-30">
                    {map(stories, (_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-50"
                                style={{
                                    width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary flex items-center justify-center text-xl border-2 border-white/20 shadow-lg">
                            {activeStory.avatar}
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold shadow-sm">{activeStory.userName}</p>
                            <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Hozirda</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        onClick={onClose}
                        className="size-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all"
                    >
                        <XIcon className="size-6" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 relative group">
                    <img loading="lazy"
                        src={activeStory.content}
                        alt="story"
                        className="w-full h-full object-contain md:object-cover pointer-events-none"
                    />

                    {/* Navigation areas */}
                    <div className="absolute inset-0 flex">
                        <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
                        <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
                    </div>

                    {/* Desktop Arrows */}
                    <button
                        onClick={handlePrev}
                        className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/20 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex",
                            currentIndex === 0 && "pointer-events-none opacity-0"
                        )}
                    >
                        <ChevronLeftIcon className="size-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/20 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                    >
                        <ChevronRightIcon className="size-6" />
                    </button>
                </div>

                {/* Interaction Footer */}
                <div className="p-6 bg-gradient-to-t from-black/80 to-transparent pt-20 absolute bottom-0 left-0 right-0 z-20">
                    <div className="flex gap-3">
                        <input
                            placeholder="Reaksiya bildiring..."
                            className="flex-1 h-12 bg-white/10 border border-white/10 rounded-full px-6 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/40 backdrop-blur-md"
                        />
                        <button className="size-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all backdrop-blur-md border border-white/10">❤️</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryViewer;
