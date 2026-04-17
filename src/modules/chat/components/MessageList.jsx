import React, { useState, useEffect } from "react";
import { times, filter, map, round } from "lodash";
import { cn } from "@/lib/utils";
import {
    Check,
    CheckCheck,
    DumbbellIcon,
    UtensilsIcon,
    PlayIcon,
    PauseIcon,
    Trash2Icon,
    XIcon,
    LanguagesIcon,
    MicIcon,
    TypeIcon,
    PlayCircleIcon,
    PlusIcon as PlusIconLucide,
    CalendarIcon,
    CreditCardIcon,
    BadgeCheckIcon,
    TimerIcon,
    FlameIcon,
    CheckSquareIcon,
    FileIcon,
    ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useChatStore, useAuthStore } from "@/store";
import { useNavigate } from "react-router";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Confetti from "react-confetti";

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function formatVoiceDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

const VideoNotePlayer = ({ mediaUrl, isMe }) => (
    <div className={cn(
        "size-40 md:size-48 rounded-full overflow-hidden border-4 relative group cursor-pointer shadow-xl",
        isMe ? "border-primary/30" : "border-background"
    )}>
        <video src={mediaUrl} className="w-full h-full object-cover" loop muted autoPlay playsInline />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <PlayCircleIcon className="size-10 md:size-12 text-white/80 group-hover:scale-110 transition-transform" />
        </div>
    </div>
);

const InteractiveTask = ({ metadata, msgId, activeChat, isMe, onComplete }) => {
    const { updateTaskProgress } = useChatStore();
    const percentage = round((metadata.current / metadata.goal) * 100);
    const handleProgress = () => {
        updateTaskProgress(activeChat, msgId, 1);
        if (metadata.current + 1 >= metadata.goal) onComplete();
    };
    return (
        <div className="space-y-2 md:space-y-3 min-w-[180px] md:min-w-[220px] py-1">
            <div className="flex items-center justify-between font-bold text-xs md:text-sm">
                <div className="flex items-center gap-2"><span className="text-sm md:text-base">🎯</span><span>{metadata.title}</span></div>
                {metadata.completed && <Badge className="bg-green-500 text-[7px] md:text-[8px] h-3 md:h-4">Bajarildi</Badge>}
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] md:text-[10px] opacity-70"><span>Progress: {metadata.current} / {metadata.goal} {metadata.unit}</span><span>{percentage}%</span></div>
                <Progress value={percentage} className="h-1 md:h-1.5" />
            </div>
            {!isMe && !metadata.completed && <Button size="sm" className="w-full h-7 md:h-8 text-[10px] md:text-xs font-bold" onClick={handleProgress}><PlusIconLucide className="size-3 mr-1" /> Bajardim</Button>}
        </div>
    );
};

