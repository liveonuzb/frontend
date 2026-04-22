import React, { useState } from "react";
import { take, findLast, find } from "lodash";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    SendIcon,
    MicIcon,
    SmileIcon,
    PaperclipIcon,
    ImageIcon,
    ReplyIcon,
    XIcon,
    CalendarIcon,
    SparklesIcon,
    TimerIcon,
    LibraryIcon,
} from "lucide-react";
import StickerPicker from "@/components/chat/sticker-picker";
import VoiceRecorder from "@/components/chat/voice-recorder";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store";
import { useCoachSnippets, useCoachAvailability } from "@/hooks/app/use-coach";

const TIMER_OPTIONS = [
    { label: "O'chirilgan", value: null },
    { label: "10 soniya", value: 10 },
    { label: "1 daqiqa", value: 60 },
    { label: "1 soat", value: 3600 },
];

const ChatInput = ({
    input,
    setInput,
    isRecording,
    setIsRecording,
    handleSendMessage,
    handleVoiceSend,
    handleFileSelect,
    fileInputRef,
    isCoach,
    shareContent,
    workoutPlans,
    mealPlans,
    stickerOpen,
    setStickerOpen,
    handleStickerSelect,
    setTyping,
    activeChat,
    handleKeyDown,
    replyingTo,
    setReplyingTo,
    editingMsg,
    setEditingMsg,
    multiSelectMode,
    exitMultiSelect,
    selectedMsgIds,
    handleMultiDelete,
    handleMultiForward,
    sendBooking,
    getAISuggestions,
    chatMessages = [],
    disabled = false,
}) => {
    const inputRef = React.useRef(null);
    const { snippets } = useCoachSnippets();
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [showLibraryDialog, setShowLibraryDialog] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [ttl, setTtl] = useState(null);

    const { library, sendSharedContent } = useChatStore();

    const [bookingTitle, setBookingTitle] = useState("Konsultatsiya");
    const [bookingSlots, setBookingSlots] = useState(["10:00", "14:00"]);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);

    const { getAvailableSlots } = useCoachAvailability();

    const handleSmartScan = () => {
        const slots = getAvailableSlots(bookingDate);
        if (slots.length > 0) {
            setBookingSlots(take(slots, 4));
            toast.success("Bo'sh vaqtlaringiz topildi! ✨");
        } else {
            toast.error("Bu kunda bo'sh vaqtingiz yo'q");
        }
    };

    React.useEffect(() => { if (replyingTo || editingMsg) inputRef.current?.focus(); }, [replyingTo, editingMsg]);

    const onSend = (text = null) => {
        if (disabled) return;
        handleSendMessage(text, null, "text", ttl);
        setTtl(null);
    };

    const simulateVideoNote = () => {
        toast.promise(new Promise(r => setTimeout(r, 2000)), {
            loading: 'Video...',
            success: () => { handleSendMessage(null, null, "video_note", ttl); return 'Yuborildi!'; },
            error: 'Xato',
        });
    };

    const aiSuggestions = React.useMemo(() => {
        const lastOtherMsg = findLast(chatMessages, m => m.from !== "me");
        return getAISuggestions(lastOtherMsg?.text);
    }, [chatMessages, getAISuggestions]);

    const typingTimeoutRef = React.useRef(null);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        
        if (activeChat) {
            setTyping(activeChat, true);
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTyping(activeChat, false);
            }, 2000);
        }
    };

    return (
        <div className="sticky bottom-0 z-20 shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
            {/* Dialogs scaled for mobile */}
            {(showBookingDialog || showLibraryDialog) && (
                <div className="absolute inset-x-4 bottom-full mb-3 bg-background border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider">
                            {showBookingDialog ? "Uchrashuv" : "Kutubxona"}
                        </h3>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => {setShowBookingDialog(false); setShowLibraryDialog(false);}}><XIcon className="size-4" /></Button>
                    </div>

                    {showLibraryDialog && (
                        <div className="space-y-2">
                            {library.length === 0 ? <p className="text-center text-xs text-muted-foreground py-4">Kutubxona bo'sh</p> : library.map(res => (
                                <button key={res.id} className="flex items-center w-full p-2.5 hover:bg-muted rounded-xl gap-3 transition-colors text-left" onClick={() => { sendSharedContent(activeChat, "resource", res.id, res.title, res.type); setShowLibraryDialog(false); }}>
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">{res.type}</div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{res.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{res.size}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {showBookingDialog && (
                        <div className="space-y-3">
                            <input value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} className="w-full h-9 px-3 rounded-lg border bg-muted/30 text-sm" placeholder="Mavzu..." />
                            <div className="flex gap-2">
                                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="flex-1 h-8 px-2 rounded-md border text-xs bg-background" />
                                <Button size="xs" variant="outline" className="h-8 gap-1.5" onClick={handleSmartScan}>
                                    <SparklesIcon className="size-3 text-primary" /> Smart Scan
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {bookingSlots.map(t => (
                                    <button key={t} onClick={() => setBookingSlots(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={cn("px-2.5 py-1 rounded-md border text-[10px]", bookingSlots.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20")}>{t}</button>
                                ))}
                            </div>
                            <Button
                                className="w-full h-9 text-xs"
                                disabled={isSubmittingBooking || !bookingTitle.trim() || bookingSlots.length === 0}
                                onClick={async () => {
                                    try {
                                        setIsSubmittingBooking(true);
                                        await sendBooking(
                                            activeChat,
                                            bookingTitle.trim(),
                                            bookingDate,
                                            bookingSlots,
                                        );
                                        toast.success("Uchrashuv slotlari yuborildi");
                                        setShowBookingDialog(false);
                                    } finally {
                                        setIsSubmittingBooking(false);
                                    }
                                }}
                            >
                                {isSubmittingBooking ? "Yuborilmoqda..." : "Slotlarni yuborish"}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Replying indicator */}
            {replyingTo && (
                <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <ReplyIcon className="size-4 text-primary shrink-0" />
                        <div className="border-l-2 border-primary pl-3 min-w-0">
                            <p className="text-[10px] font-black text-primary uppercase">{replyingTo.from === 'me' ? 'Siz' : 'Mijoz'}</p>
                            <p className="text-xs truncate opacity-70">{replyingTo.text}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => setReplyingTo(null)}><XIcon className="size-4" /></Button>
                </div>
            )}

            {/* AI Suggestions Bar */}
            {!input.trim() && !replyingTo && !editingMsg && (
                <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar bg-background/50 items-center">
                    {aiSuggestions.map((text, i) => (
                        <button key={`ai-${i}`} onClick={() => onSend(text)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] md:text-xs hover:bg-primary/20 transition-all flex items-center gap-1.5 shadow-sm">
                            <SparklesIcon className="size-3" />{text}
                        </button>
                    ))}
                    {isCoach && snippets.map((snippet) => (
                        <button key={snippet.id} onClick={() => setInput(snippet.text)} className="whitespace-nowrap px-3 py-1.5 rounded-full border bg-background text-[10px] md:text-xs hover:bg-muted transition-colors font-medium">{snippet.title}</button>
                    ))}
                </div>
            )}

            <div className="p-2 md:p-4 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1.5 max-w-6xl mx-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-primary/10 shrink-0"><PaperclipIcon className="size-4 md:size-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-2xl">
                            {isCoach && (
                                <>
                                    <DropdownMenuItem onClick={() => setShowBookingDialog(true)} className="text-xs p-2.5 cursor-pointer"><CalendarIcon className="mr-2 size-4 text-primary" />Uchrashuv</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowLibraryDialog(true)} className="text-xs p-2.5 cursor-pointer"><LibraryIcon className="mr-2 size-4 text-primary" />Kutubxona</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={() => fileInputRef.current.click()} className="text-xs p-2.5 cursor-pointer"><ImageIcon className="mr-2 size-4 text-primary" />Media</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                    
                    <div className={cn(
                        "relative flex-1 flex items-center gap-1 bg-muted/50 rounded-2xl px-3 pr-1 border focus-within:ring-2 focus-within:ring-primary/50 transition-all",
                        disabled && "opacity-60",
                    )}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    disabled={disabled}
                                    className={cn("size-7 rounded-full flex items-center justify-center transition-colors", ttl ? "bg-orange-500 text-white" : "hover:bg-background/50 text-muted-foreground")}
                                >
                                    <TimerIcon className="size-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-32">
                                {TIMER_OPTIONS.map(opt => (
                                    <DropdownMenuItem key={opt.label} onClick={() => setTtl(opt.value)} className="text-xs">{opt.label}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <input
                            ref={inputRef}
                            value={input}
                            disabled={disabled}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="flex-1 h-10 md:h-12 bg-transparent border-0 focus:ring-0 text-sm outline-none"
                            placeholder={disabled ? "Bu chat bloklangan" : ttl ? `Self-destruct: ${find(TIMER_OPTIONS, o => o.value === ttl).label}` : "Xabar..."}
                        />
                        
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setStickerOpen(!stickerOpen)} disabled={disabled}><SmileIcon className="size-4 text-muted-foreground" /></Button>
                        <StickerPicker open={stickerOpen} onClose={() => setStickerOpen(false)} onSelect={handleStickerSelect} />
                    </div>

                    {input.trim() ? (
                        <div className="flex gap-1 items-center">
                            <Button onClick={() => onSend()} disabled={disabled} className="size-10 md:size-12 rounded-2xl shadow-lg shrink-0"><SendIcon className="size-4 md:size-5" /></Button>
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsRecording(true)} disabled={disabled} className="size-10 md:size-12 rounded-2xl hover:bg-primary/10 shrink-0"><MicIcon className="size-4 md:size-5" /></Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
