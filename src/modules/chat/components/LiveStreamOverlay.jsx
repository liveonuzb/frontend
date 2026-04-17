import { map, filter } from "lodash";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    XIcon,
    HeartIcon,
    UsersIcon,
    SendIcon,
    MessageCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LiveStreamOverlay = ({ 
    activeLive, 
    onEnd, 
    isHost = false 
}) => {
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([
        { id: 1, user: "Nilufar", text: "Ajoyib mashg'ulot! 🔥" },
        { id: 2, user: "Jasur", text: "Texnikani ko'rsatib bering" },
    ]);
    const [hearts, setHearts] = useState([]);

    const addHeart = () => {
        const id = Date.now();
        setHearts(prev => [...prev, id]);
        setTimeout(() => {
            setHearts(prev => filter(prev, h => h !== id));
        }, 2000);
    };

    const handleSendComment = () => {
        if (!comment.trim()) return;
        setComments(prev => [...prev, { id: Date.now(), user: "Siz", text: comment }]);
        setComment("");
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col md:flex-row animate-in fade-in duration-500">
            {/* Main Video Area */}
            <div className="flex-1 relative bg-muted/10 overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/20 flex flex-col items-center gap-4">
                        <div className="size-24 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                            <UsersIcon className="size-12" />
                        </div>
                        <p className="text-sm font-medium tracking-widest uppercase italic">Jonli Efir Simulyatsiyasi</p>
                    </div>
                </div>

                {/* Top Info Bar */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/10">
                        <div className="size-10 rounded-full bg-primary flex items-center justify-center text-xl shadow-lg border-2 border-white/20">
                            👨‍🏫
                        </div>
                        <div>
                            <p className="text-white text-xs font-bold leading-none">{activeLive.hostName}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] text-white/70 uppercase font-black tracking-tighter">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white">
                            <UsersIcon className="size-3.5" />
                            <span className="text-xs font-bold">{activeLive.viewers}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onEnd} className="size-10 rounded-full bg-white/10 hover:bg-white/20 text-white">
                            <XIcon className="size-5" />
                        </Button>
                    </div>
                </div>

                {/* Floating Hearts Animation Container */}
                <div className="absolute bottom-24 right-6 w-20 h-64 pointer-events-none overflow-hidden z-20">
                    {map(hearts, id => (
                        <div key={id} className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-live-heart text-red-500">
                            <HeartIcon className="size-6 fill-current" />
                        </div>
                    ))}
                </div>

                {/* Right Bottom Actions */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
                    <button 
                        onClick={addHeart}
                        className="size-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                        <HeartIcon className="size-6 fill-current" />
                    </button>
                </div>
            </div>

            {/* Comments Area */}
            <div className="w-full md:w-80 h-1/3 md:h-full bg-black/60 md:bg-background/5 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 z-20 relative">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <MessageCircleIcon className="size-3.5 text-primary" />
                        Sharhlar
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {map(comments, c => (
                        <div key={c.id} className="space-y-1 group animate-in slide-in-from-bottom-2 duration-300">
                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{c.user}</p>
                            <p className="text-white/90 text-sm leading-snug">{c.text}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="relative">
                        <input 
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                            placeholder="Sharh yozing..."
                            className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-4 pr-12 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/30"
                        />
                        <button 
                            onClick={handleSendComment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-primary rounded-lg flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all"
                        >
                            <SendIcon className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Host Controls */}
            {isHost && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
                    <Button variant="destructive" onClick={onEnd} className="h-9 px-6 rounded-full font-bold uppercase tracking-wider shadow-2xl">
                        Efirni Tugatish
                    </Button>
                </div>
            )}
        </div>
    );
};

export default LiveStreamOverlay;