const BookingWidget = ({ metadata, msgId, activeChat, isMe }) => {
    const { selectBookingSlot } = useChatStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isCancelled = metadata?.status === "cancelled";
    const isCompleted = metadata?.status === "completed";
    const isScheduled = metadata?.status === "scheduled";

    const handleSelectSlot = async (slotTime) => {
        if (!metadata?.bookingId) {
            toast.error("Booking ID topilmadi");
            return;
        }

        try {
            setIsSubmitting(true);
            await selectBookingSlot(activeChat, metadata.bookingId, slotTime);
            toast.success("Vaqt muvaffaqiyatli band qilindi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-2 md:space-y-3 min-w-[180px] md:min-w-[220px] py-1">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm"><CalendarIcon className="size-3.5 md:size-4 text-primary" /><span>{metadata.title}</span></div>
            {isCancelled ? (
                <div className="p-2 md:p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-rose-500">Bekor qilindi</p>
                    <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">
                        {metadata.cancellationReason || "Sabab ko'rsatilmagan"}
                    </p>
                </div>
            ) : isCompleted ? (
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-green-600">Tugallandi</p>
                    <p className="text-base md:text-lg font-black">{metadata.selectedSlot || metadata.date}</p>
                </div>
            ) : metadata.selectedSlot ? (
                <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-primary">{isScheduled ? "Band qilindi" : "Tanlangan vaqt"}</p>
                    <p className="text-base md:text-lg font-black">{metadata.selectedSlot}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {metadata.slots.map((slot, i) => (
                        <button key={i} disabled={isMe || isSubmitting || !metadata?.bookingId} onClick={() => handleSelectSlot(slot.time)} className="p-1.5 md:p-2 rounded-lg border bg-background hover:border-primary hover:text-primary transition-all text-[10px] md:text-xs font-medium disabled:opacity-50">{slot.time}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

const HabitTrackerWidget = ({ metadata, msgId, activeChat, isMe }) => {
    const { updateHabitStatus } = useChatStore();

    // Calculate progress
    const completed = filter(metadata.habits, h => h.checked).length;
    const total = metadata.habits.length;
    const progress = round((completed / total) * 100);

    return (
        <div className="space-y-3 min-w-[200px] md:min-w-[240px] py-1">
            <div className="flex items-center justify-between font-bold text-xs md:text-sm">
                <div className="flex items-center gap-2">
                    <CheckSquareIcon className="size-3.5 md:size-4 text-primary" />
                    <span>{metadata.title}</span>
                </div>
                <Badge variant={progress === 100 ? "default" : "secondary"} className="text-[7px] md:text-[8px] h-3 md:h-4">
                    {progress}%
                </Badge>
            </div>

            <div className="space-y-1.5">
                {metadata.habits.map((habit, idx) => (
                    <button
                        key={idx}
                        disabled={!isMe} // Only the user can check their own habits (or maybe coach can too? Assuming user for now)
                        onClick={() => updateHabitStatus(activeChat, msgId, idx)}
                        className={cn(
                            "flex items-center justify-between w-full p-2 rounded-lg text-xs transition-all border",
                            habit.checked
                                ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                                : "bg-background border-border hover:bg-muted/50"
                        )}
                    >
                        <span className={cn(habit.checked && "line-through opacity-70")}>{habit.label}</span>
                        <div className={cn(
                            "size-4 rounded flex items-center justify-center border transition-colors",
                            habit.checked ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30"
                        )}>
                            {habit.checked && <Check className="size-3" />}
                        </div>
                    </button>
                ))}
            </div>
            <Progress value={progress} className="h-1 md:h-1.5" />
        </div>
    );
};

const InvoiceWidget = ({ metadata, msgId, activeChat, isMe, onPay }) => {
    const { payInvoice } = useChatStore();
    return (
        <div className="space-y-3 md:space-y-4 min-w-[200px] md:min-w-[240px] py-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs md:text-sm"><CreditCardIcon className="size-3.5 md:size-4 text-primary" /><span>To'lov uchun hisob</span></div>
                {metadata.status === "paid" && <BadgeCheckIcon className="size-4 md:size-5 text-green-500" />}
            </div>
            <div className={cn("p-3 md:p-4 rounded-xl border text-center space-y-1", metadata.status === "paid" ? "bg-green-500/10 border-green-500/20" : "bg-primary/5 border-primary/10")}>
                <p className="text-[10px] md:text-xs opacity-70">{metadata.description}</p>
                <p className="text-xl md:text-2xl font-black">{parseInt(metadata.amount).toLocaleString()} <span className="text-sm">UZS</span></p>
            </div>
            {!isMe && metadata.status === "pending" && <Button className="w-full h-9 md:h-10 text-xs md:text-sm font-bold shadow-lg" onClick={() => { payInvoice(activeChat, msgId); onPay(); }}>To'lash</Button>}
        </div>
    );
};

const ChallengeSharedWidget = ({ metadata, onJoin }) => {
    return (
        <div className="space-y-3 min-w-[200px] md:min-w-[240px] py-1">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-primary">
                <FlameIcon className="size-4 animate-pulse" />
                <span>Yangi Musobaqa!</span>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
                <h4 className="font-black text-sm md:text-base leading-tight">{metadata.title}</h4>
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    {metadata.description}
                </p>
            </div>
            <Button 
                size="sm" 
                className="w-full h-8 text-[11px] font-bold gap-2"
                onClick={onJoin}
            >
                <PlusIconLucide className="size-3.5" />
                Ishtirok etish
            </Button>
        </div>
    );
};

const VoiceMessagePlayer = ({ msg, activeChat, isMe }) => {
    const { transcribeVoice } = useChatStore();
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingAI, setLoadingLoadingAI] = useState(false);
    const audioRef = React.useRef(null);
    const animRef = React.useRef(null);
    const [randomHeights] = React.useState(() => times(12, () => (4 + Math.random() * 10) * 0.8));

    const togglePlay = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(msg.mediaUrl);
            audioRef.current.onended = () => { setPlaying(false); setProgress(0); };
        }
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); const tick = () => { if (audioRef.current) { setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); animRef.current = requestAnimationFrame(tick); } }; tick(); }
    };

    const handleTranscribe = async () => {
        setLoadingLoadingAI(true);
        await transcribeVoice(activeChat, msg.id);
        setLoadingLoadingAI(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 min-w-[140px] md:min-w-[180px]">
                <button onClick={togglePlay} className={cn("size-7 md:size-8 rounded-full flex items-center justify-center shrink-0", isMe ? "bg-primary-foreground/20" : "bg-primary/10")}>
                    {playing ? <PauseIcon className="size-3 md:size-3.5" /> : <PlayIcon className="size-3 md:size-3.5" />}
                </button>
                <div className="flex-1 flex items-end gap-[1px] md:gap-[2px] h-4 md:h-5">
                    {times(12, (i) => <span key={i} className={cn("w-[2px] rounded-full transition-all", (i / 12) * 100 <= progress ? (isMe ? "bg-primary-foreground" : "bg-primary") : (isMe ? "bg-primary-foreground/40" : "bg-muted-foreground/30"))} style={{ height: `${randomHeights[i]}px` }} />)}
                </div>
                <span className="text-[8px] md:text-[9px] opacity-70">{formatVoiceDuration(msg.duration)}</span>

                {!msg.transcription && !isMe && (
                    <button
                        onClick={handleTranscribe}
                        disabled={loadingAI}
                        className={cn("size-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors ml-1", loadingAI && "animate-spin")}
                    >
                        <TypeIcon className="size-3 text-primary" />
                    </button>
                )}
            </div>

            {msg.transcription && (
                <div className={cn("text-[10px] italic border-l-2 pl-2 py-1 bg-black/5 rounded-r-lg", isMe ? "border-primary-foreground/40 text-primary-foreground/80" : "border-primary/40 text-muted-foreground")}>
                    "{msg.transcription}"
                </div>
            )}
        </div>
    );
};

const DeleteConfirmation = ({ onDeleteForMe, onDeleteForAll, onCancel }) => (
    <div className="absolute z-20 right-0 top-full mt-1 min-w-[160px] md:min-w-[200px] rounded-xl border bg-popover p-1.5 md:p-2 shadow-lg animate-in fade-in zoom-in-95">
        <p className="text-[10px] md:text-xs text-muted-foreground px-2 py-1 mb-1">Xabarni o'chirish</p>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm hover:bg-muted transition-colors" onClick={onDeleteForMe}><Trash2Icon className="size-3 md:size-3.5" /> O'zim uchun</button>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={onDeleteForAll}><Trash2Icon className="size-3 md:size-3.5" /> Hammasi uchun</button>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs text-muted-foreground hover:bg-muted transition-colors" onClick={onCancel}><XIcon className="size-2.5 md:size-3" /> Bekor qilish</button>
    </div>
);

const MessageList = ({
    messagesWithSeparators,
    searchHighlightIds,
    handleDoubleClick,
    handleContextMenu,
    handleReaction,
    handleDeleteForMe,
    handleDeleteForAll,
    handleDeleteCancel,
    renderTextWithLinks,
    isCoach,
    activeChat,
    readReceipts,
    reactionMsgId,
    deletingMsgId,
    multiSelectMode,
    selectedMsgIds,
    toggleMsgSelection,
    messageRefs,
    messagesEndRef,
    bottomSentinelRef,
}) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { votePoll, loadMoreMessages, messagesCursors } = useChatStore();
    const currentUserId = user?.id;
    const [showConfetti, setShowConfetti] = useState(false);
    const triggerCelebration = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000); };

    return (
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-1 relative custom-scrollbar">
            {showConfetti && <Confetti numberOfPieces={150} recycle={false} gravity={0.3} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />}

            {messagesCursors[activeChat] && (
                <button
                    onClick={() => loadMoreMessages(activeChat)}
                    className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground"
                >
                    Oldingi xabarlarni ko'rish
                </button>
            )}

            {messagesWithSeparators.map((item, index) => {
                if (item.type === "separator") return <div key={item.key} className="text-center my-3 md:my-4"><span className="text-[9px] md:text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full uppercase tracking-widest">{item.label === "today" ? "Bugun" : item.label === "yesterday" ? "Kecha" : item.label}</span></div>;
                const msg = item.msg;
                const isMe = msg.sender?.id === currentUserId || msg.from === "me";
                const prevMsg = index > 0 && messagesWithSeparators[index - 1].type === "message" ? messagesWithSeparators[index - 1].msg : null;
                const isSequence = prevMsg && (prevMsg.from === msg.from) && (new Date(msg.time).getTime() - new Date(prevMsg?.time).getTime() < 60000);

                return (
                    <div key={msg.id} ref={el => { if (el) messageRefs.current[msg.id] = el; }} className={cn("flex relative group py-0.5", isMe ? "justify-end" : "justify-start", searchHighlightIds.has(msg.id) && "bg-yellow-500/10", multiSelectMode && "pl-8")}>
                        <div className={cn("max-w-[85%] md:max-w-[75%] px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm relative shadow-sm transition-all", isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-background border rounded-2xl rounded-tl-sm", isSequence && isMe && "rounded-tr-2xl mt-0.5", isSequence && !isMe && "rounded-tl-2xl mt-0.5", msg.type === "video_note" && "bg-transparent border-0 shadow-none p-0", msg.ttl && "border-orange-500/50 bg-gradient-to-br from-background to-orange-500/5")} onDoubleClick={() => handleDoubleClick(msg.id)} onContextMenu={e => handleContextMenu(e, msg)}>
                            {msg.ttl && <div className="absolute -top-2 -right-2 size-5 rounded-full bg-orange-500 flex items-center justify-center animate-bounce shadow-lg z-10"><TimerIcon className="size-3 text-white" /></div>}

                            {/* Reply Preview */}
                            {msg.replyTo && (
                                <button 
                                    onClick={() => {
                                        const el = messageRefs.current[msg.replyTo.id];
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className={cn(
                                        "mb-2 p-2 rounded-lg border-l-4 text-left block w-full transition-colors",
                                        isMe ? "bg-primary-foreground/10 border-primary-foreground/40 hover:bg-primary-foreground/20" : "bg-muted border-primary/40 hover:bg-muted/80"
                                    )}
                                >
                                    <p className={cn("text-[10px] font-black uppercase truncate", isMe ? "text-primary-foreground" : "text-primary")}>
                                        {msg.replyTo.senderName}
                                    </p>
                                    <p className="text-[11px] truncate opacity-80">{msg.replyTo.text}</p>
                                </button>
                            )}

                            {msg.type === "poll" ? <div className="space-y-2 md:space-y-3 min-w-[180px] md:min-w-[220px] py-1"><div className="flex items-center gap-2 font-bold mb-1.5 text-xs md:text-sm"><span>📊</span><span>{msg.metadata.question}</span></div>{map(msg.metadata.options, (opt, i) => <div key={i} className="space-y-1"><button onClick={() => votePoll(activeChat, msg.id, i, currentUserId)} className={cn("w-full flex items-center justify-between p-1.5 rounded-lg border text-[10px]", opt.votes.includes(currentUserId) ? "bg-primary/20 border-primary" : "bg-muted/20 border-transparent")}><span>{opt.text}</span><span>{round((opt.votes.length / (msg.metadata.totalVotes || 1)) * 100)}%</span></button><Progress value={(opt.votes.length / (msg.metadata.totalVotes || 1)) * 100} className="h-1" /></div>)}</div>
                                : msg.type === "task" ? <InteractiveTask metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} onComplete={triggerCelebration} />
                                    : msg.type === "habit_tracker" ? <HabitTrackerWidget metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} />
                                        : msg.type === "booking" ? <BookingWidget metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} />
                                            : msg.type === "invoice" ? <InvoiceWidget metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} onPay={triggerCelebration} />
                                                : msg.type === "shared_content" && msg.metadata.contentType === "challenge" ? (
                                                    <ChallengeSharedWidget 
                                                        metadata={msg.metadata} 
                                                        onJoin={() => navigate(`/challenges/${msg.metadata.contentId}`)} 
                                                    />
                                                )
                                                                                            : msg.type === "video_note" ? <VideoNotePlayer mediaUrl={msg.mediaUrl} isMe={isMe} />
                                                                                                : msg.type === "voice" ? <VoiceMessagePlayer msg={msg} activeChat={activeChat} isMe={isMe} />
                                                                                                    : msg.type === "image" ? (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="rounded-lg overflow-hidden border bg-muted/20">
                                                                                                                <img 
                                                                                                                    src={msg.mediaUrl} 
                                                                                                                    alt="Chat media" 
                                                                                                                    className="max-w-full max-h-60 md:max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                                                                    onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                                                                />
                                                                                                            </div>
                                                                                                            {msg.text && msg.text !== "📷 Rasm" && <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(msg.text, isMe)}</p>}
                                                                                                        </div>
                                                                                                    )
                                                                                                    : msg.type === "file" ? (
                                                                                                        <div className="space-y-2">
                                                                                                            <a 
                                                                                                                href={msg.mediaUrl} 
                                                                                                                target="_blank" 
                                                                                                                rel="noopener noreferrer"
                                                                                                                className={cn(
                                                                                                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                                                                                    isMe ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-muted/50 border-border hover:bg-muted"
                                                                                                                )}
                                                                                                            >
                                                                                                                                                                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                                                                                                                                    <FileIcon className="size-5" />
                                                                                                                                                                                </div>                                                                                                                <div className="min-w-0 flex-1">
                                                                                                                    <p className="text-xs font-bold truncate">Fayl</p>
                                                                                                                    <p className="text-[10px] opacity-60">Ko'rish uchun bosing</p>
                                                                                                                </div>
                                                                                                            </a>
                                                                                                            {msg.text && msg.text !== "📎 Fayl" && <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(msg.text, isMe)}</p>}
                                                                                                        </div>
                                                                                                    )
                                                                                                    : (
                                                                                                        <div className="space-y-1">                                                                <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(msg.text, isMe)}</p>
                                                                {msg.translation && (
                                                                    <div className={cn("text-[10px] border-t pt-1 mt-1 flex items-start gap-1.5", isMe ? "border-primary-foreground/20 text-primary-foreground/70" : "border-muted text-muted-foreground")}>
                                                                        <LanguagesIcon className="size-2.5 shrink-0 mt-0.5" />
                                                                        <span>{msg.translation}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                            <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                <span className="text-[9px] md:text-[10px]">{msg.time}</span>
                                {isMe && <span>{msg.status === "sent" ? <Check className="size-2.5" /> : <CheckCheck className={cn("size-2.5", msg.status === "read" && "text-blue-400")} />}</span>}
                                {msg.ttl && <FlameIcon className="size-2.5 text-orange-500 animate-pulse ml-1" />}
                            </div>

                            {reactionMsgId === msg.id && <div data-reaction-picker className={cn("absolute z-10 flex gap-1 bg-background border rounded-full px-1.5 py-1 shadow-lg -top-9", isMe ? "right-0" : "left-0")}>{["👍", "❤️", "🔥", "😂", "👏"].map(emoji => <button key={emoji} className="text-sm hover:scale-125 transition-transform" onClick={e => { e.stopPropagation(); handleReaction(msg.id, emoji); }}>{emoji}</button>)}</div>}
                            {deletingMsgId === msg.id && <DeleteConfirmation onDeleteForMe={handleDeleteForMe} onDeleteForAll={handleDeleteForAll} onCancel={handleDeleteCancel} />}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} /><div ref={bottomSentinelRef} className="h-1" />
        </div>
    );
};

export default MessageList;
