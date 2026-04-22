import React from "react";
import { Button } from "@/components/ui/button";
import {
    SearchIcon,
    PhoneIcon,
    VideoIcon,
    MoreVerticalIcon,
    ArrowLeftIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XIcon,
    BellOffIcon,
    UserRoundIcon,
    BanIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { useChatStore } from "@/store";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const chatTypeBadges = {
    COACH_CLIENT: { label: "Coach", emoji: "💪" },
};

const ChatHeader = ({
    activeEntity,
    typingUsers,
    activeChat,
    getLastSeenText,
    handleBackToList,
    chatSearchOpen,
    setChatSearchOpen,
    chatSearchQuery,
    setChatSearchQuery,
    setChatSearchIndex,
    chatSearchMatches,
    chatSearchIndex,
    handleChatSearchPrev,
    handleChatSearchNext,
    isCoach,
    onToggleInfo,
    onAudioCall,
    onVideoCall,
    isMuted,
    isBlocked,
    onToggleMute,
    onToggleBlock,
    onStartLive, // New prop
}) => {
    const navigate = useNavigate();
    const { getLiveActivity, activeLive } = useChatStore();
    const { openProfile } = useProfileOverlay();
    const liveActivity = getLiveActivity(activeChat);
    const isLive = activeLive && activeLive.chatId === activeChat;

    return (
        <div className="sticky top-0 z-20 shrink-0 bg-background/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 border-b">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden shrink-0 size-8"
                        onClick={handleBackToList}
                    >
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    <div className="relative cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={onToggleInfo}>
                        <Avatar className={cn(
                            "size-10 md:size-12 border-2 shadow-sm transition-all",
                            isLive ? "border-red-500 ring-2 ring-red-500/20" : "border-background"
                        )}>
                            <AvatarImage src={activeEntity.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{activeEntity.name?.[0]}</AvatarFallback>
                        </Avatar>
                        {activeEntity.online && !isLive && (
                            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
                        )}
                        {isLive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-[8px] text-white px-1 rounded font-black uppercase">Live</div>
                        )}
                    </div>
                    <div className="cursor-pointer min-w-0 flex-1" onClick={onToggleInfo}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold leading-tight truncate text-[15px] md:text-lg">{activeEntity.name}</p>
                            {activeEntity?.type && chatTypeBadges[activeEntity.type] && (
                                <span className="text-[9px] md:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                                    {chatTypeBadges[activeEntity.type].emoji} {chatTypeBadges[activeEntity.type].label}
                                </span>
                            )}
                        </div>
                        {isLive ? (
                            <p className="text-[10px] md:text-xs text-red-500 font-black animate-pulse flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-red-500" /> JONLI EFIR
                            </p>
                        ) : liveActivity ? (
                            <p className={cn("text-[10px] md:text-xs truncate font-bold animate-pulse", liveActivity.color)}>
                                {liveActivity.label} • <span className="opacity-70 font-normal">{liveActivity.sub}</span>
                            </p>
                        ) : (
                            <p className={cn(
                                "text-[10px] md:text-xs truncate font-medium",
                                typingUsers[activeChat] ? "text-primary animate-pulse" : "text-green-500 opacity-80"
                            )}>
                                {typingUsers[activeChat] ? "yozmoqda..." : (activeEntity.online ? "Online" : getLastSeenText(activeEntity))}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                    {/* Live indicator for others */}
                    {isLive && !isCoach && (
                        <Button variant="destructive" size="sm" className="h-8 text-[10px] font-black rounded-full animate-bounce px-3 mr-2" onClick={onStartLive}>
                            QO'SHILISH
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChatSearchOpen(!chatSearchOpen)}
                        className={cn("size-8 md:size-10 rounded-full", chatSearchOpen && "bg-primary/10 text-primary")}
                    >
                        <SearchIcon className="size-4 md:size-5" />
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled className="hidden sm:flex size-10 rounded-full opacity-40 cursor-not-allowed"><PhoneIcon className="size-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Tez kunda...</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled className="hidden sm:flex size-10 rounded-full opacity-40 cursor-not-allowed"><VideoIcon className="size-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Tez kunda...</TooltipContent>
                    </Tooltip>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 md:size-10 rounded-full"><MoreVerticalIcon className="size-4 md:size-5 opacity-70" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
                            {isCoach && (
                                <DropdownMenuItem disabled className="text-xs p-2.5 cursor-not-allowed opacity-40">
                                    <VideoIcon className="mr-2 size-4" /> Jonli efirni boshlash (Tez kunda...)
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={onToggleInfo} className="text-xs p-2.5 cursor-pointer">
                                <UserRoundIcon className="mr-2 size-4" /> Profilni ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openProfile("profile")} className="text-xs p-2.5 cursor-pointer">
                                <MoreVerticalIcon className="mr-2 size-4" /> Mening sozlamalarim
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onToggleMute} className="text-xs p-2.5 cursor-pointer">
                                <BellOffIcon className="mr-2 size-4" /> {isMuted ? "Ovozini yoqish" : "Jim qilish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onToggleBlock}
                                className={cn(
                                    "text-xs p-2.5 cursor-pointer",
                                    isBlocked && "text-destructive",
                                )}
                            >
                                <BanIcon className="mr-2 size-4" /> {isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Compact Search Bar */}
            {chatSearchOpen && (
                <div className="px-4 py-2 border-b bg-background animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 border shadow-sm">
                        <SearchIcon className="size-3.5 text-muted-foreground" />
                        <input
                            value={chatSearchQuery}
                            onChange={(e) => { setChatSearchQuery(e.target.value); setChatSearchIndex(0); }}
                            className="flex-1 bg-transparent text-xs outline-none"
                            placeholder="Qidirish..."
                            autoFocus
                        />
                        <div className="flex items-center gap-1">
                            <button onClick={handleChatSearchPrev} className="p-1 hover:bg-muted rounded"><ChevronUpIcon className="size-3" /></button>
                            <button onClick={handleChatSearchNext} className="p-1 hover:bg-muted rounded"><ChevronDownIcon className="size-3" /></button>
                            <button onClick={() => setChatSearchOpen(false)} className="p-1 hover:bg-muted rounded"><XIcon className="size-3" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHeader;
