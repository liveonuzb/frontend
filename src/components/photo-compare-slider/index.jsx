import { clamp } from "lodash";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const BeforeAfterSlider = ({ beforeImage, afterImage, beforeLabel = "Avval", afterLabel = "Keyin" }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMove = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clamp(clientX - rect.left, 0, rect.width);
        setSliderPosition((x / rect.width) * 100);
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const handleTouchMove = (e) => {
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }, []);

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden cursor-ew-resize select-none border-4 border-background shadow-2xl group"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
        >
            {/* After Image (Background) */}
            <img loading="lazy" 
                src={afterImage} 
                alt="After" 
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before Image (Clip) */}
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img loading="lazy" 
                    src={beforeImage} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute inset-y-0 z-10 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="size-8 md:size-10 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-primary/20">
                    <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-primary/40 rounded-full" />
                        <div className="w-0.5 h-4 bg-primary rounded-full" />
                        <div className="w-0.5 h-4 bg-primary/40 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-20">
                <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase px-2 py-1 rounded-md border border-white/10 tracking-widest">{beforeLabel}</span>
            </div>
            <div className="absolute top-4 right-4 z-20">
                <span className="bg-primary/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-2 py-1 rounded-md border border-white/10 tracking-widest">{afterLabel}</span>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-bold px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Solishtirish uchun suring
            </div>
        </div>
    );
};

export default BeforeAfterSlider;
