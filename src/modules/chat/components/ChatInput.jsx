import React, { useState } from "react";
import findLast from "lodash/findLast";
import find from "lodash/find";
import map from "lodash/map";
import split from "lodash/split";
import trim from "lodash/trim";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SendIcon,
    MicIcon,
    SmileIcon,
    PaperclipIcon,
    ImageIcon,
    ReplyIcon,
    XIcon,
    SparklesIcon,
    TimerIcon,
} from "lucide-react";
import StickerPicker from "@/components/chat/sticker-picker";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store";
import { CHAT_ATTACHMENT_ACCEPT } from "@/modules/chat/lib/chat-attachment-policy.js";
import { isChatFeatureEnabled } from "@/modules/chat/lib/chat-feature-flags.js";

const TIMER_OPTIONS = [
    { label: "O'chirilgan", value: null },
    { label: "10 soniya", value: 10 },
    { label: "1 daqiqa", value: 60 },
    { label: "1 soat", value: 3600 },
];

const ChatInput = ({
    input,
    setInput,
    setIsRecording,
    handleSendMessage,
    handleFileSelect,
    fileInputRef,
    stickerOpen,
    setStickerOpen,
    handleStickerSelect,
    setTyping,
    activeChat,
    handleKeyDown,
    replyingTo,
    setReplyingTo,
    editingMsg,
    sendBooking,
    getAISuggestions,
    chatMessages = [],
    disabled = false,
    disabledReason = "Bu chat bloklangan",
    connectionState = "online",
}) => {
    const inputRef = React.useRef(null);
    const canUseSelfDestructMessages = isChatFeatureEnabled("selfDestructMessages");
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [showLibraryDialog, setShowLibraryDialog] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [ttl, setTtl] = useState(null);

    const { library, sendSharedContent } = useChatStore();

    const [bookingTitle, setBookingTitle] = useState("Konsultatsiya");
    const [bookingSlots, setBookingSlots] = useState(["10:00", "14:00"]);
    const [bookingDate, setBookingDate] = useState(split(new Date().toISOString(), "T")[0]);

    React.useEffect(() => { if (replyingTo || editingMsg) inputRef.current?.focus(); }, [replyingTo, editingMsg]);

    const onSend = (text = null) => {
        if (disabled) return;
        handleSendMessage(
            text,
            null,
            "text",
            canUseSelfDestructMessages ? ttl : null,
        );
        setTtl(null);
    };

    const aiSuggestions = React.useMemo(() => {
        const lastOtherMsg = findLast(chatMessages, m => m.from !== "me");
        return map(getAISuggestions(lastOtherMsg?.text), (text) => ({
            text,
            reason: "Oxirgi xabar matniga asoslangan tezkor draft",
        }));
    }, [chatMessages, getAISuggestions]);

    const applySuggestion = (suggestion) => {
        if (disabled) return;
        setInput(suggestion.text || suggestion);
    };

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

    const isOffline = connectionState === "offline";

    return (
        <div className="sticky bottom-0 z-20 shrink-0 border-t bg-background/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur supports-[backdrop-filter]:bg-background/90">
            {/* Dialogs scaled for mobile */}
            {(showBookingDialog || showLibraryDialog) && (
                <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 max-h-[min(70svh,26rem)] overflow-y-auto overscroll-contain rounded-2xl border bg-background p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 md:absolute md:inset-x-4 md:bottom-full md:mb-3 md:max-h-[60vh] md:p-4">
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider">
                            {showBookingDialog ? "Uchrashuv" : "Kutubxona"}
                        </h3>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => {setShowBookingDialog(false); setShowLibraryDialog(false);}}><XIcon className="size-4" /></Button>
                    </div>

                    {showLibraryDialog && (
                        <div className="space-y-2">
                            {library.length === 0 ? <p className="text-center text-xs text-muted-foreground py-4">Kutubxona bo'sh</p> : map(library, res => (
                                <button type="button" key={res.id} className="flex items-center w-full p-2.5 hover:bg-muted rounded-xl gap-3 transition-colors text-left" onClick={() => { sendSharedContent(activeChat, "resource", res.id, res.title, res.type); setShowLibraryDialog(false); }}>
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
                            <input value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} className="h-10 w-full rounded-lg border bg-muted/30 px-3 text-sm" placeholder="Mavzu..." aria-label="Band qilish mavzusi" />
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs" aria-label="Band qilish sanasi" />
                            </div>
                            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {map(bookingSlots, t => (
                                    <button type="button" key={t} onClick={() => setBookingSlots([t])} className={cn("min-h-8 rounded-md border px-2.5 py-1 text-[10px]", "bg-primary text-primary-foreground border-primary")}>{t}</button>
                                ))}
                            </div>
                            <Button
                                className="w-full h-9 text-xs"
                                disabled={isSubmittingBooking || !trim(bookingTitle) || bookingSlots.length === 0}
                                onClick={async () => {
                                    try {
                                        setIsSubmittingBooking(true);
                                        await sendBooking(
                                            activeChat,
                                            trim(bookingTitle),
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
            {!trim(input) && !replyingTo && !editingMsg && (
                <div className="flex max-h-24 items-center gap-1.5 overflow-x-auto bg-background/50 px-3 py-1.5 no-scrollbar">
                    {map(aiSuggestions, (text, i) => (
                        <button type="button"
                            key={`ai-${i}`}
                            onClick={() => applySuggestion(text)}
                            title={text.reason}
                            className="min-w-[180px] max-w-[min(78vw,320px)] rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-left text-[10px] text-primary shadow-sm transition-all hover:bg-primary/20 md:min-w-[220px] md:text-xs"
                        >
                            <span className="flex items-center gap-1.5 font-medium">
                                <SparklesIcon className="size-3 shrink-0" />
                                <span className="line-clamp-2">{text.text}</span>
                            </span>
                            {text.reason ? (
                                <span className="mt-1 block truncate text-[9px] opacity-70">
                                    {text.reason}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            )}
            {(disabled || isOffline) && (
                <div className={cn(
                    "mx-2 mt-2 rounded-xl border px-3 py-2 text-[11px] font-medium md:mx-4 md:text-xs",
                    disabled ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}>
                    {disabled ? disabledReason : "Internet aloqasi yo'q. Yuborilmagan xabarlar retry tugmasi bilan ko'rinadi."}
                </div>
            )}
            <div className="p-2 shadow-lg shadow-black/5 md:p-4">
                <div className="mx-auto flex max-w-6xl items-end gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9 shrink-0 rounded-full hover:bg-primary/10" disabled={disabled} aria-label="Media biriktirish"><PaperclipIcon className="size-4 md:size-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-2xl">
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs p-2.5 cursor-pointer"><ImageIcon className="mr-2 size-4 text-primary" />Media</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                        <input ref={fileInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} className="hidden" onChange={handleFileSelect} aria-label="Media fayl tanlash" />
                    
                    <div className={cn(
                        "relative flex min-w-0 flex-1 items-end gap-1 rounded-2xl border bg-muted/50 px-2 py-1 pr-1 transition-all focus-within:ring-2 focus-within:ring-primary/50 md:px-3",
                        disabled && "opacity-60",
                    )}>
                        {canUseSelfDestructMessages && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button type="button"
                                        disabled={disabled}
                                        className={cn("mb-1 size-7 shrink-0 rounded-full flex items-center justify-center transition-colors", ttl ? "bg-orange-500 text-white" : "hover:bg-background/50 text-muted-foreground")}
                                        aria-label="Self-destruct vaqtini tanlash"
                                    >
                                        <TimerIcon className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-32">
                                    {map(TIMER_OPTIONS, opt => (
                                        <DropdownMenuItem key={opt.label} onClick={() => setTtl(opt.value)} className="text-xs">{opt.label}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <textarea
                            ref={inputRef}
                            value={input}
                            disabled={disabled}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="field-sizing-content max-h-32 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-sm outline-none focus:ring-0 md:min-h-12"
                            placeholder={disabled ? disabledReason : canUseSelfDestructMessages && ttl ? `Self-destruct: ${find(TIMER_OPTIONS, o => o.value === ttl).label}` : "Xabar..."}
                            aria-label="Xabar matni"
                        />
                        
                        <Button variant="ghost" size="icon" className="mb-1 size-8 shrink-0" onClick={() => setStickerOpen(!stickerOpen)} disabled={disabled} aria-label="Stikerlarni ochish"><SmileIcon className="size-4 text-muted-foreground" /></Button>
                        <StickerPicker open={stickerOpen} onClose={() => setStickerOpen(false)} onSelect={handleStickerSelect} />
                    </div>

                    {trim(input) ? (
                        <div className="flex gap-1 items-center">
                            <Button onClick={() => onSend()} disabled={disabled} className="size-10 md:size-12 rounded-2xl shadow-lg shrink-0" aria-label="Xabar yuborish"><SendIcon className="size-4 md:size-5" /></Button>
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsRecording(true)} disabled={disabled} className="size-10 md:size-12 rounded-2xl hover:bg-primary/10 shrink-0" aria-label="Ovozli xabar yozish"><MicIcon className="size-4 md:size-5" /></Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
